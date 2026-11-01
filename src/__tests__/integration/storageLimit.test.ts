import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { enforceStorageLimit } from "lib/billing";
import { artifactFactory, namespaceFactory, repositoryFactory } from "test/factories";

import type { EntitlementsResponse } from "@omnidotdev/providers";

const ORG_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ORG_C = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const getTestDb = () => globalThis.__TEST_DATABASE__;

const limitOf =
  (bytes: number) =>
  async (): Promise<EntitlementsResponse> =>
    ({
      entitlements: [
        { featureKey: "max_storage_bytes", value: String(bytes) },
        { featureKey: "tier", value: "free" },
      ],
    }) as unknown as EntitlementsResponse;

const unlimited =
  async (): Promise<EntitlementsResponse> =>
    ({
      entitlements: [{ featureKey: "tier", value: "pro" }],
    }) as unknown as EntitlementsResponse;

describe("enforceStorageLimit", () => {
  beforeEach(async () => {
    await getTestDb().db.execute(
      sql`TRUNCATE TABLE artifact, repository, namespace CASCADE`,
    );
  });

  test("blocks when current stored bytes plus the incoming push exceed the limit", async () => {
    const { db } = getTestDb();
    const ns = await namespaceFactory.create(db, { name: "a", organizationId: ORG_A });
    const repo = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "r1",
      artifactType: "oci",
    });
    await artifactFactory.create(db, {
      repositoryId: repo.id,
      digest: "sha256:aa",
      size: 400,
    });

    // current 400 + incoming 200 = 600 > limit 500
    const result = await enforceStorageLimit(ORG_A, 200, {
      db,
      resolve: limitOf(500),
    });

    expect(result).not.toBeNull();
    expect(result?.status).toBe(402);
  });

  test("counts a content-addressed digest once even when held in multiple repos of the org", async () => {
    const { db } = getTestDb();
    const ns = await namespaceFactory.create(db, { name: "b", organizationId: ORG_B });
    const r1 = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "r1",
      artifactType: "oci",
    });
    const r2 = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "r2",
      artifactType: "oci",
    });
    // same digest (same 400 bytes) in two repos: the org stores 400, not 800
    await artifactFactory.create(db, {
      repositoryId: r1.id,
      digest: "sha256:dup",
      size: 400,
    });
    await artifactFactory.create(db, {
      repositoryId: r2.id,
      digest: "sha256:dup",
      size: 400,
    });

    // deduped 400 + incoming 50 = 450 <= 500: allowed. A naive 800 sum would block
    const result = await enforceStorageLimit(ORG_B, 50, {
      db,
      resolve: limitOf(500),
    });

    expect(result).toBeNull();
  });

  test("allows a push that stays within the limit", async () => {
    const { db } = getTestDb();
    const ns = await namespaceFactory.create(db, { name: "c", organizationId: ORG_C });
    const repo = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "r1",
      artifactType: "oci",
    });
    await artifactFactory.create(db, {
      repositoryId: repo.id,
      digest: "sha256:cc",
      size: 100,
    });

    const result = await enforceStorageLimit(ORG_C, 100, {
      db,
      resolve: limitOf(500),
    });

    expect(result).toBeNull();
  });

  test("is a no-op when storage is unlimited (billing unconfigured or no max_storage_bytes)", async () => {
    const { db } = getTestDb();
    const ns = await namespaceFactory.create(db, { name: "d", organizationId: ORG_A });
    const repo = await repositoryFactory.create(db, {
      namespaceId: ns.id,
      name: "r1",
      artifactType: "oci",
    });
    await artifactFactory.create(db, {
      repositoryId: repo.id,
      digest: "sha256:dd",
      size: 999_999_999,
    });

    const result = await enforceStorageLimit(ORG_A, 999_999_999, {
      db,
      resolve: unlimited,
    });

    expect(result).toBeNull();
  });
});
