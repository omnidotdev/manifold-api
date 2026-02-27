type BillingErrorCode =
  | "BILLING_LIMIT_EXCEEDED"
  | "BILLING_FEATURE_UNAVAILABLE"
  | "BILLING_UNAVAILABLE";

type BillingError = {
  error: BillingErrorCode;
  message: string;
  tier?: string;
  limit?: number;
  current?: number;
  upgradeUrl?: string;
};

const UPGRADE_URL = "https://manifold.omni.dev/pricing";

/**
 * Build a 402 response when a usage/resource limit is exceeded
 */
export function limitExceeded(
  resource: string,
  current: number,
  limit: number,
  tier: string,
): { status: 402; body: BillingError } {
  return {
    status: 402,
    body: {
      error: "BILLING_LIMIT_EXCEEDED",
      message: `${resource} limit reached (${formatLimit(current, limit)}). Upgrade your plan for more capacity`,
      tier,
      limit,
      current,
      upgradeUrl: UPGRADE_URL,
    },
  };
}

/**
 * Build a 403 response when a feature is not available on the current tier
 */
export function featureUnavailable(
  feature: string,
  tier: string,
): { status: 403; body: BillingError } {
  return {
    status: 403,
    body: {
      error: "BILLING_FEATURE_UNAVAILABLE",
      message: `${feature} is not available on the ${tier} plan`,
      tier,
      upgradeUrl: UPGRADE_URL,
    },
  };
}

/**
 * Format limit for display (handles byte values)
 */
function formatLimit(current: number, limit: number): string {
  if (limit >= 1_073_741_824) {
    return `${(current / 1_073_741_824).toFixed(1)} / ${(limit / 1_073_741_824).toFixed(0)} GB`;
  }
  if (limit >= 1_048_576) {
    return `${(current / 1_048_576).toFixed(0)} / ${(limit / 1_048_576).toFixed(0)} MB`;
  }
  return `${current} / ${limit}`;
}
