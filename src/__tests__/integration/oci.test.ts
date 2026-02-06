import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { ociRouter } from "lib/oci";
import { namespaceFactory, repositoryFactory } from "test/factories";

const BASE = "http://test";

// The OCI router imports `dbPool` which reads `DATABASE_URL` from
// `env.config.ts`. That module is evaluated during preload imports (before
// `process.env.DATABASE_URL` is set to the test container URI), so `dbPool`
// falls back to native PG* env vars. Parse the container connection string
// and set them so the lazy pool connects to the test container on first query.
const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

/**
 * Create a minimal Elysia app with only the OCI router mounted.
 */
const makeOciApp = () => {
  const app = new Elysia().use(ociRouter);

  return {
    handle: (req: Request) => app.handle(req),
  };
};

/**
 * Get the test database from global preload context.
 */
const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error(
      "Test database not initialized. Ensure preload.ts is configured in bunfig.toml",
    );
  }
  return globalThis.__TEST_DATABASE__.db;
};

describe("OCI chunked upload", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, namespace CASCADE`,
    );
  });

  test("handles chunked blob upload via PATCH + PUT", async () => {
    const db = getDb();
    const app = makeOciApp();

    // Arrange: create namespace + repository
    // Use "library" namespace since Elysia `:name` param captures a single
    // path segment and `parseRepoName` defaults to "library" for bare names
    const ns = await namespaceFactory.create(db, { name: "library" });
    const repo = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "chunked-repo",
      isPublic: true,
    });

    // Single-segment name so `:name` captures it correctly
    const repoName = repo.name;

    // Act: start upload session (POST)
    const postRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/uploads/`, {
        method: "POST",
      }),
    );

    expect(postRes.status).toBe(202);

    const uploadPath = postRes.headers.get("location");
    expect(uploadPath).toBeTruthy();

    const sessionUuid = postRes.headers.get("docker-upload-uuid");
    expect(sessionUuid).toBeTruthy();

    // Act: upload chunk 1 (PATCH)
    const chunk1 = new Uint8Array([1, 2, 3, 4]);
    const patch1Res = await app.handle(
      new Request(`${BASE}${uploadPath}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk1,
      }),
    );

    expect(patch1Res.status).toBe(202);
    expect(patch1Res.headers.get("range")).toBe("0-4");

    // Act: upload chunk 2 (PATCH)
    const chunk2 = new Uint8Array([5, 6, 7, 8]);
    const patch2Res = await app.handle(
      new Request(`${BASE}${uploadPath}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk2,
      }),
    );

    expect(patch2Res.status).toBe(202);
    expect(patch2Res.headers.get("range")).toBe("0-8");

    // Act: complete upload (PUT)
    const fullBlob = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(fullBlob);
    const expectedDigest = `sha256:${hasher.digest("hex")}`;

    const putRes = await app.handle(
      new Request(`${BASE}${uploadPath}?digest=${expectedDigest}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
      }),
    );

    expect(putRes.status).toBe(201);

    // Assert: blob is retrievable via GET
    const getRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/${expectedDigest}`),
    );

    expect(getRes.status).toBe(200);

    // Verify blob content matches the original chunks
    const blob = await getRes.arrayBuffer();
    const retrieved = new Uint8Array(blob);

    expect(retrieved).toEqual(fullBlob);
  });
});
