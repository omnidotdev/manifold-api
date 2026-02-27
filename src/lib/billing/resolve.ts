import { isWithinLimit } from "@omnidotdev/providers";

import { billing } from "lib/providers";

import type { EntitlementsResponse } from "@omnidotdev/providers";

/**
 * Resolve entitlements for a namespace's organization.
 * Returns null if billing is disabled (self-hosted) or organization is missing
 */
async function resolveEntitlements(
  organizationId: string | null,
): Promise<EntitlementsResponse | null> {
  if (!billing || !organizationId) return null;

  return billing.getEntitlements("organization", organizationId, "manifold");
}

/**
 * Get the current tier name from entitlements
 */
function getTier(entitlements: EntitlementsResponse | null): string {
  if (!entitlements) return "free";

  const tierEntitlement = entitlements.entitlements.find(
    (e) => e.featureKey === "tier",
  );

  return tierEntitlement?.value ?? "free";
}

/**
 * Check if the current resource count is within the entitlement limit.
 * Returns true if billing is disabled (self-hosted mode allows everything)
 */
function isAllowed(
  entitlements: EntitlementsResponse | null,
  featureKey: string,
  currentCount: number,
): boolean {
  if (!billing) return true;

  return isWithinLimit(entitlements, featureKey, currentCount);
}

/**
 * Get the numeric limit for a feature key.
 * Returns -1 (unlimited) if billing is disabled
 */
function getLimit(
  entitlements: EntitlementsResponse | null,
  featureKey: string,
): number {
  if (!entitlements) return -1;

  const entitlement = entitlements.entitlements.find(
    (e) => e.featureKey === featureKey,
  );

  if (!entitlement?.value) return -1;

  const parsed = Number(entitlement.value);
  return Number.isNaN(parsed) ? -1 : parsed;
}

/**
 * Check if a boolean feature is enabled.
 * Returns true if billing is disabled (self-hosted)
 */
function isFeatureEnabled(
  entitlements: EntitlementsResponse | null,
  featureKey: string,
): boolean {
  if (!billing) return true;
  if (!entitlements) return false;

  const entitlement = entitlements.entitlements.find(
    (e) => e.featureKey === featureKey,
  );

  return entitlement?.value === "1" || entitlement?.value === "true";
}

export {
  getLimit,
  getTier,
  isAllowed,
  isFeatureEnabled,
  resolveEntitlements,
};
