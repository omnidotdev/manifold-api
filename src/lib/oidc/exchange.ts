import { and, eq } from "drizzle-orm";
import { decodeJwt } from "jose";

import { generateApiToken } from "lib/auth/token";
import {
  apiTokenTable,
  isValidScope,
  namespaceTable,
  oidcIssuerTable,
  trustedPublisherTable,
} from "lib/db/schema";
import { selectTrustedPublisher } from "./match";
import { verifyOidcToken } from "./verify";

import type dbPool from "lib/db/dbPool";

/** Default lifetime of a minted ephemeral publish token (15 minutes). */
const DEFAULT_TTL_SECONDS = 15 * 60;

type Db = typeof dbPool;

interface ExchangeInput {
  /** The presented OIDC identity token (raw JWT). */
  token: string;
  /** Target namespace name (e.g. "omnidotdev"). */
  namespace: string;
  /** Requested permission for the minted token. */
  scope: string;
  /** Override the minted token's lifetime (seconds). */
  ttlSeconds?: number;
}

type ExchangeResult =
  | {
      ok: true;
      plaintextToken: string;
      token: {
        scope: string;
        namespaceId: string;
        repositoryId: string | null;
        expiresAt: string | null;
      };
    }
  | { ok: false; status: number; error: string };

/**
 * Exchange a trusted OIDC identity token for an ephemeral `mf_` publish token.
 *
 * Never trusts the token before verifying it: the unverified `iss` claim is
 * used only to pick which issuer (and JWKS) to verify against; the mint only
 * proceeds once the signature and registered claims check out AND a trusted
 * publisher binding authorizes the exact subject, claims, namespace, and scope.
 */
export const exchangeOidcForToken = async (
  db: Db,
  { token, namespace, scope, ttlSeconds = DEFAULT_TTL_SECONDS }: ExchangeInput,
): Promise<ExchangeResult> => {
  if (!isValidScope(scope)) {
    return { ok: false, status: 400, error: "Invalid scope" };
  }

  // Read the issuer claim WITHOUT trusting it, only to route to the right
  // issuer record and JWKS. Verification below re-checks `iss` cryptographically.
  let issuerClaim: unknown;
  try {
    issuerClaim = decodeJwt(token).iss;
  } catch {
    return { ok: false, status: 401, error: "Malformed token" };
  }
  if (typeof issuerClaim !== "string") {
    return { ok: false, status: 401, error: "Token has no issuer" };
  }

  const [issuer] = await db
    .select()
    .from(oidcIssuerTable)
    .where(
      and(
        eq(oidcIssuerTable.issuer, issuerClaim),
        eq(oidcIssuerTable.enabled, true),
      ),
    );
  if (!issuer) {
    return { ok: false, status: 401, error: "Untrusted issuer" };
  }

  let claims: Record<string, unknown>;
  try {
    claims = await verifyOidcToken(token, issuer);
  } catch {
    return { ok: false, status: 401, error: "Token verification failed" };
  }

  const [namespaceRow] = await db
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespace));
  if (!namespaceRow) {
    return { ok: false, status: 404, error: "Namespace not found" };
  }

  const candidates = await db
    .select()
    .from(trustedPublisherTable)
    .where(
      and(
        eq(trustedPublisherTable.namespaceId, namespaceRow.id),
        eq(trustedPublisherTable.issuerId, issuer.id),
        eq(trustedPublisherTable.isActive, true),
      ),
    );

  const binding = selectTrustedPublisher(candidates, claims, scope);
  if (!binding) {
    return {
      ok: false,
      status: 403,
      error: "No trusted publisher authorizes this request",
    };
  }

  const generated = generateApiToken();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const subject = typeof claims.sub === "string" ? claims.sub : "unknown";

  const [created] = await db
    .insert(apiTokenTable)
    .values({
      name: `oidc:${binding.subject}`,
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      namespaceId: namespaceRow.id,
      repositoryId: binding.repositoryId,
      scope,
      createdBy: `oidc:${subject}`,
      description: "Ephemeral token minted via OIDC trusted publishing",
      expiresAt,
    })
    .returning({
      scope: apiTokenTable.scope,
      namespaceId: apiTokenTable.namespaceId,
      repositoryId: apiTokenTable.repositoryId,
      expiresAt: apiTokenTable.expiresAt,
    });

  await db
    .update(trustedPublisherTable)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(trustedPublisherTable.id, binding.id));

  return { ok: true, plaintextToken: generated.plaintext, token: created };
};
