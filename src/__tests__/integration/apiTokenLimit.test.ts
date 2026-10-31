import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { enforceApiTokenLimit } from "lib/billing";
import { apiTokenTable } from "lib/db/schema";
import { namespaceFactory } from "test/factories/namespace.factory";

import type { EntitlementsResponse } from "@omnidotdev/providers";

const ORG_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ORG_C = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const getTestDb = () => globalThis.__TEST_DATABASE__;

const limitOf =
  (n: number) =>
  async (): Promise<EntitlementsResponse> =>
    ({
      entitlements: [
        { featureKey: "max_api_tokens", value: String(n) },
        { featureKey: "tier", value: "free" },
      ],
    }) as unknown as EntitlementsResponse;

// biome-ignore lint/suspicious/noExplicitAny: test db
const insertToken = (db: any, namespaceId: string, expiresAt?: string) =>
  db
    .insert(apiTokenTable)
    .values({
      name: "test-token",
      tokenHash: randomUUID(),
      tokenPrefix: `mf_${randomUUID().slice(0, 8)}`,
      namespaceId,
      createdBy: "user",
      ...(expiresAt ? { expiresAt } : {}),
    })
    .returning();

describe("enforceApiTokenLimit", () => {
  beforeEach(async () => {
    await getTestDb().db.execute(
      sql`TRUNCATE TABLE api_token, repository, namespace CASCADE`,
    );
  });

  test("counts tokens per ORG, across all its namespaces", async () => {
    const { db } = getTestDb();
    const nsA1 = await namespaceFactory.create(db, {
      name: "a1",
      organizationId: ORG_A,
    });
    const nsA2 = await namespaceFactory.create(db, {
      name: "a2",
      organizationId: ORG_A,
    });
    // one token in each of the org's two namespaces: 2 total for the org
    await insertToken(db, nsA1.id);
    await insertToken(db, nsA2.id);

    const result = await enforceApiTokenLimit(ORG_A, {
      db,
      resolve: limitOf(2),
    });

    // a per-namespace count would see only 1 < 2 and wrongly allow a 3rd;
    // the per-org count sees 2 >= 2 and blocks
    expect(result).not.toBeNull();
    expect(result?.status).toBe(402);
  });

  test("excludes expired tokens from the count", async () => {
    const { db } = getTestDb();
    const ns = await namespaceFactory.create(db, {
      name: "b",
      organizationId: ORG_B,
    });
    await insertToken(db, ns.id, new Date(Date.now() - 60_000).toISOString());
    await insertToken(db, ns.id); // one active

    const result = await enforceApiTokenLimit(ORG_B, {
      db,
      resolve: limitOf(2),
    });

    // only 1 active token counts, under the limit of 2
    expect(result).toBeNull();
  });

  test("allows creation under the limit", async () => {
    const { db } = getTestDb();
    const ns = await namespaceFactory.create(db, {
      name: "c",
      organizationId: ORG_C,
    });
    await insertToken(db, ns.id);

    const result = await enforceApiTokenLimit(ORG_C, {
      db,
      resolve: limitOf(2),
    });

    expect(result).toBeNull();
  });
});
