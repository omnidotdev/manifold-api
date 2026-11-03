import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { http, HttpResponse } from "msw";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable } from "lib/db/schema";
import { dispatchWebhooks, signWebhook } from "lib/webhooks/dispatch";
import webhooksRouter from "lib/webhooks/router";
import { namespaceFactory } from "test/factories";
import { mswServer } from "test/setup/mswServer";
import { makeYogaServer } from "test/util/server";

const BASE = "http://test";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const makeApp = () => {
  const app = new Elysia().use(webhooksRouter);
  return { handle: (req: Request) => app.handle(req) };
};

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error("Test database not initialized.");
  }
  return globalThis.__TEST_DATABASE__.db;
};

const ORG = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("Webhook management", () => {
  let token: string;
  let ns: string;

  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE webhook, api_token, namespace CASCADE`,
    );
    const nsRow = await namespaceFactory.create(db, {
      name: "test-ns",
      organizationId: ORG,
    });
    ns = nsRow.name;
    const generated = generateApiToken();
    token = generated.plaintext;
    await db.insert(apiTokenTable).values({
      name: "test-token",
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      namespaceId: nsRow.id,
      scope: "write",
      createdBy: "test-user",
    });
    mswServer.resetHandlers();
  });

  const create = (app: ReturnType<typeof makeApp>, body: unknown, auth = true) =>
    app.handle(
      new Request(`${BASE}/webhook/${ns}`, {
        method: "POST",
        headers: auth
          ? { Authorization: token, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

  test("creates, lists, and deletes a webhook", async () => {
    const app = makeApp();
    const res = await create(app, {
      url: "http://webhook.test/hook",
      events: ["manifold.artifact.published"],
    });
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.secret).toMatch(/^whsec_/);
    expect(created.id).toBeDefined();

    const listRes = await app.handle(
      new Request(`${BASE}/webhook/${ns}`, {
        headers: { Authorization: token },
      }),
    );
    const list = await listRes.json();
    expect(list.webhooks.length).toBe(1);
    // the secret is never returned on list
    expect(list.webhooks[0].secret).toBeUndefined();

    const delRes = await app.handle(
      new Request(`${BASE}/webhook/${ns}/${created.id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      }),
    );
    expect(delRes.status).toBe(200);
    expect((await delRes.json()).deleted).toBe(true);
  });

  test("rejects an invalid url and an unauthenticated create", async () => {
    const app = makeApp();
    expect((await create(app, { url: "not-a-url" })).status).toBe(400);
    expect((await create(app, { url: "http://x.test" }, false)).status).toBe(
      403,
    );
  });

  test("delivers a signed POST to matching webhooks", async () => {
    const app = makeApp();
    const created = await (
      await create(app, { url: "http://webhook.test/hook" })
    ).json();

    let captured: { body: string; signature: string | null } | null = null;
    mswServer.use(
      http.post("http://webhook.test/hook", async ({ request }) => {
        captured = {
          body: await request.text(),
          signature: request.headers.get("X-Manifold-Signature"),
        };
        return HttpResponse.json({ ok: true });
      }),
    );

    await dispatchWebhooks(ORG, "manifold.artifact.published", { foo: 1 });

    expect(captured).not.toBeNull();
    const cap = captured as unknown as { body: string; signature: string };
    expect(cap.signature).toBe(`sha256=${signWebhook(created.secret, cap.body)}`);
    expect(JSON.parse(cap.body).data).toEqual({ foo: 1 });
  });

  test("does not deliver events a webhook did not subscribe to", async () => {
    const app = makeApp();
    await (
      await create(app, {
        url: "http://webhook.test/hook",
        events: ["manifold.repository.deleted"],
      })
    ).json();

    let called = false;
    mswServer.use(
      http.post("http://webhook.test/hook", () => {
        called = true;
        return HttpResponse.json({ ok: true });
      }),
    );

    await dispatchWebhooks(ORG, "manifold.artifact.published", { foo: 1 });
    expect(called).toBe(false);
  });

  test("is NOT exposed through the GraphQL schema", async () => {
    const yoga = makeYogaServer();
    for (const query of [
      "{ webhooks { nodes { id } } }",
      'mutation { createWebhook(input: { webhook: { url: "x", secret: "y", organizationId: "z" } }) { clientMutationId } }',
    ]) {
      const res = await yoga.fetch("http://test/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const body = (await res.json()) as {
        errors?: { message: string }[];
        data?: unknown;
      };
      expect(body.errors).toBeDefined();
      expect(body.data ?? null).toBeNull();
    }
  });
});
