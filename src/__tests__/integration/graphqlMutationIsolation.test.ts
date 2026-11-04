import { beforeEach, describe, expect, test } from "bun:test";
import { and, eq, sql } from "drizzle-orm";

import createMutationScopePlugin from "lib/graphql/plugins/mutationScope.plugin";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import { artifactFactory } from "test/factories/artifact.factory";
import { namespaceFactory } from "test/factories/namespace.factory";
import { repositoryFactory } from "test/factories/repository.factory";
import { createTestGraphQLClient } from "test/util/graphqlClient";

import type { ContextObserver } from "lib/graphql/createGraphqlContext";

const ORG_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const getTestDb = () => globalThis.__TEST_DATABASE__;

const orgBMember: ContextObserver = {
  id: "user-b",
  name: "B User",
  organizations: [ORG_B],
};

const guardedClient = (observer: ContextObserver) => {
  const { pool, db } = getTestDb();
  return createTestGraphQLClient({
    pool,
    db,
    observer,
    plugins: [createMutationScopePlugin()],
  });
};

/** A mock Warden authz provider that allows or denies every permission check. */
const mockAuthz = (allow: boolean) => ({
  checkPermission: () => Promise.resolve(allow),
});

/** Guarded client with an injected Warden authz provider (for role checks). */
const roleGatedClient = (observer: ContextObserver, allow: boolean) => {
  const { pool, db } = getTestDb();
  return createTestGraphQLClient({
    pool,
    db,
    observer,
    plugins: [createMutationScopePlugin({ authz: mockAuthz(allow) })],
  });
};

const seed = async () => {
  const { db } = getTestDb();
  const nsA = await namespaceFactory.create(db, {
    name: "org-a-ns",
    organizationId: ORG_A,
  });
  const nsB = await namespaceFactory.create(db, {
    name: "org-b-ns",
    organizationId: ORG_B,
  });
  const repoAPrivate = await repositoryFactory.create(db, {
    namespaceId: nsA.id,
    name: "a-private",
    isPublic: false,
  });
  return { nsA, nsB, repoAPrivate };
};

