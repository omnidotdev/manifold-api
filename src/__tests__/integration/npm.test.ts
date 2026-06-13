import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable } from "lib/db/schema";
import { authenticateNpmToken, requireNpmWrite } from "lib/npm/auth";
import { computeIntegrity } from "lib/npm/integrity";
import { publishHandler } from "lib/npm/publish";
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
});
