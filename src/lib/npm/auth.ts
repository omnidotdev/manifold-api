import { and, eq } from "drizzle-orm";

import { hashToken, isValidTokenFormat } from "lib/auth/token";
import { dbPool } from "lib/db";
import { apiTokenTable } from "lib/db/schema";

interface NpmAuthResult {
  namespaceId: string;
  scope: string;
}

/** Authenticate `Authorization: Bearer mf_…`; returns null if invalid. */
export const authenticateNpmToken = async (
  authHeader: string | null,
): Promise<NpmAuthResult | null> => {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
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
  return { namespaceId: row.namespaceId, scope: row.scope };
};

/** Require write scope; throws on failure. */
export const requireNpmWrite = async (
  authHeader: string | null,
): Promise<NpmAuthResult> => {
  const auth = await authenticateNpmToken(authHeader);
  if (!auth) throw new Error("authentication required");
  if (auth.scope !== "write" && auth.scope !== "admin") {
    throw new Error("insufficient permissions: write scope required");
  }
  return auth;
};
