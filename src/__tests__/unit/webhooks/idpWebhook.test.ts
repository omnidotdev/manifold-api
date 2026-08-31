import { createHmac } from "node:crypto";

import { describe, expect, test } from "bun:test";

import { createIdpWebhook } from "lib/idp/webhooks";

/**
 * `createIdpWebhook` is parameterized by secret precisely so these tests can
 * exercise both the "unset" and "set" branches directly, since the real
 * AUTH_WEBHOOK_SECRET export is snapshotted once at process boot (before
 * bunfig's preload even runs) and can't be toggled between test cases.
 */

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://api.manifold.omni.dev/idp", {
    method: "POST",
    body,
    headers,
  });

const validPayload = JSON.stringify({
  eventType: "organization.deleted",
  organizationId: "org_123",
  deletedAt: new Date().toISOString(),
});

describe("idp webhook, secret unset", () => {
  test("rejects with 503 and never touches the body", async () => {
    const app = createIdpWebhook(undefined);

    // Deliberately malformed JSON: if the guard failed to fail closed and
    // fell through to JSON.parse, this would surface as a 500, not a 503
    const res = await app.handle(
      req("not valid json{{{", {
        "x-idp-signature": "irrelevant",
        "x-idp-event": "organization.deleted",
      }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Webhook secret not configured",
    });
  });

  test("rejects even a well-formed, unsigned request", async () => {
    const app = createIdpWebhook(undefined);
    const res = await app.handle(req(validPayload));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Webhook secret not configured",
    });
  });
});

describe("idp webhook, secret set", () => {
  const secret = "test-idp-secret";

  test("rejects with 401 on a wrong signature", async () => {
    const app = createIdpWebhook(secret);
    const res = await app.handle(
      req(validPayload, {
        "x-idp-signature": "0".repeat(64),
        "x-idp-event": "organization.deleted",
      }),
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid signature" });
  });

  test("rejects with 401 when the signature header is missing", async () => {
    const app = createIdpWebhook(secret);
    const res = await app.handle(req(validPayload));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Missing signature" });
  });

  test("accepts a correctly-signed request", async () => {
    const app = createIdpWebhook(secret);
    const res = await app.handle(
      req(validPayload, {
        "x-idp-signature": sign(validPayload, secret),
        "x-idp-event": "organization.deleted",
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
