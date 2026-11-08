import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable } from "lib/db/schema";
import pypiRouter from "lib/pypi/router";
import { namespaceFactory } from "test/factories";

const BASE = "http://test";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const makeApp = () => {
  const app = new Elysia().use(pypiRouter);
  return { handle: (req: Request) => app.handle(req) };
};

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error("Test database not initialized (check preload.ts)");
  }
  return globalThis.__TEST_DATABASE__.db;
};

const sha256 = (bytes: Uint8Array) => {
  const h = new Bun.CryptoHasher("sha256");
  h.update(bytes);
  return h.digest("hex");
};

const basic = (token: string) =>
  `Basic ${Buffer.from(`__token__:${token}`).toString("base64")}`;

const buildUpload = (
  fields: Record<string, string>,
  filename: string,
  bytes: Uint8Array,
  filetype: string,
): FormData => {
  const form = new FormData();
  form.set(":action", "file_upload");
  form.set("protocol_version", "1");
  form.set("filetype", filetype);
  form.set("sha256_digest", sha256(bytes));
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  form.set(
    "content",
    new File([bytes as unknown as BlobPart], filename, {
      type: "application/octet-stream",
    }),
  );
  return form;
};

describe("PyPI registry", () => {
  let token: string;
  let ns: string;

  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE pypi_metadata, artifact, repository, api_token, namespace CASCADE`,
    );

    const namespace = await namespaceFactory.create(db, { name: "omni" });
    ns = namespace.name;

    const generated = generateApiToken();
    token = generated.plaintext;
    await db.insert(apiTokenTable).values({
      name: "test-token",
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      namespaceId: namespace.id,
      scope: "write",
      createdBy: "test-user",
    });
  });

  const wheelBytes = new TextEncoder().encode("fake-wheel-content");
  const wheelName = "odk_pdk-0.1.0-py3-none-any.whl";
  const meta = {
    name: "odk-pdk",
    version: "0.1.0",
    metadata_version: "2.1",
    pyversion: "py3",
    requires_python: ">=3.9",
  };

  const upload = (app: ReturnType<typeof makeApp>, form: FormData) =>
    app.handle(
      new Request(`${BASE}/pypi/${ns}/`, {
        method: "POST",
        headers: { Authorization: basic(token) },
        body: form,
      }),
    );

  test("upload → simple index (JSON + HTML) → download", async () => {
    const app = makeApp();

    const up = await upload(
      app,
      buildUpload(meta, wheelName, wheelBytes, "bdist_wheel"),
    );
    expect(up.status).toBe(200);

    // PEP 691 JSON simple index
    const json = await app.handle(
      new Request(`${BASE}/pypi/${ns}/simple/odk-pdk/`, {
        headers: { Accept: "application/vnd.pypi.simple.v1+json" },
      }),
    );
    expect(json.status).toBe(200);
    const body = await json.json();
    expect(body.name).toBe("odk-pdk");
    expect(body.files).toHaveLength(1);
    expect(body.files[0].filename).toBe(wheelName);
    expect(body.files[0].hashes.sha256).toBe(sha256(wheelBytes));
    expect(body.files[0]["requires-python"]).toBe(">=3.9");
    const fileUrl: string = body.files[0].url;
    expect(fileUrl).toContain(`/pypi/${ns}/files/odk-pdk/${wheelName}`);

    // PEP 503 HTML simple index
    const html = await app.handle(
      new Request(`${BASE}/pypi/${ns}/simple/odk-pdk/`),
    );
    const htmlText = await html.text();
    expect(htmlText).toContain(wheelName);
    expect(htmlText).toContain(`#sha256=${sha256(wheelBytes)}`);

    // Download (private repo → needs auth). Use the path from the index URL.
    const path = new URL(fileUrl).pathname;
    const dl = await app.handle(
      new Request(`${BASE}${path}`, {
        headers: { Authorization: basic(token) },
      }),
    );
    expect(dl.status).toBe(200);
    expect(new Uint8Array(await dl.arrayBuffer())).toEqual(wheelBytes);
  });

  test("a version can have multiple files (sdist + wheel)", async () => {
    const app = makeApp();

    await upload(app, buildUpload(meta, wheelName, wheelBytes, "bdist_wheel"));

    const sdistBytes = new TextEncoder().encode("fake-sdist-content");
    await upload(
      app,
      buildUpload(meta, "odk_pdk-0.1.0.tar.gz", sdistBytes, "sdist"),
    );

    const json = await app.handle(
      new Request(`${BASE}/pypi/${ns}/simple/odk-pdk/`, {
        headers: { Accept: "application/vnd.pypi.simple.v1+json" },
      }),
    );
    const body = await json.json();
    const names = body.files.map((f: { filename: string }) => f.filename).sort();
    expect(names).toEqual(["odk_pdk-0.1.0-py3-none-any.whl", "odk_pdk-0.1.0.tar.gz"]);
  });

  test("rejects a duplicate filename", async () => {
    const app = makeApp();
    await upload(app, buildUpload(meta, wheelName, wheelBytes, "bdist_wheel"));
    const dup = await upload(
      app,
      buildUpload(meta, wheelName, wheelBytes, "bdist_wheel"),
    );
    expect(dup.status).toBe(400);
    expect(await dup.text()).toContain("already exists");
  });

  test("rejects unauthenticated upload", async () => {
    const app = makeApp();
    const res = await app.handle(
      new Request(`${BASE}/pypi/${ns}/`, {
        method: "POST",
        body: buildUpload(meta, wheelName, wheelBytes, "bdist_wheel"),
      }),
    );
    expect(res.status).toBe(403);
  });
});
