import { limitExceeded } from "./errors";
import { getTier, resolveEntitlements } from "./resolve";
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
