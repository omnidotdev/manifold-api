import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import {
  storageDeleteDelta,
  storagePushDelta,
} from "lib/oci/storageMetering";
import {
  artifactFactory,
  namespaceFactory,
  repositoryFactory,
} from "test/factories";

// The metering helpers query via `dbPool`, which reads PG* env vars (see the
// note in oci.test.ts). Point them at the shared test container so refcount
// queries see rows inserted through the factories' `db` client.
const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error("Test database not initialized");
  }
  return globalThis.__TEST_DATABASE__.db;
};

const digestOf = (seed: string) =>
  `sha256:${seed.padEnd(64, "0").slice(0, 64)}`;

/** Create a namespace + repo pair for `orgId`, returning the repo. */
const makeRepo = async (orgId: string, nsName: string, repoName: string) => {
  const db = getDb();
  const ns = await namespaceFactory.create(db, {
    name: nsName,
    organizationId: orgId,
  });
  return repositoryFactory.create(db, {
    namespaceId: ns.id,
    name: repoName,
    isPublic: true,
  });
};

describe("OCI storage metering deltas", () => {
  beforeEach(async () => {
    await getDb().execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, namespace CASCADE`,
    );
  });

  describe("storagePushDelta", () => {
    test("bills the full size on the first push of a digest", async () => {
      const org = crypto.randomUUID();
      const repo = await makeRepo(org, "acme", "app");
      const digest = digestOf("abc");

      // Push inserts the row, THEN meters (created = new row).
      await artifactFactory.create(getDb(), {
        repositoryId: repo.id,
        digest,
        size: 1000,
        storagePath: "blobs/abc",
      });

      expect(await storagePushDelta(org, digest, 1000, true)).toBe(1000);
    });

    test("bills nothing when the insert hit onConflictDoNothing (re-push)", async () => {
      const org = crypto.randomUUID();
      const digest = digestOf("dup");

      // created = false => a re-push of an already-stored blob; no new bytes.
      expect(await storagePushDelta(org, digest, 1000, false)).toBe(0);
    });

    test("bills nothing when the org already holds the digest in another repo", async () => {
      const org = crypto.randomUUID();
      const repoA = await makeRepo(org, "acme", "app-a");
      const repoB = await makeRepo(org, "acme-2", "app-b");
      const digest = digestOf("shared");

      // Same digest materialized in two of the org's repos (e.g. shared base
      // layer / cross-repo mount): two rows, but only one stored copy.
      await artifactFactory.create(getDb(), {
        repositoryId: repoA.id,
        digest,
        size: 2000,
        storagePath: "blobs/shared",
      });
      await artifactFactory.create(getDb(), {
        repositoryId: repoB.id,
        digest,
        size: 2000,
        storagePath: "blobs/shared",
      });

      // The second push created a row but the org already held the digest.
      expect(await storagePushDelta(org, digest, 2000, true)).toBe(0);
    });
  });

  describe("storageDeleteDelta", () => {
    test("credits the freed size when the org no longer holds the digest", async () => {
      const org = crypto.randomUUID();
      const digest = digestOf("gone");

      // Row already deleted (no artifact for this digest in the org).
      expect(await storageDeleteDelta(org, digest, 1500, 5000)).toBe(-1500);
    });

    test("credits nothing when another repo in the org still references it", async () => {
      const org = crypto.randomUUID();
      const survivor = await makeRepo(org, "acme", "still-here");
      const digest = digestOf("shared2");

      // The deleted copy is gone, but a second repo of the same org keeps a row.
      await artifactFactory.create(getDb(), {
        repositoryId: survivor.id,
        digest,
        size: 3000,
        storagePath: "blobs/shared2",
      });

      expect(await storageDeleteDelta(org, digest, 3000, 9000)).toBe(0);
    });

    test("clamps the decrement so the meter never goes below zero", async () => {
      const org = crypto.randomUUID();
      const digest = digestOf("clamp");

      // Freed 1000 bytes but the meter only reads 400 (drift / prior undercount).
      expect(await storageDeleteDelta(org, digest, 1000, 400)).toBe(-400);
    });

    test("decrements only against the org's own refs (cross-org sharing)", async () => {
      const orgA = crypto.randomUUID();
      const orgB = crypto.randomUUID();
      const repoB = await makeRepo(orgB, "other-org", "img");
      const digest = digestOf("crossorg");

      // orgB still stores the physically-shared blob, but orgA deleted its copy;
      // orgA's per-org meter must still be credited.
      await artifactFactory.create(getDb(), {
        repositoryId: repoB.id,
        digest,
        size: 4000,
        storagePath: "blobs/crossorg",
      });

      expect(await storageDeleteDelta(orgA, digest, 4000, 8000)).toBe(-4000);
    });
  });
});
