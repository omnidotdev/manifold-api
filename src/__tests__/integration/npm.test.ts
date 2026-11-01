import { beforeEach, describe, expect, test } from "bun:test";
import { and, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable, repositoryTable } from "lib/db/schema";
import { authenticateNpmToken, requireNpmWrite } from "lib/npm/auth";
import {
  deleteDistTagHandler,
  listDistTagsHandler,
  setDistTagHandler,
} from "lib/npm/distTags";
import { computeIntegrity } from "lib/npm/integrity";
import { packumentHandler } from "lib/npm/packument";
import { publishHandler } from "lib/npm/publish";
import npmRouter from "lib/npm/router";
import { tarballHandler } from "lib/npm/tarball";
import { namespaceFactory } from "test/factories";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error(
      "Test database not initialized. Ensure preload.ts is configured in bunfig.toml",
    );
  }
  return globalThis.__TEST_DATABASE__.db;
};

/** Create a namespace + an api token with the given scope; returns the plaintext token. */
const seedToken = async (scope: string, namespaceName = "coopbri") => {
  const db = getDb();
  const ns = await namespaceFactory.create(db, { name: namespaceName });
  const generated = generateApiToken();
  await db.insert(apiTokenTable).values({
    name: "test-token",
    tokenHash: generated.hash,
    tokenPrefix: generated.prefix,
    namespaceId: ns.id,
    scope,
    createdBy: "test-user",
  });
  return { token: generated.plaintext, namespaceId: ns.id };
};

/** Build an npm publish request body (single version + base64 tarball attachment). */
const buildNpmPublishBody = (
  name: string,
  version: string,
  tgz: Uint8Array,
) => {
  const unscoped = name.split("/")[1];
  const { shasum, integrity } = computeIntegrity(tgz);
  return JSON.stringify({
    _id: name,
    name,
    "dist-tags": { latest: version },
    versions: {
      [version]: { name, version, dist: { shasum, integrity } },
    },
    _attachments: {
      [`${unscoped}-${version}.tgz`]: {
        content_type: "application/octet-stream",
        data: Buffer.from(tgz).toString("base64"),
        length: tgz.length,
      },
    },
  });
};

/** Invoke the publish handler directly with a constructed request. */
const callPublish = async (
  scope: string,
  pkg: string,
  token: string | null,
  body: string,
) => {
  const set = { headers: {} as Record<string, string> } as {
    status?: number;
    headers: Record<string, string>;
  };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const req = new Request(`http://test/npm/@${scope}/${pkg}`, {
    method: "PUT",
    headers,
    body,
  });
  const result = (await publishHandler(scope, pkg, req, set)) as {
    ok?: boolean;
    error?: string;
  };
  return { status: set.status, result };
};

/** Invoke the packument read handler directly. */
const callPackument = async (
  scope: string,
  pkg: string,
  token: string | null,
) => {
  const set = { headers: {} as Record<string, string> } as {
    status?: number;
    headers: Record<string, string>;
  };
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const req = new Request(`http://test/npm/@${scope}/${pkg}`, { headers });
  const result = await packumentHandler(scope, pkg, set, req);
  return { status: set.status, headers: set.headers, result };
};

/** Invoke the tarball download handler directly. */
const callTarball = async (
  scope: string,
  pkg: string,
  file: string,
  token: string | null,
) => {
  const set = { headers: {} as Record<string, string> } as {
    status?: number;
    headers: Record<string, string>;
  };
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const req = new Request(`http://test/npm/@${scope}/${pkg}/-/${file}`, {
    headers,
  });
  const result = await tarballHandler(scope, pkg, file, set, req);
  return { status: set.status, result };
};

const makeSet = () =>
  ({ headers: {} as Record<string, string> }) as {
    status?: number;
    headers: Record<string, string>;
  };

/** Invoke a dist-tag write/delete handler directly. */
const callDistTagWrite = async (
  method: "PUT" | "DELETE",
  scope: string,
  pkg: string,
  tag: string,
  version: string | null,
  token: string | null,
) => {
  const set = makeSet();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const req = new Request(
    `http://test/npm/-/package/@${scope}/${pkg}/dist-tags/${tag}`,
    { method, headers, body: version != null ? JSON.stringify(version) : null },
  );
  const result =
    method === "PUT"
      ? await setDistTagHandler(scope, pkg, tag, req, set)
      : await deleteDistTagHandler(scope, pkg, tag, req, set);
  return { status: set.status, result };
};

