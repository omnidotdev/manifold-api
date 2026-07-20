import { and, count, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import { namespaceTable, repositoryTable } from "lib/db/schema";
import { limitExceeded } from "./errors";
import { getLimit, getTier, resolveEntitlements } from "./resolve";
import { checkUsage } from "./usageClient";

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
