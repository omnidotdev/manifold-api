import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable } from "lib/db/schema";
import { namespaceFactory } from "test/factories";
import wasmRouter from "lib/wasm/router";

const BASE = "http://test";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const makeApp = () => {
  const app = new Elysia().use(wasmRouter);
  return { handle: (req: Request) => app.handle(req) };
};

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error("Test database not initialized.");
  }
  return globalThis.__TEST_DATABASE__.db;
};

// Minimal valid empty WASM module (magic + version, no sections)
const EMPTY_WASM = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
]);

// (module (func (export "add") (param i32 i32) (result i32)
//   local.get 0 local.get 1 i32.add))
const ADD_WASM = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x07, 0x01, 0x60, 0x02,
  0x7f, 0x7f, 0x01, 0x7f, 0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01, 0x03, 0x61,
  0x64, 0x64, 0x00, 0x00, 0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01,
  0x6a, 0x0b,
]);

describe("WASM registry", () => {
  let token: string;
  let ns: string;

  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE wasm_metadata, tag, artifact, repository, api_token, namespace CASCADE`,
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
    body: Uint8Array,
    auth = true,
  ) =>
    app.handle(
      new Request(`${BASE}/wasm/${ns}/${name}/${version}`, {
        method: "PUT",
        headers: auth ? { Authorization: token } : {},
        body: body as BodyInit,
      }),
    );

  test("publishes a module and extracts exports, then downloads it", async () => {
    const app = makeApp();
    const res = await publish(app, "calc", "1.0.0", ADD_WASM);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.runtime).toBe("core");
    expect(body.exports).toBe(1);

    const list = await app.handle(
      new Request(`${BASE}/wasm/${ns}/calc`, {
        headers: { Authorization: token },
      }),
    );
    const listBody = await list.json();
    expect(listBody.versions[0].exports).toEqual([
      { name: "add", kind: "function" },
    ]);

    const get = await app.handle(
      new Request(`${BASE}/wasm/${ns}/calc/1.0.0`, {
        headers: { Authorization: token },
      }),
    );
    expect(get.status).toBe(200);
    expect(new Uint8Array(await get.arrayBuffer())).toEqual(ADD_WASM);
  });

  test("accepts a minimal empty module", async () => {
    const app = makeApp();
    const res = await publish(app, "empty", "1.0.0", EMPTY_WASM);
    expect(res.status).toBe(201);
    expect((await res.json()).exports).toBe(0);
  });

  test("rejects a non-WASM binary", async () => {
    const app = makeApp();
    const res = await publish(
      app,
      "bad",
      "1.0.0",
      new TextEncoder().encode("not wasm"),
    );
    expect(res.status).toBe(400);
  });

  test("rejects duplicate version", async () => {
    const app = makeApp();
    await publish(app, "calc", "1.0.0", ADD_WASM);
    const dup = await publish(app, "calc", "1.0.0", ADD_WASM);
    expect(dup.status).toBe(409);
  });

  test("requires a write token to publish", async () => {
    const app = makeApp();
    const res = await publish(app, "calc", "1.0.0", ADD_WASM, false);
    expect(res.status).toBe(403);
  });

  test("denies anonymous download of a private module", async () => {
    const app = makeApp();
    await publish(app, "calc", "1.0.0", ADD_WASM);
    const res = await app.handle(new Request(`${BASE}/wasm/${ns}/calc/1.0.0`));
    expect(res.status).toBe(403);
  });
});
