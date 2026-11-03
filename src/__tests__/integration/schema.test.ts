import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable } from "lib/db/schema";
import schemasRouter from "lib/schemas/router";
import { namespaceFactory } from "test/factories";

const BASE = "http://test";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const makeApp = () => {
  const app = new Elysia().use(schemasRouter);
  return { handle: (req: Request) => app.handle(req) };
};

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error("Test database not initialized.");
  }
  return globalThis.__TEST_DATABASE__.db;
};

const OPENAPI = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Orders API", version: "1.4.0" },
  paths: {},
});

const GQL = "type Query { hello: String }";

describe("Schema registry", () => {
  let token: string;
  let ns: string;

  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE schema_metadata, tag, artifact, repository, api_token, namespace CASCADE`,
    );
    const nsRow = await namespaceFactory.create(db, { name: "test-ns" });
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
  });

  const publish = (
    app: ReturnType<typeof makeApp>,
    name: string,
    version: string,
    format: string,
    body: string,
    auth = true,
  ) =>
    app.handle(
      new Request(`${BASE}/schema/${ns}/${name}/${version}?format=${format}`, {
        method: "PUT",
        headers: auth ? { Authorization: token } : {},
        body,
      }),
    );

  test("publishes a valid OpenAPI schema and fetches it back", async () => {
    const app = makeApp();
    const res = await publish(app, "orders", "1.4.0", "openapi", OPENAPI);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.format).toBe("openapi");

    const get = await app.handle(
      new Request(`${BASE}/schema/${ns}/orders/1.4.0`, {
        headers: { Authorization: token },
      }),
    );
    expect(get.status).toBe(200);
    expect(await get.text()).toBe(OPENAPI);
  });

  test("stores an invalid schema but reports isValid=false with errors", async () => {
    const app = makeApp();
    const bad = JSON.stringify({ info: { title: "x" } }); // no openapi, no paths
    const res = await publish(app, "broken", "1.0.0", "openapi", bad);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.validationErrors.length).toBeGreaterThan(0);

    const list = await app.handle(
      new Request(`${BASE}/schema/${ns}/broken`, {
        headers: { Authorization: token },
      }),
    );
    const listBody = await list.json();
    expect(listBody.versions[0].isValid).toBe(false);
  });

  test("validates GraphQL SDL", async () => {
    const app = makeApp();
    const ok = await publish(app, "gql", "1.0.0", "graphql", GQL);
    expect((await ok.json()).valid).toBe(true);

    const bad = await publish(app, "gqlbad", "1.0.0", "graphql", "type {{{");
    expect((await bad.json()).valid).toBe(false);
  });

  test("rejects duplicate version", async () => {
    const app = makeApp();
    await publish(app, "orders", "1.0.0", "openapi", OPENAPI);
    const dup = await publish(app, "orders", "1.0.0", "openapi", OPENAPI);
    expect(dup.status).toBe(409);
  });

  test("rejects an unknown format", async () => {
    const app = makeApp();
    const res = await publish(app, "orders", "1.0.0", "protobuf", OPENAPI);
    expect(res.status).toBe(400);
  });

  test("requires a write token to publish", async () => {
    const app = makeApp();
    const res = await publish(app, "orders", "1.0.0", "openapi", OPENAPI, false);
    expect(res.status).toBe(403);
  });

  test("denies anonymous fetch of a private schema", async () => {
    const app = makeApp();
    await publish(app, "orders", "1.0.0", "openapi", OPENAPI);
    const res = await app.handle(
      new Request(`${BASE}/schema/${ns}/orders/1.0.0`),
    );
    expect(res.status).toBe(403);
  });
});
