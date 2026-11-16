import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import {
  assertSchemaSurface,
  findTableReadFields,
  loadSchema,
} from "@omnidotdev/providers/graphql-surface";

import { ORG_SCOPED_QUERY_FIELDS } from "lib/graphql/plugins/orgScope.plugin";

import type { SchemaSurfacePolicy } from "@omnidotdev/providers/graphql-surface";

/**
 * Reviewed GraphQL surface.
 *
 * Reads are filtered by OrgScopePlugin (public rows plus the caller's orgs).
 * Generated mutations exist only for the tables SchemaHardeningPlugin opts in,
 * and each is checked by the mutation scope guard: the target row's org must
 * be one of the caller's, an ownership-moving patch must land in one too, and
 * the `*ById` node-id variants have no resolver so they are always denied.
 * Registry trust and catalog tables are not in the schema at all
 */
const ORG_READ = "public rows or caller's orgs via OrgScopePlugin";
const ORG_WRITE = "caller is a member of the target org (mutationScope)";
const ORG_ADMIN = "member + Warden admin/owner role (mutationScope)";
const MOVE = "member of the row's org and of any patched-in parent's org";
const DENIED = "always denied: node-id variant has no scope resolver";

const read = (fields: string[]) =>
  Object.fromEntries(fields.map((field) => [field, ORG_READ]));

const POLICY: SchemaSurfacePolicy = {
  Query: {
    id: "Relay node id of the root query (no data)",
    ...read([
      "namespace",
      "namespaces",
      "namespaceByName",
      "repository",
      "repositories",
      "artifact",
      "artifacts",
      "tag",
      "tags",
      "npmDistTag",
      "npmDistTags",
      "npmMetadatum",
      "npmMetadata",
      "cargoMetadatum",
      "cargoMetadata",
      "pypiMetadatum",
      "pypiMetadata",
      "containerMetadatum",
      "containerMetadata",
      "wasmMetadatum",
      "wasmMetadata",
      "schemaMetadatum",
      "schemaMetadata",
      "scanResult",
      "scanResults",
      "apiToken",
      "apiTokens",
    ]),
  },
  Mutation: {
    createNamespace: `${ORG_WRITE}; org required, reserved names blocked`,
    updateNamespace: MOVE,
    updateNamespaceByName: MOVE,
    deleteNamespace: ORG_ADMIN,
    deleteNamespaceByName: ORG_ADMIN,
    updateNamespaceById: DENIED,
    deleteNamespaceById: DENIED,
    createRepository: ORG_WRITE,
    updateRepository: MOVE,
    deleteRepository: ORG_ADMIN,
    updateRepositoryById: DENIED,
    deleteRepositoryById: DENIED,
    createArtifact: ORG_WRITE,
    updateArtifact: MOVE,
    deleteArtifact: ORG_WRITE,
    updateArtifactById: DENIED,
    deleteArtifactById: DENIED,
    createTag: ORG_WRITE,
    updateTag: MOVE,
    deleteTag: ORG_WRITE,
    updateTagById: DENIED,
    deleteTagById: DENIED,
  },
};

const schema = loadSchema(
  join(import.meta.dir, "../../generated/graphql/schema.graphql"),
);

describe("GraphQL schema surface", () => {
  test("matches the reviewed policy", () => {
    assertSchemaSurface(schema, POLICY);
  });

  test("every table read is org scoped", () => {
    const reads = findTableReadFields(schema);

    expect(reads.length).toBeGreaterThan(0);
    for (const field of reads) {
      expect(ORG_SCOPED_QUERY_FIELDS).toContain(field);
    }
  });
});
