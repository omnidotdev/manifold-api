import { beforeEach, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";

import createBillingPlugin from "lib/graphql/plugins/billing.plugin";
import { namespaceTable } from "lib/db/schema";
import { createTestGraphQLClient } from "test/util/graphqlClient";

import type { EntitlementsResponse } from "@omnidotdev/providers";

const ORG = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const getTestDb = () => globalThis.__TEST_DATABASE__;

// A free tier that allows a single namespace
const freeOneNamespace = async (): Promise<EntitlementsResponse> =>
  ({
    entitlements: [
      { featureKey: "max_namespaces", value: "1" },
      { featureKey: "tier", value: "free" },
    ],
  }) as unknown as EntitlementsResponse;

const client = () => {
  const { pool, db } = getTestDb();
  return createTestGraphQLClient({
    pool,
    db,
    observer: { id: "user", organizations: [ORG] },
    plugins: [createBillingPlugin({ resolveEntitlements: freeOneNamespace })],
  });
};

const createNamespace = (name: string) =>
  client().execute<{ createNamespace: { namespace: { rowId: string } } }>(
    /* GraphQL */ `
      mutation ($input: CreateNamespaceInput!) {
        createNamespace(input: $input) { namespace { rowId } }
      }
    `,
    { input: { namespace: { name, organizationId: ORG } } },
  );

const namespaceCount = async () => {
  const [row] = await getTestDb()
    .db.select({ value: sql<number>`count(*)::int` })
    .from(namespaceTable)
    .where(eq(namespaceTable.organizationId, ORG));
  return row?.value ?? 0;
};

describe("billing: namespace limit enforcement", () => {
  beforeEach(async () => {
    await getTestDb().db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, api_token, namespace CASCADE`,
    );
  });

  test("allows a free-tier user's FIRST namespace", async () => {
    const result = await createNamespace("first-ns");

    expect(result.errors).toBeUndefined();
    expect(await namespaceCount()).toBe(1);
  });

  test("blocks the second namespace BEFORE it is written (no over-limit row)", async () => {
    const first = await createNamespace("first-ns");
    expect(first.errors).toBeUndefined();

    const second = await createNamespace("second-ns");

    expect(second.errors).toBeDefined();
    expect(second.errors?.[0]?.extensions?.code).toBe("BILLING_LIMIT_EXCEEDED");
    // the over-limit namespace must NOT have been created
    expect(await namespaceCount()).toBe(1);
  });
});
