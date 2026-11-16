import { eq } from "drizzle-orm";
import { GraphQLError, getArgumentValues } from "graphql";

import { protectRoutes } from "lib/config/env.config";
import {
  apiTokenTable,
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import { authz as defaultAuthz } from "lib/providers";
import { isReservedNamespace } from "lib/registry/reservedNames";

import type { FieldNode } from "graphql";
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
 * Mutations that MUST resolve to a non-null target org. A namespace is the root
 * of the org-ownership chain (every other scoped entity resolves its org through
 * an existing namespace), so a namespace created without an organization is
 * orphaned from tenant scoping: it belongs to no workspace and is invisible in
 * the dashboard. Require the org explicitly rather than silently creating one.
 */
const ORG_REQUIRED_MUTATIONS = new Set(["createNamespace"]);

/**
 * Ownership-moving patch fields. An update that repoints a row's owning parent
 * (a repository into another namespace, an artifact or tag onto another
 * repository, a namespace onto another organization) must land in an org the
 * caller also belongs to, or it would plant or transfer rows across tenants
 */
const PATCH_TARGETS: Record<string, TargetResolver> = {
  updateRepository: (db, input) =>
    orgOfNamespace(db, asRecord(input.patch).namespaceId as string),
  updateNamespace: (_db, input) =>
    Promise.resolve(
      (asRecord(input.patch).organizationId as string | undefined) ?? null,
    ),
  updateNamespaceByName: (_db, input) =>
    Promise.resolve(
      (asRecord(input.patch).organizationId as string | undefined) ?? null,
    ),
  updateArtifact: (db, input) =>
    orgOfRepository(db, asRecord(input.patch).repositoryId as string),
  updateTag: (db, input) =>
    orgOfRepository(db, asRecord(input.patch).repositoryId as string),
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
 * Global catalog and registry-trust entities with no tenant dimension. They are
 * managed server-side only, never through GraphQL, so their mutations are
 * denied outright (and removed from the schema by the preset).
 */
const GLOBAL_ENTITIES = new Set([
  "Plugin",
  "FederatedSource",
  "FederatedSkillCache",
  "OidcIssuer",
  "TrustedPublisher",
]);

/**
 * Org mutations that require an admin/owner role, not just membership. When the
 * authz provider (Warden) is configured these are additionally checked against
 * the caller's role; when it is not configured (an ungated single-owner
 * self-host instance) they fall back to the membership check, so the owner
 * keeps full control.
 */
const ADMIN_MUTATIONS = new Set([
  "deleteNamespace",
  "deleteNamespaceByName",
  "deleteRepository",
  "createApiToken",
  "deleteApiToken",
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

const reservedName = () =>
  new GraphQLError("That namespace name is reserved", {
    extensions: { code: "RESERVED_NAMESPACE_NAME" },
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
 * rejected rather than allowed, so the guard fails closed. Global catalog and
 * registry-trust mutations are denied outright.
 *
 * Active only when `PROTECT_ROUTES` is on, matching the read filter: an ungated
 * single-owner self-host instance has no org to isolate.
 */
/** The slice of the authz provider this plugin needs (injectable for tests). */
type AuthzCheck = Pick<NonNullable<typeof defaultAuthz>, "checkPermission">;

const createMutationScopePlugin = ({
  authz = defaultAuthz,
}: {
  authz?: AuthzCheck;
} = {}): Plugin => ({
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
    const mutationFields = args.schema.getMutationType()?.getFields() ?? {};

    for (const selection of operation.selectionSet.selections) {
      if (selection.kind !== "Field") continue;

      const name = selection.name.value;
      const entity = entityOf(name);
      const fieldDef = mutationFields[name];

      // Resolve THIS field's arguments as execution will see them: inline
      // literals, any variable name, and one input per aliased field. Reading
      // only `variables.input` let an inline or renamed input skip the check
      let input: Record<string, unknown> = {};
      if (fieldDef) {
        try {
          input = asRecord(
            getArgumentValues(
              fieldDef,
              selection as unknown as FieldNode,
              args.variableValues as Record<string, unknown> | undefined,
            ).input,
          );
        } catch {
          // invalid arguments fail validation/execution on their own
        }
      }
      // not an auto-CRUD mutation: custom fields authorize themselves
      if (!entity) continue;

      // Global catalog and trust configuration (OIDC issuers, trusted
      // publishers, plugins, federated sources) have no tenant to check and no
      // GraphQL client; they are hidden from the schema, and any that surface
      // are denied so a signed-in member can never rewrite registry trust
      if (GLOBAL_ENTITIES.has(entity)) {
        setResultAndStopExecution({ errors: [forbidden()] });
        return;
      }

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

      // Block claiming a reserved namespace name (routing/system words and
      // first-party brand terms), so a tenant cannot squat or impersonate.
      if (name === "createNamespace") {
        const nsName = asRecord(input.namespace).name;
        if (typeof nsName === "string" && isReservedNamespace(nsName)) {
          setResultAndStopExecution({ errors: [reservedName()] });
          return;
        }
      }

      const targetOrg = await resolver(db, input);
      // a namespace create with no resolvable org would orphan the namespace
      // from tenant scoping: reject rather than create an unowned namespace
      if (!targetOrg && ORG_REQUIRED_MUTATIONS.has(name)) {
        setResultAndStopExecution({ errors: [forbidden()] });
        return;
      }
      // a resolvable target in another org is rejected; an unresolvable target
      // (missing row/namespace) falls through to the mutation's natural error
      if (targetOrg && !orgs.includes(targetOrg)) {
        setResultAndStopExecution({ errors: [forbidden()] });
        return;
      }

      // An update that repoints the row's owning parent must target an org
      // the caller also belongs to (no transfer into another workspace)
      const patchTarget = PATCH_TARGETS[name];
      if (patchTarget) {
        const patch = asRecord(input.patch);
        const movesOwner = [
          "namespaceId",
          "organizationId",
          "repositoryId",
        ].some((key) => patch[key] !== undefined);
        if (movesOwner) {
          const newOrg = await patchTarget(db, input);
          if (!newOrg || !orgs.includes(newOrg)) {
            setResultAndStopExecution({ errors: [forbidden()] });
            return;
          }
        }
      }

      // Admin/owner role gate (Warden) for sensitive org operations, layered on
      // top of the membership check above. Only enforced when authz is
      // configured; an ungated self-host instance falls back to membership.
      if (targetOrg && authz && ADMIN_MUTATIONS.has(name)) {
        const allowed =
          (await authz.checkPermission(
            observer.id,
            "organization",
            targetOrg,
            "admin",
          )) ||
          (await authz.checkPermission(
            observer.id,
            "organization",
            targetOrg,
            "owner",
          ));
        if (!allowed) {
          setResultAndStopExecution({ errors: [forbidden()] });
          return;
        }
      }
    }
  },
});

export default createMutationScopePlugin;
