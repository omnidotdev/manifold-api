import { createHmac } from "node:crypto";

import { describe, expect, test } from "bun:test";

import { createBillingWebhook } from "lib/providers/webhooks";

/**
 * `createBillingWebhook` is parameterized by secret precisely so these tests
 * can exercise both the "unset" and "set" branches directly, since the real
 * BILLING_WEBHOOK_SECRET export is snapshotted once at process boot (before
 * bunfig's preload even runs) and can't be toggled between test cases.
 */

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://api.manifold.omni.dev/billing", {
    method: "POST",
    body,
    headers,
  });

const validPayload = JSON.stringify({
  eventType: "entitlement.updated",
  entityType: "organization",
  entityId: "org_123",
  productId: "manifold",
  version: 1,
  timestamp: new Date().toISOString(),
});

describe("billing webhook, secret unset", () => {
  test("rejects with 503 and never touches the body", async () => {
    const app = createBillingWebhook(undefined);

    // Deliberately malformed JSON: if the guard failed to fail closed and
    // fell through to JSON.parse, this would surface as a 500, not a 503
    const res = await app.handle(
      req("not valid json{{{", { "x-billing-signature": "irrelevant" }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Webhook secret not configured",
    });
  });

  test("rejects even a well-formed, unsigned request", async () => {
    const app = createBillingWebhook(undefined);
    const res = await app.handle(req(validPayload));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Webhook secret not configured",
    });
  });
});

describe("billing webhook, secret set", () => {
  const secret = "test-billing-secret";

  test("rejects with 401 on a wrong signature", async () => {
    const app = createBillingWebhook(secret);
    const res = await app.handle(
      req(validPayload, { "x-billing-signature": "0".repeat(64) }),
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid signature" });
  });

  test("rejects with 401 when the signature header is missing", async () => {
    const app = createBillingWebhook(secret);
    const res = await app.handle(req(validPayload));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Missing signature" });
  });

  test("accepts a correctly-signed request", async () => {
    const app = createBillingWebhook(secret);
    const res = await app.handle(
      req(validPayload, {
        "x-billing-signature": sign(validPayload, secret),
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
