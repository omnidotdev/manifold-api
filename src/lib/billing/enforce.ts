import { and, count, eq, gt, isNull, or } from "drizzle-orm";

import { dbPool } from "lib/db";
import { apiTokenTable, namespaceTable, repositoryTable } from "lib/db/schema";
import { limitExceeded } from "./errors";
import { getLimit, getTier, resolveEntitlements } from "./resolve";
import { checkUsage } from "./usageClient";

type Db = typeof dbPool;
type ResolveEntitlements = typeof resolveEntitlements;

/**
 * Enforce a metered usage limit for an organization.
 *
 * Returns a ready-to-send `{ status, body }` (402 Payment Required) when the org
 * is over its limit for `meterKey` -- counting `additionalUsage` units about to
 * be consumed -- or `null` to proceed. A no-op when billing is not configured
 * (`checkUsage` returns null), so self-hosted / unconfigured deployments are
 * never gated. `resolveEntitlements` is only fetched on the over-limit path.
 */
export const enforceUsageLimit = async (
  orgId: string,
  meterKey: string,
  label: string,
  additionalUsage?: number,
): Promise<{ status: number; body: unknown } | null> => {
  const check = await checkUsage(
    "organization",
    orgId,
    meterKey,
    additionalUsage,
  );
  if (!check || check.withinLimit) return null;
  const tier = getTier(await resolveEntitlements(orgId));
  return limitExceeded(label, check.value, check.limit ?? 0, tier);
};

/**
 * Enforce the `max_private_repos` count limit before a NEW private repository is
 * created for an org. Returns a 402 `{ status, body }` when the org already has
 * as many private repos as its tier allows, or null to proceed. No-op when
 * billing is unconfigured or the limit is unlimited (`getLimit` returns -1).
 */
export const enforcePrivateRepoLimit = async (
  orgId: string,
): Promise<{ status: number; body: unknown } | null> => {
  const entitlements = await resolveEntitlements(orgId);
  const limit = getLimit(entitlements, "max_private_repos");
  if (limit === -1) return null;

  const [row] = await dbPool
    .select({ count: count() })
    .from(repositoryTable)
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .where(
      and(
        eq(namespaceTable.organizationId, orgId),
        eq(repositoryTable.isPublic, false),
      ),
    );
  const current = row?.count ?? 0;
  if (current >= limit) {
    return limitExceeded(
      "Private repositories",
      current,
      limit,
      getTier(entitlements),
    );
  }
  return null;
};

/**
 * Enforce the `max_api_tokens` count limit before a NEW API token is created.
 *
 * `max_api_tokens` is an ORGANIZATION limit, so the count spans every namespace
 * the org owns (the previous inline check in the tokens route counted a single
 * namespace, letting a user exceed the org limit by spreading tokens across
 * namespaces). Expired tokens are excluded so short-lived OIDC publish tokens
 * do not consume a persistent slot. `db` and `resolve` are injectable for
 * deterministic tests; defaults are the real pool and resolver. Returns a 402
 * `{ status, body }` when over the limit, or null to proceed.
 */
export const enforceApiTokenLimit = async (
  orgId: string,
  {
    db = dbPool,
    resolve = resolveEntitlements,
  }: {
    db?: Db;
    resolve?: ResolveEntitlements;
  } = {},
): Promise<{ status: number; body: unknown } | null> => {
  const entitlements = await resolve(orgId);
  const limit = getLimit(entitlements, "max_api_tokens");
  if (limit === -1) return null;

  const now = new Date().toISOString();
  const [row] = await db
    .select({ count: count() })
    .from(apiTokenTable)
    .innerJoin(namespaceTable, eq(apiTokenTable.namespaceId, namespaceTable.id))
    .where(
      and(
        eq(namespaceTable.organizationId, orgId),
        eq(apiTokenTable.isActive, true),
        or(isNull(apiTokenTable.expiresAt), gt(apiTokenTable.expiresAt, now)),
      ),
    );
  const current = row?.count ?? 0;
  if (current >= limit) {
    return limitExceeded("API tokens", current, limit, getTier(entitlements));
  }
  return null;
};
