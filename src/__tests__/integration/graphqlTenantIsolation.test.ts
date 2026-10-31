import { describe, expect, test } from "bun:test";

import { artifactFactory } from "test/factories/artifact.factory";
import { namespaceFactory } from "test/factories/namespace.factory";
import { repositoryFactory } from "test/factories/repository.factory";
import {
  generateTestToken,
  mswServer,
  TEST_USER_ID,
  userInfoHandlerWithOrgs,
} from "test/setup/mswServer";
import { setupTestContext } from "test/setup/testContext";
import { makeYogaServer } from "test/util/server";

import type { SelectNamespace, SelectRepository } from "lib/db/schema";

const ORG_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ORG_C = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const ctx = setupTestContext();

interface Seeded {
  nsA: SelectNamespace;
  nsB: SelectNamespace;
  nsC: SelectNamespace;
  repoAPrivate: SelectRepository;
  repoAPublic: SelectRepository;
  repoBPrivate: SelectRepository;
  repoCPrivate: SelectRepository;
}

/**
 * Seed three orgs: A and C are foreign to the caller, B is the caller's org.
 * The caller is a member of org B only.
 */
const seed = async (): Promise<Seeded> => {
  const { db } = ctx;

  const nsA = await namespaceFactory.create(db, {
    name: "org-a-ns",
    organizationId: ORG_A,
  });
  const nsB = await namespaceFactory.create(db, {
    name: "org-b-ns",
    organizationId: ORG_B,
  });
  const nsC = await namespaceFactory.create(db, {
    name: "org-c-ns",
    organizationId: ORG_C,
  });

  const repoAPrivate = await repositoryFactory.create(db, {
    namespaceId: nsA.id,
    name: "a-private",
    isPublic: false,
  });
  const repoAPublic = await repositoryFactory.create(db, {
    namespaceId: nsA.id,
    name: "a-public",
    isPublic: true,
  });
  const repoBPrivate = await repositoryFactory.create(db, {
    namespaceId: nsB.id,
    name: "b-private",
    isPublic: false,
  });
  const repoCPrivate = await repositoryFactory.create(db, {
    namespaceId: nsC.id,
    name: "c-private",
    isPublic: false,
  });

  return {
    nsA,
    nsB,
    nsC,
    repoAPrivate,
    repoAPublic,
    repoBPrivate,
    repoCPrivate,
  };
};

/** A dashboard (JWT) observer who belongs to org B only. */
const orgBMember = { id: "user-b", name: "B User", organizations: [ORG_B] };

const REPOSITORIES_QUERY = /* GraphQL */ `
  {
    repositories {
      totalCount
      nodes {
        rowId
        name
        isPublic
      }
    }
  }
`;

const REPOSITORY_BY_ROWID_QUERY = /* GraphQL */ `
  query ($rowId: UUID!) {
    repository(rowId: $rowId) {
      rowId
      name
    }
  }
`;

const NAMESPACES_QUERY = /* GraphQL */ `
  {
    namespaces {
      totalCount
      nodes {
        rowId
        name
        organizationId
      }
    }
  }
`;