describe("npm registry auth", () => {
  beforeEach(async () => {
    await getDb().execute(
      sql`TRUNCATE TABLE npm_dist_tag, npm_metadata, tag, artifact, repository, api_token, namespace CASCADE`,
    );
  });

  test("authenticates a valid Bearer token", async () => {
    const { token, namespaceId } = await seedToken("write");
    const auth = await authenticateNpmToken(`Bearer ${token}`);
    expect(auth).toEqual({ namespaceId, scope: "write" });
  });

  test("returns null for a missing or malformed token", async () => {
    expect(await authenticateNpmToken(null)).toBeNull();
    expect(await authenticateNpmToken("Bearer not-a-real-token")).toBeNull();
  });

  test("requireNpmWrite passes a write token and rejects a read token", async () => {
    const { token: writeToken } = await seedToken("write", "coopbri");
    const writeAuth = await requireNpmWrite(`Bearer ${writeToken}`);
    expect(writeAuth.scope).toBe("write");

    const { token: readToken } = await seedToken("read", "readonly");
    await expect(requireNpmWrite(`Bearer ${readToken}`)).rejects.toThrow(
      /write scope/i,
    );
  });
});

describe("npm registry publish", () => {
  beforeEach(async () => {
    await getDb().execute(
      sql`TRUNCATE TABLE npm_dist_tag, npm_metadata, tag, artifact, repository, api_token, namespace CASCADE`,
    );
  });

  const tgz = new TextEncoder().encode("fake-tarball-bytes");

  test("publishes a new version (201)", async () => {
    const { token } = await seedToken("write", "coopbri");
    const body = buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz);
    const { status, result } = await callPublish(
      "coopbri",
      "astro",
      token,
      body,
    );
    expect(status).toBe(201);
    expect(result.ok).toBe(true);
  });

  test("rejects a duplicate version (409)", async () => {
    const { token } = await seedToken("write", "coopbri");
    const body = buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz);
    await callPublish("coopbri", "astro", token, body);
    const second = await callPublish("coopbri", "astro", token, body);
    expect(second.status).toBe(409);
  });

  test("rejects a read-scoped token (401)", async () => {
    const { token } = await seedToken("read", "coopbri");
    const body = buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz);
    const { status } = await callPublish("coopbri", "astro", token, body);
    expect(status).toBe(401);
  });

  test("creates a new package as a private repository (isPublic false)", async () => {
    const { token, namespaceId } = await seedToken("write", "coopbri");
    const body = buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz);
    const { status } = await callPublish("coopbri", "astro", token, body);
    expect(status).toBe(201);

    const [repo] = await getDb()
      .select({ isPublic: repositoryTable.isPublic })
      .from(repositoryTable)
      .where(
        and(
          eq(repositoryTable.namespaceId, namespaceId),
          eq(repositoryTable.name, "astro"),
        ),
      )
      .limit(1);
    expect(repo?.isPublic).toBe(false);
  });

  test("denies an anonymous read of a private package (403)", async () => {
    const { token } = await seedToken("write", "coopbri");
    await callPublish(
      "coopbri",
      "astro",
      token,
      buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz),
    );
    const { status } = await callPackument("coopbri", "astro", null);
    expect(status).toBe(403);
  });

  test("serves a packument with dist-tags and an absolute tarball URL", async () => {
    const { token } = await seedToken("write", "coopbri");
    await callPublish(
      "coopbri",
      "astro",
      token,
      buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz),
    );

    const { result } = await callPackument("coopbri", "astro", token);
    const p = result as {
      "dist-tags": Record<string, string>;
      versions: Record<string, { dist: { tarball: string } }>;
    };
    expect(p["dist-tags"].latest).toBe("1.0.0");
    expect(p.versions["1.0.0"].dist.tarball).toContain(
      "/npm/@coopbri/astro/-/astro-1.0.0.tgz",
    );
  });

  test("returns 404 for an unknown package", async () => {
    const { status } = await callPackument("coopbri", "nope", null);
    expect(status).toBe(404);
  });

  test("downloads the published tarball with matching bytes", async () => {
    const { token } = await seedToken("write", "coopbri");
    await callPublish(
      "coopbri",
      "astro",
      token,
      buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz),
    );

    const { result: pack } = await callPackument("coopbri", "astro", token);
    const tarballUrl = (
      pack as { versions: Record<string, { dist: { tarball: string } }> }
    ).versions["1.0.0"].dist.tarball;
    const file = tarballUrl.split("/-/")[1];
    expect(file).toBe("astro-1.0.0.tgz");

    const { result } = await callTarball("coopbri", "astro", file, token);
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.status).toBe(200);

    const downloaded = new Uint8Array(await res.arrayBuffer());
    expect(computeIntegrity(downloaded).shasum).toBe(
      computeIntegrity(tgz).shasum,
    );
  });

  test("sets, lists, and deletes a dist-tag; latest is protected", async () => {
    const { token } = await seedToken("write", "coopbri");
    await callPublish(
      "coopbri",
      "astro",
      token,
      buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz),
    );

    const setRes = await callDistTagWrite(
      "PUT",
      "coopbri",
      "astro",
      "beta",
      "1.0.0",
      token,
    );
    expect((setRes.result as { ok?: boolean }).ok).toBe(true);

    const listed = (await listDistTagsHandler("coopbri", "astro", makeSet())) as
      | Record<string, string>
      | { error: string };
    expect(listed).toMatchObject({ latest: "1.0.0", beta: "1.0.0" });

    await callDistTagWrite("DELETE", "coopbri", "astro", "beta", null, token);
    const afterDelete = (await listDistTagsHandler(
      "coopbri",
      "astro",
      makeSet(),
    )) as Record<string, string>;
    expect(afterDelete.beta).toBeUndefined();
    expect(afterDelete.latest).toBe("1.0.0");

    const delLatest = await callDistTagWrite(
      "DELETE",
      "coopbri",
      "astro",
      "latest",
      null,
      token,
    );
    expect(delLatest.status).toBe(400);
  });
});