describe("GraphQL mutation isolation (integrity)", () => {
  beforeEach(async () => {
    const { db } = getTestDb();
    await db.execute(
      sql`TRUNCATE TABLE upload_session, artifact, tag, repository, api_token, namespace CASCADE`,
    );
  });

  test("cannot delete another org's repository", async () => {
    const { repoAPrivate } = await seed();

    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: DeleteRepositoryInput!) {
          deleteRepository(input: $input) { repository { rowId } }
        }
      `,
      { input: { rowId: repoAPrivate.id } },
    );

    expect(result.errors).toBeDefined();
    const [row] = await getTestDb()
      .db.select()
      .from(repositoryTable)
      .where(eq(repositoryTable.id, repoAPrivate.id));
    expect(row).toBeDefined();
  });

  test("cannot update another org's repository", async () => {
    const { repoAPrivate } = await seed();

    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: UpdateRepositoryInput!) {
          updateRepository(input: $input) { repository { rowId } }
        }
      `,
      { input: { rowId: repoAPrivate.id, patch: { description: "pwned" } } },
    );

    expect(result.errors).toBeDefined();
    const [row] = await getTestDb()
      .db.select()
      .from(repositoryTable)
      .where(eq(repositoryTable.id, repoAPrivate.id));
    expect(row?.description).not.toBe("pwned");
  });

  test("cannot create a repository under another org's namespace", async () => {
    const { nsA } = await seed();

    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: CreateRepositoryInput!) {
          createRepository(input: $input) { repository { rowId } }
        }
      `,
      {
        input: {
          repository: {
            namespaceId: nsA.id,
            name: "evil-in-a",
            artifactType: "oci",
            isPublic: false,
          },
        },
      },
    );

    expect(result.errors).toBeDefined();
    const [row] = await getTestDb()
      .db.select()
      .from(repositoryTable)
      .where(
        and(
          eq(repositoryTable.namespaceId, nsA.id),
          eq(repositoryTable.name, "evil-in-a"),
        ),
      );
    expect(row).toBeUndefined();
  });

  test("CAN create a repository under the caller's own namespace", async () => {
    const { nsB } = await seed();

    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: CreateRepositoryInput!) {
          createRepository(input: $input) { repository { rowId name } }
        }
      `,
      {
        input: {
          repository: {
            namespaceId: nsB.id,
            name: "good-in-b",
            artifactType: "oci",
            isPublic: false,
          },
        },
      },
    );

    expect(result.errors).toBeUndefined();
    const [row] = await getTestDb()
      .db.select()
      .from(repositoryTable)
      .where(
        and(
          eq(repositoryTable.namespaceId, nsB.id),
          eq(repositoryTable.name, "good-in-b"),
        ),
      );
    expect(row).toBeDefined();
  });

  test("cannot create a namespace with no organization (orphan)", async () => {
    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: CreateNamespaceInput!) {
          createNamespace(input: $input) { namespace { rowId } }
        }
      `,
      { input: { namespace: { name: "orphan-ns" } } },
    );

    expect(result.errors).toBeDefined();
    const [row] = await getTestDb()
      .db.select()
      .from(namespaceTable)
      .where(eq(namespaceTable.name, "orphan-ns"));
    expect(row).toBeUndefined();
  });

  test("CAN create a namespace in the caller's own org", async () => {
    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: CreateNamespaceInput!) {
          createNamespace(input: $input) { namespace { rowId name } }
        }
      `,
      { input: { namespace: { name: "b-ns", organizationId: ORG_B } } },
    );

    expect(result.errors).toBeUndefined();
    const [row] = await getTestDb()
      .db.select()
      .from(namespaceTable)
      .where(eq(namespaceTable.name, "b-ns"));
    expect(row).toBeDefined();
  });

  test("cannot delete another org's artifact", async () => {
    const { db } = getTestDb();
    const { repoAPrivate } = await seed();
    const artifact = await artifactFactory.create(db, {
      repositoryId: repoAPrivate.id,
    });

    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: DeleteArtifactInput!) {
          deleteArtifact(input: $input) { artifact { rowId } }
        }
      `,
      { input: { rowId: artifact.id } },
    );

    expect(result.errors).toBeDefined();
    const [row] = await db
      .select()
      .from(artifactTable)
      .where(eq(artifactTable.id, artifact.id));
    expect(row).toBeDefined();
  });

  test("cannot delete another org's tag", async () => {
    const { db } = getTestDb();
    const { repoAPrivate } = await seed();
    const artifact = await artifactFactory.create(db, {
      repositoryId: repoAPrivate.id,
    });
    const [tag] = await db
      .insert(tagTable)
      .values({
        repositoryId: repoAPrivate.id,
        artifactId: artifact.id,
        name: "latest",
      })
      .returning();

    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: DeleteTagInput!) {
          deleteTag(input: $input) { tag { rowId } }
        }
      `,
      { input: { rowId: tag.id } },
    );

    expect(result.errors).toBeDefined();
    const [row] = await db
      .select()
      .from(tagTable)
      .where(eq(tagTable.id, tag.id));
    expect(row).toBeDefined();
  });

  test("denies a scoped mutation with no explicit resolver (fail closed)", async () => {
    const { repoAPrivate } = await seed();
    const { db } = getTestDb();
    const artifact = await artifactFactory.create(db, {
      repositoryId: repoAPrivate.id,
    });

    // createScanResult is a scoped-entity mutation the dashboard never uses; it
    // must be rejected rather than silently allowed
    const result = await guardedClient(orgBMember).execute(
      /* GraphQL */ `
        mutation ($input: CreateScanResultInput!) {
          createScanResult(input: $input) { scanResult { rowId } }
        }
      `,
      {
        input: {
          scanResult: { artifactId: artifact.id, status: "clean" },
        },
      },
    );

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
  });

  const DELETE_REPO = /* GraphQL */ `
    mutation ($input: DeleteRepositoryInput!) {
      deleteRepository(input: $input) { repository { rowId } }
    }
  `;

  test("Warden: denies a sensitive org mutation when the member lacks admin/owner", async () => {
    const { nsB } = await seed();
    const repoB = await repositoryFactory.create(getTestDb().db, {
      namespaceId: nsB.id,
      name: "b-repo",
      isPublic: false,
    });

    // org-B member, but Warden denies the admin/owner role
    const result = await roleGatedClient(orgBMember, false).execute(DELETE_REPO, {
      input: { rowId: repoB.id },
    });

    expect(result.errors).toBeDefined();
    const [row] = await getTestDb()
      .db.select()
      .from(repositoryTable)
      .where(eq(repositoryTable.id, repoB.id));
    expect(row).toBeDefined(); // not deleted
  });

  test("Warden: allows a sensitive org mutation when the member has admin/owner", async () => {
    const { nsB } = await seed();
    const repoB = await repositoryFactory.create(getTestDb().db, {
      namespaceId: nsB.id,
      name: "b-repo2",
      isPublic: false,
    });

    // org-B member, and Warden grants the admin role
    const result = await roleGatedClient(orgBMember, true).execute(DELETE_REPO, {
      input: { rowId: repoB.id },
    });

    expect(result.errors).toBeUndefined();
    const [row] = await getTestDb()
      .db.select()
      .from(repositoryTable)
      .where(eq(repositoryTable.id, repoB.id));
    expect(row).toBeUndefined(); // deleted
  });
});
