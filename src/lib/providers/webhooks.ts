import { createHmac, timingSafeEqual } from "node:crypto";

import { Elysia, t } from "elysia";

import { BILLING_WEBHOOK_SECRET } from "lib/config/env.config";
import { billing } from "lib/providers";

interface BillingWebhookPayload {
  eventType: string;
  entityType: string;
  entityId: string;
  productId: string;
  featureKey?: string;
  value?: unknown;
  version: number;
  timestamp: string;
  billingAccountId?: string;
}

/**
 * Verify HMAC-SHA256 signature from the billing service.
 */
const verifySignature = (
  payload: string,
  signature: string,
  secret: string,
): boolean => {
  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

/**
 * Build the billing webhook receiver, parameterized by the signing secret so
 * it can be exercised with an injected secret in tests (the real
 * BILLING_WEBHOOK_SECRET is snapshotted at process boot, see the default
 * export below).
 *
 * This handler:
 * 1. Verifies HMAC-SHA256 signature
 * 2. Invalidates local billing cache
 */
export const createBillingWebhook = (secret: string | undefined) =>
  new Elysia().post(
    "/billing",
    async ({ request, headers, set }) => {
      const signature = headers["x-billing-signature"];

      try {
        const rawBody = await request.text();

        // Fail closed: without a configured secret the caller cannot be
        // authenticated, so reject rather than process an unverified webhook
        if (!secret) {
          console.warn(
            "BILLING_WEBHOOK_SECRET not set, rejecting unverifiable webhook",
          );
          set.status = 503;
          return { error: "Webhook secret not configured" };
        }

        if (!signature) {
          set.status = 401;
          return { error: "Missing signature" };
        }

        if (!verifySignature(rawBody, signature, secret)) {
          set.status = 401;
          return { error: "Invalid signature" };
        }

        const body = JSON.parse(rawBody) as BillingWebhookPayload;

        // Handle events - invalidate local cache
        switch (body.eventType) {
          case "entitlement.created":
          case "entitlement.updated":
          case "entitlement.deleted":
            billing?.invalidateCache?.(body.entityType, body.entityId);
            break;
          default:
            break;
        }

        set.status = 200;
        return { received: true };
      } catch (err) {
        console.error("Error processing billing webhook:", err);
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      headers: t.Object({
        "x-billing-signature": t.Optional(t.String()),
      }),
    },
  );

/**
 * Billing webhook receiver.
 * Receives entitlement change events from the billing service.
 */
const billingWebhook = createBillingWebhook(BILLING_WEBHOOK_SECRET);

export default billingWebhook;