describe("npm registry router", () => {
  beforeEach(async () => {
    await getDb().execute(
      sql`TRUNCATE TABLE npm_dist_tag, npm_metadata, tag, artifact, repository, api_token, namespace CASCADE`,
    );
  });

  const tgz = new TextEncoder().encode("router-round-trip-bytes");

  test("publish + packument + tarball over HTTP through the router", async () => {
    const { token } = await seedToken("write", "coopbri");
    const app = new Elysia().use(npmRouter);

    const pubRes = await app.handle(
      new Request("http://test/npm/@coopbri/astro", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz),
      }),
    );
    expect(pubRes.status).toBe(201);

    const authHeader = { Authorization: `Bearer ${token}` };
    const packRes = await app.handle(
      new Request("http://test/npm/@coopbri/astro", { headers: authHeader }),
    );
    expect(packRes.status).toBe(200);
    const pack = (await packRes.json()) as {
      "dist-tags": Record<string, string>;
      versions: Record<string, { dist: { tarball: string } }>;
    };
    expect(pack["dist-tags"].latest).toBe("1.0.0");
    const file = pack.versions["1.0.0"].dist.tarball.split("/-/")[1];

    const tarRes = await app.handle(
      new Request(`http://test/npm/@coopbri/astro/-/${file}`, {
        headers: authHeader,
      }),
    );
    expect(tarRes.status).toBe(200);
    const bytes = new Uint8Array(await tarRes.arrayBuffer());
    expect(computeIntegrity(bytes).shasum).toBe(computeIntegrity(tgz).shasum);
  });

  test("serves the packument at the URL-encoded scoped path bun/npm use", async () => {
    const { token } = await seedToken("write", "coopbri");
    const app = new Elysia().use(npmRouter);
    await app.handle(
      new Request("http://test/npm/@coopbri/astro", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: buildNpmPublishBody("@coopbri/astro", "1.0.0", tgz),
      }),
    );

    // npm/bun request scoped packages as one `%2F`-encoded segment
    const packRes = await app.handle(
      new Request("http://test/npm/@coopbri%2fastro", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(packRes.status).toBe(200);
    const pack = (await packRes.json()) as { "dist-tags": Record<string, string> };
    expect(pack["dist-tags"].latest).toBe("1.0.0");
  });
});
