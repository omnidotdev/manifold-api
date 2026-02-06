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

const pushManifest = async (
  app: ReturnType<typeof makeOciApp>,
  repoName: string,
  tag: string,
) => {
  return app.handle(
    new Request(`${BASE}/v2/${repoName}/manifests/${tag}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.oci.image.manifest.v1+json",
      },
      body: MANIFEST,
    }),
  );
};

describe("OCI tag listing", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, namespace CASCADE`,
    );
  });

  test("list tags for repo with no tags returns empty array", async () => {
    const db = getDb();
    const app = makeOciApp();
    const ns = await namespaceFactory.create(db, { name: "library" });
    await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "empty-repo",
      isPublic: true,
    });

    const res = await app.handle(
      new Request(`${BASE}/v2/empty-repo/tags/list`),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toEqual([]);
  });

  test("list tags returns pushed tag names", async () => {
    const db = getDb();
    const app = makeOciApp();
    const ns = await namespaceFactory.create(db, { name: "library" });
    await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "tagged-repo",
      isPublic: true,
    });

    await pushManifest(app, "tagged-repo", "v1.0.0");
    await pushManifest(app, "tagged-repo", "v2.0.0");
    await pushManifest(app, "tagged-repo", "latest");

    const res = await app.handle(
      new Request(`${BASE}/v2/tagged-repo/tags/list`),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("tagged-repo");
    expect(body.tags.sort()).toEqual(["latest", "v1.0.0", "v2.0.0"]);
  });

  test("tag pagination with n and last params", async () => {
    const db = getDb();
    const app = makeOciApp();
    const ns = await namespaceFactory.create(db, { name: "library" });
    await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "paginated-repo",
      isPublic: true,
    });

    await pushManifest(app, "paginated-repo", "a");
    await pushManifest(app, "paginated-repo", "b");
    await pushManifest(app, "paginated-repo", "c");

    // Get first 2
    const res1 = await app.handle(
      new Request(`${BASE}/v2/paginated-repo/tags/list?n=2`),
    );
    const body1 = await res1.json();
    expect(body1.tags).toEqual(["a", "b"]);

    // Get after "a" with limit 1
    const res2 = await app.handle(
      new Request(`${BASE}/v2/paginated-repo/tags/list?n=1&last=a`),
    );
    const body2 = await res2.json();
    expect(body2.tags).toEqual(["b"]);
  });
});
