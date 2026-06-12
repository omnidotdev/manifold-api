import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable } from "lib/db/schema";
import { authenticateNpmToken, requireNpmWrite } from "lib/npm/auth";
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
