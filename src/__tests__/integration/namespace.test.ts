import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { namespaceFactory } from "test/factories";

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error(
      "Test database not initialized. Ensure preload.ts is configured in bunfig.toml",
    );
  }
  return globalThis.__TEST_DATABASE__.db;
};

describe("Namespace CRUD", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, namespace CASCADE`,
    );
  });

  test("creates a namespace with expected fields", async () => {
    const db = getDb();
    const ns = await namespaceFactory.create(db, { name: "test-org" });

    expect(ns.id).toBeDefined();
    expect(ns.name).toBe("test-org");
    expect(ns.createdAt).toBeDefined();
    expect(ns.updatedAt).toBeDefined();
  });

  test("rejects duplicate namespace names", async () => {
    const db = getDb();
    await namespaceFactory.create(db, { name: "unique-org" });

    await expect(
      namespaceFactory.create(db, { name: "unique-org" }),
    ).rejects.toThrow();
  });

  test("lists created namespaces", async () => {
    const db = getDb();
    await namespaceFactory.create(db, { name: "org-a" });
    await namespaceFactory.create(db, { name: "org-b" });

    const { namespaceTable } = await import("lib/db/schema");
    const result = await db.select().from(namespaceTable);

    expect(result.length).toBe(2);
    expect(result.map((r: { name: string }) => r.name).sort()).toEqual([
      "org-a",
      "org-b",
    ]);
  });
});
