import { useGenericAuth } from "@envelop/generic-auth";
import { QueryClient } from "@tanstack/query-core";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import ms from "ms";

import { hashToken, isValidTokenFormat } from "lib/auth/token";
import { AUTH_BASE_URL } from "lib/config/env.config";
import { dbPool } from "lib/db";
import { apiTokenTable } from "lib/db/schema";

import type { ResolveUserFn } from "@envelop/generic-auth";
import type { JWTPayload } from "jose";
import type {
  ContextObserver,
  GraphQLContext,
  TokenObserver,
} from "lib/graphql/createGraphqlContext";
import type { TokenScope } from "lib/db/schema";

interface UserInfoClaims extends JWTPayload {
  sub: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
  email?: string;
}

class AuthenticationError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: ms("2m"),
    },
  },
});

/**
 * Remote JWKS for verifying JWT signatures from Gatekeeper.
 * jose's createRemoteJWKSet handles caching and key rotation automatically.
 * @see https://www.better-auth.com/docs/plugins/jwt
 */
const JWKS = createRemoteJWKSet(
  new URL(`${AUTH_BASE_URL}/.well-known/jwks.json`),
);

/**
 * Verify JWT signature using Gatekeeper's JWKS endpoint.
 * Returns the verified payload or throws an error.
 */
const verifyAccessToken = async (token: string): Promise<UserInfoClaims> => {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: AUTH_BASE_URL,
  });

  if (!payload.sub) {
    throw new AuthenticationError(
      "Missing required 'sub' claim",
      "MISSING_SUB_CLAIM",
    );
  }

  return payload as UserInfoClaims;
};

/**
 * Validate token claims.
 */
const validateClaims = (claims: UserInfoClaims): void => {
  const now = Math.floor(Date.now() / 1000);

  // validate `exp`
  if (claims.exp !== undefined && claims.exp < now)
    throw new AuthenticationError("Token has expired", "TOKEN_EXPIRED");

  // validate `iat` (reject tokens issued in the future with clock skew allowance)
  if (claims.iat !== undefined && claims.iat > now + ms("1m"))
    throw new AuthenticationError(
      "Token issued in the future",
      "INVALID_TOKEN_IAT",
    );

  // validate issuer
  if (AUTH_BASE_URL && claims.iss !== undefined && claims.iss !== AUTH_BASE_URL)
    throw new AuthenticationError(
      "Token issuer mismatch",
      "INVALID_TOKEN_ISSUER",
    );
};

/**
 * Resolve user from API token.
 *
 * @param token - Plaintext token from Authorization header
 * @returns Token observer or null if invalid
 */
const resolveFromApiToken = async (
  token: string,
): Promise<TokenObserver | null> => {
  if (!isValidTokenFormat(token)) return null;

  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  const [tokenRecord] = await dbPool
    .select()
    .from(apiTokenTable)
    .where(
      and(
        eq(apiTokenTable.tokenHash, tokenHash),
        eq(apiTokenTable.isActive, true),
        or(isNull(apiTokenTable.expiresAt), gt(apiTokenTable.expiresAt, now)),
      ),
    )
    .limit(1);

  if (!tokenRecord) return null;

  // update last used timestamp (fire and forget)
  dbPool
    .update(apiTokenTable)
    .set({ lastUsedAt: now })
    .where(eq(apiTokenTable.id, tokenRecord.id))
    .execute()
    .catch((err) => console.error("[Auth] Failed to update lastUsedAt:", err));

  return {
    id: `token:${tokenRecord.id}`,
    name: tokenRecord.name,
    isApiToken: true,
    tokenId: tokenRecord.id,
    tokenName: tokenRecord.name,
    scope: tokenRecord.scope as TokenScope,
    namespaceId: tokenRecord.namespaceId,
    repositoryId: tokenRecord.repositoryId,
  };
};

/**
 * Validate user session and resolve user if successful.
 * @see https://the-guild.dev/graphql/envelop/plugins/use-generic-auth#getting-started
 */
const resolveUser: ResolveUserFn<ContextObserver, GraphQLContext> = async (ctx) => {
  try {
    const accessToken = ctx.request.headers
      .get("authorization")
      ?.split("Bearer ")[1];

    if (!accessToken) {
      if (process.env.PROTECT_ROUTES !== "true") return null;

      throw new AuthenticationError(
        "Invalid or missing access token",
        "MISSING_TOKEN",
      );
    }

    // check if this is an API token (starts with mf_)
    if (accessToken.startsWith("mf_")) {
      const tokenObserver = await resolveFromApiToken(accessToken);
      if (!tokenObserver) {
        throw new AuthenticationError(
          "Invalid or expired API token",
          "INVALID_API_TOKEN",
        );
      }
      return tokenObserver;
    }

    // verify JWT signature using JWKS (cryptographic verification)
    const verifiedPayload = await verifyAccessToken(accessToken);

    // fetch additional claims from userinfo (org membership, profile data)
    // access tokens may not contain all claims, userinfo provides the full set
    const claims = await queryClient.ensureQueryData({
      queryKey: ["UserInfo", { accessToken }],
      queryFn: async () => {
        const response = await fetch(`${AUTH_BASE_URL}/oauth2/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new AuthenticationError(
            "Invalid access token or request failed",
            "USERINFO_FAILED",
          );
        }

        const userInfoClaims: UserInfoClaims = await response.json();

        return userInfoClaims;
      },
    });

    if (!claims) {
      if (process.env.PROTECT_ROUTES !== "true") return null;

      throw new AuthenticationError(
        "Invalid access token or request failed",
        "INVALID_CLAIMS",
      );
    }

    // validate time-based claims from verified payload
    validateClaims(verifiedPayload);

    // return observer from claims (no local user table)
    return {
      id: claims.sub,
      name: claims.name ?? claims.preferred_username,
      email: claims.email,
    };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      console.error(`[Auth] ${err.code}: ${err.message}`);
    } else {
      console.error("[Auth] Unexpected error:", err);
    }

    return null;
  }
};

/**
 * Create authentication plugin.
 * Factory function to ensure mode is evaluated at runtime, not module load time.
 * @see https://the-guild.dev/graphql/envelop/plugins/use-generic-auth
 */
const createAuthenticationPlugin = () =>
  useGenericAuth({
    contextFieldName: "observer",
    resolveUserFn: resolveUser,
    mode:
      process.env.PROTECT_ROUTES === "true" ? "protect-all" : "resolve-only",
  });

export default createAuthenticationPlugin;
