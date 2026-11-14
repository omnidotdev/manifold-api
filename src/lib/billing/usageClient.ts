import {
  BILLING_BASE_URL,
  BILLING_SERVICE_API_KEY,
} from "lib/config/env.config";

const APP_ID = "manifold";
const REQUEST_TIMEOUT_MS = 5_000;

type UsageRecordResponse = {
  meterId: string;
  value: number;
  limit: number | null;
  remaining: number | null;
};

/** A usage check verdict, as callers in this service consume it */
type UsageCheckResponse = {
  withinLimit: boolean;
  value: number;
  limit: number | null;
  remaining: number | null;
};

/**
 * Body of Aether's `GET /usage/:appId/:entityType/:entityId/:meterKey/check`.
 * The verdict is `allowed` and the meter reading is `current`; reading
 * `withinLimit` / `value` straight off it yields undefined, which made every
 * check look over-limit and 402'd every registry pull once billing was wired
 */
type AetherUsageCheck = {
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
};

/** Body of Aether's `GET /usage/:appId/:entityType/:entityId/summary` */
type UsageSummaryResponse = {
  billingAccountId: string;
  tier: string | null;
  meters: {
    key: string;
    value: number;
    limit: number | null;
    remaining: number | null;
    resetsAt: string | null;
  }[];
  credits: { balance: number } | null;
};

/**
 * Map Aether's check body onto `UsageCheckResponse`. Returns null for a body
 * without a boolean verdict (an error payload or an unexpected shape), so the
 * caller fails open exactly as it does for an unreachable Aether
 */
export const parseUsageCheck = (body: unknown): UsageCheckResponse | null => {
  if (typeof body !== "object" || body === null) return null;

  const check = body as Partial<AetherUsageCheck>;
  if (typeof check.allowed !== "boolean") return null;

  return {
    withinLimit: check.allowed,
    value: check.current ?? 0,
    limit: check.limit ?? null,
    remaining: check.remaining ?? null,
  };
};

/**
 * Send an authenticated request to Aether's usage API.
 *
 * Returns `null` when billing is unconfigured, the request fails,
 * or the response is non-2xx so callers can degrade gracefully.
 *
 * @param path - API path appended to `BILLING_BASE_URL`
 * @param options - Optional fetch overrides
 */
async function aetherFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  if (!BILLING_BASE_URL || !BILLING_SERVICE_API_KEY) return null;

  try {
    const response = await fetch(`${BILLING_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-service-api-key": BILLING_SERVICE_API_KEY,
        ...options?.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Record a usage delta against a metered resource.
 *
 * @param entityType - Billing entity kind (e.g. "organization")
 * @param entityId - Billing entity identifier
 * @param meterKey - Meter to increment (e.g. "storage_bytes")
 * @param delta - Amount to add (positive) or subtract (negative)
 * @param idempotencyKey - Optional key to prevent duplicate recording
 */
export async function recordUsage(
  entityType: string,
  entityId: string,
  meterKey: string,
  delta: number,
  idempotencyKey?: string,
): Promise<UsageRecordResponse | null> {
  return aetherFetch<UsageRecordResponse>(
    `/usage/${APP_ID}/${entityType}/${entityId}/${meterKey}/record`,
    {
      method: "POST",
      body: JSON.stringify({ delta, idempotencyKey }),
    },
  );
}

/**
 * Check whether an entity is within its usage limit for a meter.
 *
 * Optionally simulates adding `additionalUsage` before checking so
 * callers can pre-validate an operation without committing it.
 *
 * @param entityType - Billing entity kind (e.g. "organization")
 * @param entityId - Billing entity identifier
 * @param meterKey - Meter to check (e.g. "storage_bytes")
 * @param additionalUsage - Hypothetical delta to include in the check
 */
export async function checkUsage(
  entityType: string,
  entityId: string,
  meterKey: string,
  additionalUsage?: number,
): Promise<UsageCheckResponse | null> {
  const query = additionalUsage ? `?additionalUsage=${additionalUsage}` : "";

  const body = await aetherFetch<unknown>(
    `/usage/${APP_ID}/${entityType}/${entityId}/${meterKey}/check${query}`,
  );

  return parseUsageCheck(body);
}

/**
 * Retrieve an aggregate usage summary for an entity.
 *
 * Includes the current tier, all meter values with their limits,
 * and the remaining credit balance (if applicable).
 *
 * @param entityType - Billing entity kind (e.g. "organization")
 * @param entityId - Billing entity identifier
 */
export async function getUsageSummary(
  entityType: string,
  entityId: string,
): Promise<UsageSummaryResponse | null> {
  return aetherFetch<UsageSummaryResponse>(
    `/usage/${APP_ID}/${entityType}/${entityId}/summary`,
  );
}
