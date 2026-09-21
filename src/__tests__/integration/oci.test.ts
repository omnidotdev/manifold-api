import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { ociRouter } from "lib/oci";
import {
  appendChunk,
  assembleBlob,
  cleanupSession,
  initSession,
  sessionExists,
} from "lib/oci/chunkStore";
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
    // Range is the inclusive byte range stored so far: 4 bytes => offsets 0-3
    expect(patch1Res.headers.get("range")).toBe("0-3");

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
    // 8 bytes total stored => inclusive offsets 0-7
    expect(patch2Res.headers.get("range")).toBe("0-7");

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

describe("OCI monolithic upload", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, namespace CASCADE`,
    );
  });

  test("handles monolithic blob upload via POST + PUT", async () => {
    const db = getDb();
    const app = makeOciApp();

    const ns = await namespaceFactory.create(db, { name: "library" });
    const repo = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "mono-repo",
      isPublic: true,
    });

    const repoName = repo.name;

    // Start upload session
    const postRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/uploads/`, {
        method: "POST",
      }),
    );

    expect(postRes.status).toBe(202);

    const uploadPath = postRes.headers.get("location");
    expect(uploadPath).toBeTruthy();

    // Complete upload with body in PUT (monolithic)
    const blob = new TextEncoder().encode("hello monolithic world");
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(blob);
    const expectedDigest = `sha256:${hasher.digest("hex")}`;

    const putRes = await app.handle(
      new Request(`${BASE}${uploadPath}?digest=${expectedDigest}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob,
      }),
    );

    expect(putRes.status).toBe(201);
    expect(putRes.headers.get("docker-content-digest")).toBe(expectedDigest);

    // Verify blob is retrievable
    const getRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/${expectedDigest}`),
    );

    expect(getRes.status).toBe(200);
  });

  test("streams a monolithic PUT body to storage without buffering", async () => {
    const db = getDb();
    const app = makeOciApp();

    const ns = await namespaceFactory.create(db, { name: "library" });
    const repo = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "mono-stream-repo",
      isPublic: true,
    });

    const repoName = repo.name;

    const postRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/uploads/`, { method: "POST" }),
    );
    expect(postRes.status).toBe(202);
    const uploadPath = postRes.headers.get("location");

    // A moderately large body (5 MiB) so the request is delivered as a
    // multi-chunk ReadableStream and exercises the streaming (not inline) path.
    // The parser hook keeps `request.body` unread; the handler streams it
    // straight through the inline hasher into storage.
    const size = 5 * 1024 * 1024;
    const body = new Uint8Array(size);
    for (let i = 0; i < size; i++) body[i] = (i * 31 + 7) & 0xff;

    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(body);
    const expectedDigest = `sha256:${hasher.digest("hex")}`;

    const putRes = await app.handle(
      new Request(`${BASE}${uploadPath}?digest=${expectedDigest}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body,
      }),
    );

    expect(putRes.status).toBe(201);
    expect(putRes.headers.get("docker-content-digest")).toBe(expectedDigest);
    expect(putRes.headers.get("location")).toBe(
      `/v2/${repoName}/blobs/${expectedDigest}`,
    );

    // The stored artifact row records the streamed byte count
    const getRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/${expectedDigest}`),
    );
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("content-length")).toBe(String(size));

    const retrieved = new Uint8Array(await getRes.arrayBuffer());
    expect(retrieved.byteLength).toBe(size);
    expect(retrieved).toEqual(body);

    // Digest of the retrieved bytes round-trips
    const roundTrip = new Bun.CryptoHasher("sha256");
    roundTrip.update(retrieved);
    expect(`sha256:${roundTrip.digest("hex")}`).toBe(expectedDigest);
  });

  test("rejects a monolithic PUT whose body does not match the digest", async () => {
    const db = getDb();
    const app = makeOciApp();

    const ns = await namespaceFactory.create(db, { name: "library" });
    const repo = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "mono-mismatch-repo",
      isPublic: true,
    });

    const repoName = repo.name;

    const postRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/uploads/`, { method: "POST" }),
    );
    const uploadPath = postRes.headers.get("location");

    const body = new TextEncoder().encode("actual body content");
    // A digest for different content: the streamed hash will not match
    const wrongDigest = `sha256:${"0".repeat(64)}`;

    const putRes = await app.handle(
      new Request(`${BASE}${uploadPath}?digest=${wrongDigest}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body,
      }),
    );

    expect(putRes.status).toBe(400);

    // The blob must not be readable under the (wrong) declared digest
    const getRes = await app.handle(
      new Request(`${BASE}/v2/${repoName}/blobs/${wrongDigest}`),
    );
    expect(getRes.status).toBe(404);
  });
});

describe("Chunk Store", () => {
  const sessionId = "test-session-id";

  afterEach(async () => {
    await cleanupSession(sessionId);
  });

  test("should store and assemble chunks", async () => {
    await initSession(sessionId);
    expect(await sessionExists(sessionId)).toBe(true);

    await appendChunk(sessionId, new Uint8Array([1, 2, 3]));
    await appendChunk(sessionId, new Uint8Array([4, 5, 6]));

    const assembled = await assembleBlob(sessionId);

    expect(new Uint8Array(assembled)).toEqual(
      new Uint8Array([1, 2, 3, 4, 5, 6]),
    );

    await cleanupSession(sessionId);
    expect(await sessionExists(sessionId)).toBe(false);
  });
});
