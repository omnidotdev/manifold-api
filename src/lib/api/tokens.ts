import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { generateApiToken } from "lib/auth/token";
import { dbPool } from "lib/db";
import { apiTokenTable, isValidScope } from "lib/db/schema";

import type { TokenScope } from "lib/db/schema";

/**
 * Extract bearer token from Authorization header.
 */
const extractBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
};

/**
 * Resolve user ID from JWT by calling userinfo endpoint.
 * In production, this would validate the JWT properly.
 */
const resolveUserFromJwt = async (
  token: string,
): Promise<{ id: string } | null> => {
  const authBaseUrl = process.env.AUTH_BASE_URL;
  if (!authBaseUrl) return null;

  try {
    const response = await fetch(`${authBaseUrl}/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.sub ? { id: data.sub } : null;
  } catch {
    return null;
  }
};

/**
 * API tokens REST endpoints.
 *
 * These endpoints manage API tokens for service account authentication.
 * They sit alongside the GraphQL API because token creation requires
 * returning the plaintext token (which shouldn't be stored or exposed via GraphQL).
 */
const tokensApi = new Elysia({ prefix: "/api/tokens" })
  // create a new API token
  .post(
    "/",
    async ({ body, headers, set }) => {
      const authToken = extractBearerToken(headers.authorization ?? null);
      if (!authToken || authToken.startsWith("mf_")) {
        set.status = 401;
        return { error: "User authentication required (JWT, not API token)" };
      }

      const user = await resolveUserFromJwt(authToken);
      if (!user) {
        set.status = 401;
        return { error: "Invalid or expired JWT" };
      }

      const { name, namespaceId, repositoryId, scope, description, expiresAt } =
        body;

      if (!isValidScope(scope)) {
        set.status = 400;
        return { error: "Invalid scope. Must be read, write, or admin" };
      }

      // generate token
      const token = generateApiToken();

      // insert into database
      const [created] = await dbPool
        .insert(apiTokenTable)
        .values({
          name,
          tokenHash: token.hash,
          tokenPrefix: token.prefix,
          namespaceId,
          repositoryId: repositoryId ?? null,
          scope: scope as TokenScope,
          createdBy: user.id,
          description: description ?? null,
          expiresAt: expiresAt ?? null,
        })
        .returning({
          id: apiTokenTable.id,
          name: apiTokenTable.name,
          tokenPrefix: apiTokenTable.tokenPrefix,
          namespaceId: apiTokenTable.namespaceId,
          repositoryId: apiTokenTable.repositoryId,
          scope: apiTokenTable.scope,
          createdAt: apiTokenTable.createdAt,
          expiresAt: apiTokenTable.expiresAt,
        });

      // return token with plaintext (SHOW ONCE)
      return {
        token: created,
        plaintextToken: token.plaintext,
        warning: "Store this token securely. It cannot be retrieved again.",
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        namespaceId: t.String({ format: "uuid" }),
        repositoryId: t.Optional(t.String({ format: "uuid" })),
        scope: t.String(),
        description: t.Optional(t.String({ maxLength: 1000 })),
        expiresAt: t.Optional(t.String()),
      }),
    },
  )
  // list user's tokens (without plaintext)
  .get("/", async ({ headers, set }) => {
    const authToken = extractBearerToken(headers.authorization ?? null);
    if (!authToken || authToken.startsWith("mf_")) {
      set.status = 401;
      return { error: "User authentication required" };
    }

    const user = await resolveUserFromJwt(authToken);
    if (!user) {
      set.status = 401;
      return { error: "Invalid or expired JWT" };
    }

    const tokens = await dbPool
      .select({
        id: apiTokenTable.id,
        name: apiTokenTable.name,
        tokenPrefix: apiTokenTable.tokenPrefix,
        namespaceId: apiTokenTable.namespaceId,
        repositoryId: apiTokenTable.repositoryId,
        scope: apiTokenTable.scope,
        isActive: apiTokenTable.isActive,
        lastUsedAt: apiTokenTable.lastUsedAt,
        createdAt: apiTokenTable.createdAt,
        expiresAt: apiTokenTable.expiresAt,
      })
      .from(apiTokenTable)
      .where(eq(apiTokenTable.createdBy, user.id));

    return { tokens };
  })
  // revoke a token
  .delete("/:id", async ({ params, headers, set }) => {
    const authToken = extractBearerToken(headers.authorization ?? null);
    if (!authToken || authToken.startsWith("mf_")) {
      set.status = 401;
      return { error: "User authentication required" };
    }

    const user = await resolveUserFromJwt(authToken);
    if (!user) {
      set.status = 401;
      return { error: "Invalid or expired JWT" };
    }

    const [updated] = await dbPool
      .update(apiTokenTable)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(apiTokenTable.id, params.id),
          eq(apiTokenTable.createdBy, user.id),
        ),
      )
      .returning({
        id: apiTokenTable.id,
        name: apiTokenTable.name,
        isActive: apiTokenTable.isActive,
      });

    if (!updated) {
      set.status = 404;
      return { error: "Token not found or not owned by user" };
    }

    return { token: updated, message: "Token revoked successfully" };
  });

export default tokensApi;
