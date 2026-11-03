import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import { webhookTable } from "lib/db/schema";

/** Timeout for a single webhook delivery attempt */
const DELIVERY_TIMEOUT_MS = 5_000;

/**
 * Sign a payload with a webhook's secret (HMAC-SHA256), hex-encoded.
 */
export const signWebhook = (secret: string, body: string): string => {
  const hasher = new Bun.CryptoHasher("sha256", secret);
  hasher.update(body);
  return hasher.digest("hex");
};

/**
 * Deliver an event to every active webhook in an organization whose event
 * filter matches. Best-effort and fully isolated from the caller: it never
 * throws and never blocks the action that produced the event (callers invoke
 * it as `void dispatchWebhooks(...)`). Each delivery is signed and time-bounded.
 */
export const dispatchWebhooks = async (
  organizationId: string,
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> => {
  try {
    const hooks = await dbPool
      .select()
      .from(webhookTable)
      .where(
        and(
          eq(webhookTable.organizationId, organizationId),
          eq(webhookTable.isActive, true),
        ),
      );

    const matching = hooks.filter((h) => {
      const events = Array.isArray(h.events) ? (h.events as string[]) : [];
      return events.includes("*") || events.includes(eventType);
    });
    if (matching.length === 0) return;

    const body = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });

    await Promise.allSettled(
      matching.map((h) =>
        fetch(h.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Manifold-Event": eventType,
            "X-Manifold-Signature": `sha256=${signWebhook(h.secret, body)}`,
          },
          body,
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
        }),
      ),
    );
  } catch {
    // Delivery is best-effort; never surface a webhook failure to the caller
  }
};
