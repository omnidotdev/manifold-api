import { and, eq } from "drizzle-orm";

import { hashToken, isValidTokenFormat } from "lib/auth/token";
import { dbPool } from "lib/db";
import { apiTokenTable } from "lib/db/schema";

/**
 * Result of registry token authentication.
 */
export interface RegistryAuthResult {
  namespaceId: string;
  repositoryId: string | null;
  scope: string;
}

/** Strip an optional `Bearer ` prefix so both `mf_...` and `Bearer mf_...` work */
const stripBearer = (header: string): string =>
  header.replace(/^Bearer\s+/i, "").trim();

/**
 * Authenticate a registry request using an `mf_` API token. Accepts the token
 * bare or with a `Bearer ` prefix, matching how CLIs and CI runners send it.
 *
 * @param authHeader - Raw `Authorization` header value
 * @returns Auth result or null if invalid/missing
 */
export const authenticateRegistryToken = async (
  authHeader: string | null,
): Promise<RegistryAuthResult | null> => {
  if (!authHeader) return null;

  const token = stripBearer(authHeader);

  if (!isValidTokenFormat(token)) return null;

  const hash = hashToken(token);

  const [row] = await dbPool
    .select()
    .from(apiTokenTable)
    .where(
      and(eq(apiTokenTable.tokenHash, hash), eq(apiTokenTable.isActive, true)),
    )
    .limit(1);

  if (!row) return null;

  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;

  void dbPool
    .update(apiTokenTable)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiTokenTable.id, row.id))
    .catch(() => {});

  return {
    namespaceId: row.namespaceId,
    repositoryId: row.repositoryId,
    scope: row.scope,
  };
};

/**
 * Require write permission for a registry operation.
 *
 * @returns Auth result or throws with error detail
 */
export const requireRegistryWrite = async (
  authHeader: string | null,
): Promise<RegistryAuthResult> => {
  const auth = await authenticateRegistryToken(authHeader);

  if (!auth) throw new Error("authentication required");

  if (auth.scope !== "write" && auth.scope !== "admin") {
    throw new Error("insufficient permissions: write scope required");
  }

  return auth;
};
