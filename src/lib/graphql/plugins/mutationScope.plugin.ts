import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { protectRoutes } from "lib/config/env.config";
import {
  apiTokenTable,
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";

import type { Plugin } from "graphql-yoga";
import type {
  ContextObserver,
  GraphQLContext,
} from "lib/graphql/createGraphqlContext";

type Db = GraphQLContext["db"];

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

/**
 * Resolve the Gatekeeper organization a mutation targets, so it can be checked
 * against the caller's memberships. Returns the org id, or null when the target
 * cannot be resolved (a missing row/namespace), in which case the mutation is
 * left to fail naturally. All reads go through the request's db (the same
 * connection the request uses), never a module-level pool.
 */
type TargetResolver = (
  db: Db,
  input: Record<string, unknown>,
) => Promise<string | null>;

const orgOfNamespace = async (
  db: Db,
  namespaceId: string | undefined,
): Promise<string | null> => {
  if (!namespaceId) return null;
  const [row] = await db
    .select({ organizationId: namespaceTable.organizationId })
    .from(namespaceTable)
    .where(eq(namespaceTable.id, namespaceId))
    .limit(1);
  return row?.organizationId ?? null;
};

const orgOfNamespaceByName = async (
  db: Db,
  name: string | undefined,
): Promise<string | null> => {
  if (!name) return null;
  const [row] = await db
    .select({ organizationId: namespaceTable.organizationId })
    .from(namespaceTable)
    .where(eq(namespaceTable.name, name))
    .limit(1);
  return row?.organizationId ?? null;
};

const orgOfRepository = async (
  db: Db,
  repositoryId: string | undefined,
): Promise<string | null> => {
  if (!repositoryId) return null;
  const [row] = await db
    .select({ organizationId: namespaceTable.organizationId })
    .from(repositoryTable)
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .where(eq(repositoryTable.id, repositoryId))
    .limit(1);
  return row?.organizationId ?? null;
};

const orgOfArtifact = async (
  db: Db,
  artifactId: string | undefined,
): Promise<string | null> => {
  if (!artifactId) return null;
  const [row] = await db
    .select({ organizationId: namespaceTable.organizationId })
    .from(artifactTable)
    .innerJoin(
      repositoryTable,
      eq(artifactTable.repositoryId, repositoryTable.id),
    )
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .where(eq(artifactTable.id, artifactId))
    .limit(1);
  return row?.organizationId ?? null;
};

const orgOfTag = async (
  db: Db,
  tagId: string | undefined,
): Promise<string | null> => {
  if (!tagId) return null;
  const [row] = await db
    .select({ organizationId: namespaceTable.organizationId })
    .from(tagTable)
    .innerJoin(repositoryTable, eq(tagTable.repositoryId, repositoryTable.id))
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .where(eq(tagTable.id, tagId))
    .limit(1);
  return row?.organizationId ?? null;
};

const orgOfApiToken = async (
  db: Db,
  tokenId: string | undefined,
): Promise<string | null> => {
  if (!tokenId) return null;
  const [row] = await db
    .select({ organizationId: namespaceTable.organizationId })
    .from(apiTokenTable)
    .innerJoin(namespaceTable, eq(apiTokenTable.namespaceId, namespaceTable.id))
    .where(eq(apiTokenTable.id, tokenId))
    .limit(1);
  return row?.organizationId ?? null;
};

/**
 * Explicit target-org resolvers, keyed by exact mutation name. Only the
 * client-used mutations are mapped; every other mutation on a scoped entity
 * (the `*ById` node-id variants, and the registry-internal metadata/scan-result
 * tables) is denied by default below, so a missed field fails closed rather
 * than open.
 */
const RESOLVERS: Record<string, TargetResolver> = {
  createRepository: (db, input) =>
    orgOfNamespace(db, asRecord(input.repository).namespaceId as string),
  updateRepository: (db, input) => orgOfRepository(db, input.rowId as string),
  deleteRepository: (db, input) => orgOfRepository(db, input.rowId as string),

  createNamespace: (_db, input) =>
    Promise.resolve(
      (asRecord(input.namespace).organizationId as string) ?? null,
    ),
  updateNamespace: (db, input) => orgOfNamespace(db, input.rowId as string),
  deleteNamespace: (db, input) => orgOfNamespace(db, input.rowId as string),
  updateNamespaceByName: (db, input) =>
    orgOfNamespaceByName(db, input.name as string),
  deleteNamespaceByName: (db, input) =>
    orgOfNamespaceByName(db, input.name as string),

  createArtifact: (db, input) =>
    orgOfRepository(db, asRecord(input.artifact).repositoryId as string),
  updateArtifact: (db, input) => orgOfArtifact(db, input.rowId as string),
  deleteArtifact: (db, input) => orgOfArtifact(db, input.rowId as string),

  createTag: (db, input) =>
    orgOfRepository(db, asRecord(input.tag).repositoryId as string),
  updateTag: (db, input) => orgOfTag(db, input.rowId as string),
  deleteTag: (db, input) => orgOfTag(db, input.rowId as string),

  createApiToken: (db, input) =>
    orgOfNamespace(db, asRecord(input.apiToken).namespaceId as string),
  updateApiToken: (db, input) => orgOfApiToken(db, input.rowId as string),
  deleteApiToken: (db, input) => orgOfApiToken(db, input.rowId as string),
};

/**
 * Entities owned by a tenant (through the namespace -> organization chain).
 * A create/update/delete on one of these must be scoped to the caller's org.
 */
const SCOPED_ENTITIES = new Set([
  "Repository",
  "Namespace",
  "Artifact",
  "Tag",
  "NpmDistTag",
  "UploadSession",
  "ContainerMetadatum",
  "WasmMetadatum",
  "SchemaMetadatum",
  "NpmMetadatum",
  "CargoMetadatum",
  "ScanResult",
  "ApiToken",
]);

/**
 * Global catalog entities with no tenant dimension. They are not tenant-scoped,
 * so this filter leaves them alone; restricting who may mutate them is an
 * admin-authorization concern (Warden), tracked separately.
 */
const GLOBAL_ENTITIES = new Set([
  "Plugin",
  "FederatedSource",
  "FederatedSkillCache",
  "OidcIssuer",
  "TrustedPublisher",
]);

/** Extract the entity name from an auto-CRUD mutation field name. */
const entityOf = (mutationName: string): string | null => {
  const match = mutationName.match(
    /^(?:create|update|delete)([A-Z][a-zA-Z]*?)(?:By[A-Z][a-zA-Z]*)?$/,
  );
  return match ? match[1] : null;
};

const forbidden = () =>
  new GraphQLError("Not authorized for this workspace", {
    extensions: { code: "FORBIDDEN" },
  });

/**
 * Mutation scope enforcement.
 *
 * Auto-generated CRUD mutations carry no tenant check, so any authenticated
 * caller could create, update, or delete another organization's resources.
 * This pre-execution guard resolves the organization each mutation targets and
 * rejects it unless the caller is a member, closing the integrity half of the
 * GraphQL tenant-isolation gap (the read half is the org-scope schema plugin).
 *
 * Deny-by-default: a mutation on a scoped entity that has no explicit resolver
 * (the `*ById` node-id variants, the registry-internal metadata/scan tables) is
 * rejected rather than allowed, so the guard fails closed. Global catalog
 * mutations are left alone (admin gating is a separate concern).
 *
 * Active only when `PROTECT_ROUTES` is on, matching the read filter: an ungated
 * single-owner self-host instance has no org to isolate.
 */
const createMutationScopePlugin = (): Plugin => ({
  async onExecute({ args, setResultAndStopExecution }) {
    if (!protectRoutes) return;

    const { observer, db } = args.contextValue as unknown as {
      observer?: ContextObserver | null;
      db: Db;
    };
    if (!observer) return;

    const operation = args.document.definitions.find(
      (d: { kind: string }): boolean => d.kind === "OperationDefinition",
    ) as
      | {
          operation: string;
          selectionSet: {
            selections: Array<{ kind: string; name: { value: string } }>;
          };
        }
      | undefined;
    if (!operation || operation.operation !== "mutation") return;

    const orgs = observer.organizations ?? [];
    const input = asRecord(
      (args.variableValues as Record<string, unknown> | undefined)?.input,
    );

    for (const selection of operation.selectionSet.selections) {
      if (selection.kind !== "Field") continue;

      const name = selection.name.value;
      const entity = entityOf(name);
      // not an auto-CRUD mutation, or a global catalog entity: not tenant-scoped
      if (!entity || GLOBAL_ENTITIES.has(entity)) continue;

      if (!SCOPED_ENTITIES.has(entity)) {
        // an unclassified entity: fail closed so a new table must be triaged
        setResultAndStopExecution({ errors: [forbidden()] });
        return;
      }

      const resolver = RESOLVERS[name];
      if (!resolver) {
        // a scoped mutation with no resolver (a `*ById` variant, or a
        // registry-internal table not mutated via the dashboard): deny
        setResultAndStopExecution({ errors: [forbidden()] });
        return;
      }

      const targetOrg = await resolver(db, input);
      // a resolvable target in another org is rejected; an unresolvable target
      // (missing row/namespace) falls through to the mutation's natural error
      if (targetOrg && !orgs.includes(targetOrg)) {
        setResultAndStopExecution({ errors: [forbidden()] });
        return;
      }
    }
  },
});

export default createMutationScopePlugin;
