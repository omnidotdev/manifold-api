import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { auditLogTable } from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";
import { setupTestContext } from "test/setup/testContext";
import { makeYogaServer } from "test/util/server";

// Point the shared dbPool (used by logAuditEvent) at the test container, so its
// writes land in the same database setupTestContext reads from.
const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const ctx = setupTestContext();

describe("Audit log", () => {
  test("persists an audit event to the table", async () => {
    await logAuditEvent(
      { organizationId: "org-x", userId: "user-1" },
      {
        action: "test.audit.action",
        resource: "thing",
        resourceId: "42",
        details: { a: 1 },
      },
    );

    const rows = await ctx.db
      .select()
      .from(auditLogTable)
      .where(eq(auditLogTable.action, "test.audit.action"));

    expect(rows.length).toBe(1);
    expect(rows[0].organizationId).toBe("org-x");
    expect(rows[0].resourceId).toBe("42");
    expect(rows[0].details).toEqual({ a: 1 });
  });

  test("is NOT exposed through the GraphQL schema", async () => {
    const yoga = makeYogaServer();
    // Every auto-generated access path must be absent (validation error),
    // proving the omit plugin keeps this org-sensitive table off the API.
    for (const query of [
      "{ auditLogs { nodes { id } } }",
      "{ auditLog(id: \"x\") { id } }",
      'mutation { createAuditLog(input: { auditLog: { action: "x", resource: "y" } }) { clientMutationId } }',
    ]) {
      const res = await yoga.fetch("http://test/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const body = (await res.json()) as {
        errors?: { message: string }[];
        data?: unknown;
      };
      expect(body.errors).toBeDefined();
      expect(body.data ?? null).toBeNull();
    }
  });
});
