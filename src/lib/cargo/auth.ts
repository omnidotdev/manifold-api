import { and, eq } from "drizzle-orm";

import { hashToken, isValidTokenFormat } from "lib/auth/token";
import { dbPool } from "lib/db";
import { apiTokenTable } from "lib/db/schema";

/**
 * Result of token authentication.
 */
export interface CargoAuthResult {
  namespaceId: string;
  repositoryId: string | null;
  scope: string;
}

/**
 * Authenticate a Cargo request using an `mf_` API token.
 *
 * @param authHeader - Raw `Authorization` header value
 * @returns Auth result or null if invalid/missing
 */
export const authenticateCargoToken = async (
  authHeader: string | null,
): Promise<CargoAuthResult | null> => {
  if (!authHeader) return null;

  // Cargo sends "Authorization: <token>" (no Bearer prefix)
  const token = authHeader.trim();

  if (!isValidTokenFormat(token)) return null;

  const hash = hashToken(token);

  const [row] = await dbPool
    .select()
    .from(apiTokenTable)
    .where(
      and(
        eq(apiTokenTable.tokenHash, hash),
        eq(apiTokenTable.isActive, true),
      ),
    )
    .limit(1);

  if (!row) return null;

  // Check expiration
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;

  // Update last used timestamp (fire and forget)
  dbPool
    .update(apiTokenTable)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiTokenTable.id, row.id))
    .then(() => {});

  return {
    namespaceId: row.namespaceId,
    repositoryId: row.repositoryId,
    scope: row.scope,
  };
};

/**
 * Require write permission for a Cargo operation.
 *
 * @returns Auth result or throws with error detail
 */
export const requireCargoWrite = async (
  authHeader: string | null,
): Promise<CargoAuthResult> => {
  const auth = await authenticateCargoToken(authHeader);

  if (!auth) {
    throw new Error("authentication required");
  }

  if (auth.scope !== "write" && auth.scope !== "admin") {
    throw new Error("insufficient permissions: write scope required");
  }

  return auth;
};