describe("GraphQL tenant isolation (reads)", () => {
  test("repositories connection hides other orgs' private repos", async () => {
    const seeded = await seed();

    const result = await ctx
      .graphqlAs(orgBMember)
      .execute<{
        repositories: { nodes: Array<{ rowId: string; isPublic: boolean }> };
      }>(REPOSITORIES_QUERY);

    expect(result.errors).toBeUndefined();
    const ids = (result.data?.repositories.nodes ?? []).map((n) => n.rowId);

    // own-org private + any public are visible
    expect(ids).toContain(seeded.repoBPrivate.id);
    expect(ids).toContain(seeded.repoAPublic.id);

    // other orgs' private repos are NOT visible
    expect(ids).not.toContain(seeded.repoAPrivate.id);
    expect(ids).not.toContain(seeded.repoCPrivate.id);
  });

  test("repository(rowId:) returns null for another org's private repo", async () => {
    const seeded = await seed();

    const result = await ctx
      .graphqlAs(orgBMember)
      .execute<{ repository: { rowId: string } | null }>(
        REPOSITORY_BY_ROWID_QUERY,
        { rowId: seeded.repoAPrivate.id },
      );

    expect(result.errors).toBeUndefined();
    expect(result.data?.repository).toBeNull();
  });

  test("repository(rowId:) still returns the caller's own private repo", async () => {
    const seeded = await seed();

    const result = await ctx
      .graphqlAs(orgBMember)
      .execute<{ repository: { rowId: string } | null }>(
        REPOSITORY_BY_ROWID_QUERY,
        { rowId: seeded.repoBPrivate.id },
      );

    expect(result.errors).toBeUndefined();
    expect(result.data?.repository?.rowId).toBe(seeded.repoBPrivate.id);
  });

  test("namespaces hides an org with only private repos the caller can't see", async () => {
    const seeded = await seed();

    const result = await ctx
      .graphqlAs(orgBMember)
      .execute<{
        namespaces: { nodes: Array<{ rowId: string }> };
      }>(NAMESPACES_QUERY);

    expect(result.errors).toBeUndefined();
    const ids = (result.data?.namespaces.nodes ?? []).map((n) => n.rowId);

    // member org, and the foreign org that owns a public repo, are visible
    expect(ids).toContain(seeded.nsB.id);
    expect(ids).toContain(seeded.nsA.id);

    // the foreign org with only private repos is hidden
    expect(ids).not.toContain(seeded.nsC.id);
  });

  test("artifacts of another org's private repo are hidden", async () => {
    const seeded = await seed();
    const { db } = ctx;

    const foreignArtifact = await artifactFactory.create(db, {
      repositoryId: seeded.repoAPrivate.id,
    });
    const ownArtifact = await artifactFactory.create(db, {
      repositoryId: seeded.repoBPrivate.id,
    });
    const publicArtifact = await artifactFactory.create(db, {
      repositoryId: seeded.repoAPublic.id,
    });

    const result = await ctx
      .graphqlAs(orgBMember)
      .execute<{ artifacts: { nodes: Array<{ rowId: string }> } }>(
        /* GraphQL */ `{ artifacts { nodes { rowId } } }`,
      );

    expect(result.errors).toBeUndefined();
    const ids = (result.data?.artifacts.nodes ?? []).map((n) => n.rowId);

    expect(ids).toContain(ownArtifact.id);
    expect(ids).toContain(publicArtifact.id);
    expect(ids).not.toContain(foreignArtifact.id);
  });

  test("every org-scoped read executes without a SQL error for a member", async () => {
    await seed();

    // Exercises each wrapper shape (repository-child, artifact-child,
    // api-token) so a wrong foreign-key column surfaces as a SQL error even
    // against empty child tables
    const result = await ctx.graphqlAs(orgBMember).execute(/* GraphQL */ `
      {
        repositories { totalCount }
        namespaces { totalCount }
        artifacts { totalCount }
        tags { totalCount }
        npmDistTags { totalCount }
        uploadSessions { totalCount }
        npmMetadata { totalCount }
        cargoMetadata { totalCount }
        scanResults { totalCount }
        containerMetadata { totalCount }
        wasmMetadata { totalCount }
        schemaMetadata { totalCount }
        apiTokens { totalCount }
      }
    `);

    expect(result.errors).toBeUndefined();
  });

  test("end-to-end: a JWT user's org membership from userinfo scopes reads", async () => {
    const seeded = await seed();

    // Drive the real auth path: the userinfo endpoint reports the caller is a
    // member of org B only
    mswServer.use(userInfoHandlerWithOrgs([ORG_B]));
    const token = await generateTestToken({ sub: TEST_USER_ID });

    const yoga = makeYogaServer({
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await yoga.fetch("http://test/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: /* GraphQL */ `{ repositories { nodes { rowId isPublic } } }`,
      }),
    });

    const json = (await res.json()) as {
      errors?: unknown;
      data?: { repositories: { nodes: Array<{ rowId: string }> } };
    };

    expect(json.errors).toBeUndefined();
    const ids = (json.data?.repositories.nodes ?? []).map((n) => n.rowId);

    expect(ids).toContain(seeded.repoBPrivate.id);
    expect(ids).toContain(seeded.repoAPublic.id);
    expect(ids).not.toContain(seeded.repoAPrivate.id);
    expect(ids).not.toContain(seeded.repoCPrivate.id);
  });
});
