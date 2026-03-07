import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { generateApiToken } from "lib/auth/token";
import cargoRouter from "lib/cargo/router";
import { apiTokenTable } from "lib/db/schema";
import { namespaceFactory } from "test/factories";

const BASE = "http://test";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const makeCargoApp = () => {
  const app = new Elysia().use(cargoRouter);
  return { handle: (req: Request) => app.handle(req) };
};

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error(
      "Test database not initialized. Ensure preload.ts is configured in bunfig.toml",
    );
  }
  return globalThis.__TEST_DATABASE__.db;
};

/**
 * Build a Cargo publish wire-format body.
 */
const buildPublishBody = (
  metadata: Record<string, unknown>,
  crateBytes: Uint8Array,
): ArrayBuffer => {
  const metaJson = JSON.stringify(metadata);
  const metaBytes = new TextEncoder().encode(metaJson);
  const buf = new ArrayBuffer(4 + metaBytes.length + 4 + crateBytes.length);
  const view = new DataView(buf);
  const u8 = new Uint8Array(buf);

  view.setUint32(0, metaBytes.length, true);
  u8.set(metaBytes, 4);
  view.setUint32(4 + metaBytes.length, crateBytes.length, true);
  u8.set(crateBytes, 4 + metaBytes.length + 4);

  return buf;
};

describe("Cargo registry", () => {
  let token: string;
  let namespaceName: string;

  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE cargo_metadata, tag, artifact, repository, api_token, namespace CASCADE`,
    );

    // Create namespace
    const ns = await namespaceFactory.create(db, { name: "test-ns" });
    namespaceName = ns.name;

    // Create API token with write scope
    const generated = generateApiToken();
    token = generated.plaintext;
    await db.insert(apiTokenTable).values({
      name: "test-token",
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      namespaceId: ns.id,
      scope: "write",
      createdBy: "test-user",
    });
  });

  const crateBytes = new TextEncoder().encode("fake-crate-content");
  const cksum = (() => {
    const h = new Bun.CryptoHasher("sha256");
    h.update(crateBytes);
    return h.digest("hex");
  })();

  const publishMeta = {
    name: "mycrate",
    vers: "0.1.0",
    deps: [],
    features: {},
    cksum,
  };

  test("publish → index → download → yank", async () => {
    const app = makeCargoApp();

    // Publish
    const publishRes = await app.handle(
      new Request(`${BASE}/cargo/${namespaceName}/api/v1/crates/new`, {
        method: "PUT",
        headers: { Authorization: token },
        body: buildPublishBody(publishMeta, crateBytes),
      }),
    );
    expect(publishRes.status).toBe(200);
    const publishBody = await publishRes.json();
    expect(publishBody.warnings).toBeDefined();

    // Index lookup
    const indexRes = await app.handle(
      new Request(`${BASE}/cargo/${namespaceName}/index/my/cr/mycrate`),
    );
    expect(indexRes.status).toBe(200);
    const indexText = await indexRes.text();
    const indexEntry = JSON.parse(indexText);
    expect(indexEntry.name).toBe("mycrate");
    expect(indexEntry.vers).toBe("0.1.0");
    expect(indexEntry.yanked).toBe(false);

    // Download (private namespace requires auth)
    const dlRes = await app.handle(
      new Request(
        `${BASE}/cargo/${namespaceName}/api/v1/crates/mycrate/0.1.0/download`,
        { headers: { Authorization: token } },
      ),
    );
    expect(dlRes.status).toBe(200);
    const dlBytes = new Uint8Array(await dlRes.arrayBuffer());
    expect(dlBytes).toEqual(crateBytes);

    // Yank
    const yankRes = await app.handle(
      new Request(
        `${BASE}/cargo/${namespaceName}/api/v1/crates/mycrate/0.1.0/yank`,
        {
          method: "DELETE",
          headers: { Authorization: token },
        },
      ),
    );
    expect(yankRes.status).toBe(200);

    // Verify yanked in index
    const indexRes2 = await app.handle(
      new Request(`${BASE}/cargo/${namespaceName}/index/my/cr/mycrate`),
    );
    const entry2 = JSON.parse(await indexRes2.text());
    expect(entry2.yanked).toBe(true);

    // Unyank
    const unyankRes = await app.handle(
      new Request(
        `${BASE}/cargo/${namespaceName}/api/v1/crates/mycrate/0.1.0/unyank`,
        {
          method: "PUT",
          headers: { Authorization: token },
        },
      ),
    );
    expect(unyankRes.status).toBe(200);
  });

  test("rejects duplicate version", async () => {
    const app = makeCargoApp();

    // Publish first time
    await app.handle(
      new Request(`${BASE}/cargo/${namespaceName}/api/v1/crates/new`, {
        method: "PUT",
        headers: { Authorization: token },
        body: buildPublishBody(publishMeta, crateBytes),
      }),
    );

    // Publish same version again
    const res = await app.handle(
      new Request(`${BASE}/cargo/${namespaceName}/api/v1/crates/new`, {
        method: "PUT",
        headers: { Authorization: token },
        body: buildPublishBody(publishMeta, crateBytes),
      }),
    );
    expect(res.status).toBe(409);
  });

  test("rejects unauthenticated publish", async () => {
    const app = makeCargoApp();

    const res = await app.handle(
      new Request(`${BASE}/cargo/${namespaceName}/api/v1/crates/new`, {
        method: "PUT",
        body: buildPublishBody(publishMeta, crateBytes),
      }),
    );
    expect(res.status).toBe(403);
  });
});
