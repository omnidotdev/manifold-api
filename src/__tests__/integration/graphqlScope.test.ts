import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import createScopeEnforcementPlugin from "lib/graphql/plugins/scopeEnforcement.plugin";
import { createTestGraphQLClient } from "test/util/graphqlClient";

import type { TokenObserver } from "lib/graphql/createGraphqlContext";

const TEST_NAMESPACE_ID = "00000000-0000-0000-0000-000000000001";

const getTestDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error(
      "Test database not initialized. Ensure preload.ts is configured in bunfig.toml",
    );
  }
  return globalThis.__TEST_DATABASE__;
};

/**
 * Create a token observer with the given scope for testing
 */
const makeTokenObserver = (
  scope: "read" | "write" | "admin",
): TokenObserver => ({
  id: `token:test-${scope}`,
  name: `Test ${scope} token`,
  isApiToken: true,
  tokenId: `test-token-${scope}`,
  tokenName: `test-${scope}`,
  scope,
  namespaceId: TEST_NAMESPACE_ID,
  repositoryId: null,
});

/**
 * Create a GraphQL client with the scope enforcement plugin
 */
const makeClient = (observer: TokenObserver | null) => {
  const { pool, db } = getTestDb();

  return createTestGraphQLClient({
    pool,
    db,
    observer,
    plugins: [createScopeEnforcementPlugin()],
  });
};

/**
 * Create a GraphQL client for JWT users (no isApiToken field)
 */
const makeJwtClient = () => {
  const { pool, db } = getTestDb();

  return createTestGraphQLClient({
    pool,
    db,
    observer: { id: "user-123", name: "JWT User", email: "jwt@example.com" },
    plugins: [createScopeEnforcementPlugin()],
  });
};

const NAMESPACES_QUERY = /* GraphQL */ `
  {
    namespaces {
      nodes {
        id
      }
    }
  }
`;

const CREATE_NAMESPACE_MUTATION = /* GraphQL */ `
  mutation {
    createNamespace(input: { namespace: { name: "test-scope-ns" } }) {
      namespace {
        id
      }
    }
  }
`;

const DELETE_NAMESPACE_MUTATION = /* GraphQL */ `
  mutation {
    deleteNamespaceByName(input: { name: "test-scope-ns" }) {
      deletedNamespaceId
    }
  }
`;

describe("GraphQL scope enforcement", () => {
  beforeEach(async () => {
    const { db } = getTestDb();
    await db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, api_token, namespace CASCADE`,
    );
  });

  describe("read-scoped token", () => {
    test("can run queries", async () => {
      const client = makeClient(makeTokenObserver("read"));
      const result = await client.execute(NAMESPACES_QUERY);

      expect(result.errors).toBeUndefined();
    });

    test("cannot run mutations", async () => {
      const client = makeClient(makeTokenObserver("read"));
      const result = await client.execute(CREATE_NAMESPACE_MUTATION);

      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain("write");
      expect(result.errors![0].extensions?.code).toBe("FORBIDDEN");
    });
  });

  describe("write-scoped token", () => {
    test("can run queries", async () => {
      const client = makeClient(makeTokenObserver("write"));
      const result = await client.execute(NAMESPACES_QUERY);

      expect(result.errors).toBeUndefined();
    });

    test("can run mutations", async () => {
      const client = makeClient(makeTokenObserver("write"));
      const result = await client.execute(CREATE_NAMESPACE_MUTATION);

      // No scope errors (may have DB errors since table is empty, that is fine)
      const scopeErrors = (result.errors ?? []).filter(
        (e) => e.extensions?.code === "FORBIDDEN",
      );
      expect(scopeErrors).toHaveLength(0);
    });

    test("cannot run delete mutations", async () => {
      const client = makeClient(makeTokenObserver("write"));
      const result = await client.execute(DELETE_NAMESPACE_MUTATION);

      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain("admin");
      expect(result.errors![0].extensions?.code).toBe("FORBIDDEN");
    });
  });

  describe("admin-scoped token", () => {
    test("can run queries", async () => {
      const client = makeClient(makeTokenObserver("admin"));
      const result = await client.execute(NAMESPACES_QUERY);

      expect(result.errors).toBeUndefined();
    });

    test("can run mutations", async () => {
      const client = makeClient(makeTokenObserver("admin"));
      const result = await client.execute(CREATE_NAMESPACE_MUTATION);

      const scopeErrors = (result.errors ?? []).filter(
        (e) => e.extensions?.code === "FORBIDDEN",
      );
      expect(scopeErrors).toHaveLength(0);
    });

    test("can run delete mutations", async () => {
      const client = makeClient(makeTokenObserver("admin"));
      const result = await client.execute(DELETE_NAMESPACE_MUTATION);

      // No scope errors (may have DB errors since namespace doesn't exist)
      const scopeErrors = (result.errors ?? []).filter(
        (e) => e.extensions?.code === "FORBIDDEN",
      );
      expect(scopeErrors).toHaveLength(0);
    });
  });

  describe("JWT user (no isApiToken)", () => {
    test("passes through queries without scope checks", async () => {
      const client = makeJwtClient();
      const result = await client.execute(NAMESPACES_QUERY);

      expect(result.errors).toBeUndefined();
    });

    test("passes through mutations without scope checks", async () => {
      const client = makeJwtClient();
      const result = await client.execute(CREATE_NAMESPACE_MUTATION);

      const scopeErrors = (result.errors ?? []).filter(
        (e) => e.extensions?.code === "FORBIDDEN",
      );
      expect(scopeErrors).toHaveLength(0);
    });

    test("passes through delete mutations without scope checks", async () => {
      const client = makeJwtClient();
      const result = await client.execute(DELETE_NAMESPACE_MUTATION);

      const scopeErrors = (result.errors ?? []).filter(
        (e) => e.extensions?.code === "FORBIDDEN",
      );
      expect(scopeErrors).toHaveLength(0);
    });
  });
});
