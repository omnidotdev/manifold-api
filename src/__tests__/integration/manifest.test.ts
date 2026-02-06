import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { ociRouter } from "lib/oci";
import { namespaceFactory, repositoryFactory } from "test/factories";

const BASE = "http://test";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const makeOciApp = () => {
  const app = new Elysia().use(ociRouter);
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

const MANIFEST = JSON.stringify({
  schemaVersion: 2,
  mediaType: "application/vnd.oci.image.manifest.v1+json",
  config: { digest: "sha256:config", size: 0 },
  layers: [],
});

describe("OCI manifest push/pull", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, namespace CASCADE`,
    );
  });

  test("PUT manifest then GET by digest", async () => {
    const db = getDb();
    const app = makeOciApp();
    const ns = await namespaceFactory.create(db, { name: "library" });
    await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "test-repo",
      isPublic: true,
    });

    const putRes = await app.handle(
      new Request(`${BASE}/v2/test-repo/manifests/latest`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/vnd.oci.image.manifest.v1+json",
        },
        body: MANIFEST,
      }),
    );

    expect(putRes.status).toBe(201);
    const digest = putRes.headers.get("docker-content-digest");
    expect(digest).toBeTruthy();

    const getRes = await app.handle(
      new Request(`${BASE}/v2/test-repo/manifests/${digest}`),
    );

    expect(getRes.status).toBe(200);
    const body = await getRes.text();
    expect(body).toBe(MANIFEST);
  });

  test("PUT manifest with tag then GET by tag", async () => {
    const db = getDb();
    const app = makeOciApp();
    const ns = await namespaceFactory.create(db, { name: "library" });
    await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "tagged-repo",
      isPublic: true,
    });

    await app.handle(
      new Request(`${BASE}/v2/tagged-repo/manifests/v1.0.0`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/vnd.oci.image.manifest.v1+json",
        },
        body: MANIFEST,
      }),
    );

    const getRes = await app.handle(
      new Request(`${BASE}/v2/tagged-repo/manifests/v1.0.0`),
    );

    expect(getRes.status).toBe(200);
    expect(await getRes.text()).toBe(MANIFEST);
  });

  test("HEAD manifest returns correct headers", async () => {
    const db = getDb();
    const app = makeOciApp();
    const ns = await namespaceFactory.create(db, { name: "library" });
    await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "head-repo",
      isPublic: true,
    });

    const putRes = await app.handle(
      new Request(`${BASE}/v2/head-repo/manifests/latest`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/vnd.oci.image.manifest.v1+json",
        },
        body: MANIFEST,
      }),
    );

    const digest = putRes.headers.get("docker-content-digest");

    const headRes = await app.handle(
      new Request(`${BASE}/v2/head-repo/manifests/latest`, { method: "HEAD" }),
    );

    expect(headRes.status).toBe(200);
    expect(headRes.headers.get("content-type")).toBe(
      "application/vnd.oci.image.manifest.v1+json",
    );
    expect(headRes.headers.get("docker-content-digest")).toBe(digest);
    expect(headRes.headers.get("content-length")).toBeTruthy();
  });

  test("GET manifest for non-existent repo returns 404 NAME_UNKNOWN", async () => {
    const app = makeOciApp();

    const res = await app.handle(
      new Request(`${BASE}/v2/nonexistent/manifests/latest`),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.errors[0].code).toBe("NAME_UNKNOWN");
  });

  test("GET manifest for non-existent reference returns 404 MANIFEST_UNKNOWN", async () => {
    const db = getDb();
    const app = makeOciApp();
    const ns = await namespaceFactory.create(db, { name: "library" });
    await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "exists-repo",
      isPublic: true,
    });

    const res = await app.handle(
      new Request(`${BASE}/v2/exists-repo/manifests/nonexistent`),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.errors[0].code).toBe("MANIFEST_UNKNOWN");
  });
});
