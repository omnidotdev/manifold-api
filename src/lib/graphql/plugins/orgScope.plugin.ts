/**
 * Org scope plugin.
 *
 * Application-layer multi-tenancy for the dashboard GraphQL API: every
 * auto-generated read is filtered to what the caller may see. A repository is
 * visible when it is public or belongs (through its namespace) to one of the
 * caller's Gatekeeper organizations; a namespace is visible when the caller is
 * a member or it owns a public repository; artifacts, tags and per-artifact
 * metadata inherit their repository's visibility. An empty org set (anonymous,
 * or a caller with no org) matches `ANY('{}')` = false, so only public
 * resources are returned.
 *
 * The caller's org ids come from the observer already on the Grafast context
 * (set by the authentication plugin), so there is no separate context field to
 * keep in sync. The Relay `node(id)` accessor and the `*ById` fields are
 * removed from the schema (see the preset's `disablePlugins` and
 * `RemoveQueryNodePlugin`), so the only reads are the per-table connection and
 * single-by-rowId/byName fields wrapped here; every relation is reachable only
 * from an already-scoped parent row.
 *
 * Registry paths (OCI, npm, Cargo) do NOT go through this schema; they read the
 * same tables directly and enforce their own visibility (public anonymously
 * readable, private requires a token), so this filter is scoped to GraphQL
 * only and does not affect anonymous registry pulls.
 *
 * The filter applies only when `PROTECT_ROUTES` is on (a tenant-isolated
 * deployment where auth is required). In an ungated single-owner self-host
 * instance there is no org to isolate, so the wrappers are no-ops and the owner
 * sees everything; a production deployment forces `PROTECT_ROUTES` on via a
 * boot guard, so scoping is always active there.
 *
 * No `EXPORTABLE`: the schema is assembled at boot via `makeSchema`, not
 * pre-compiled, so the plan wrappers can be plain closures.
 */

import { TYPES, listOfCodec } from "postgraphile/@dataplan/pg";
import { context, lambda } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { protectRoutes } from "lib/config/env.config";

import type { Step } from "grafast";
import type { ContextObserver } from "lib/graphql/createGraphqlContext";
import type { PgSelectStep } from "postgraphile/@dataplan/pg";
import type { PlanWrapperFn } from "postgraphile/utils";

/** uuid[] codec for binding the caller's org ids as a SQL placeholder. */
const uuidArrayCodec = listOfCodec(TYPES.uuid);

/**
 * Unwrap a read plan to its underlying `pgSelect`. PostGraphile exposes it via
 * `getClassStep()` for a single row and `getSubplan()` for a connection;
 * anything else is left untouched.
 */
const resolvePgSelect = (plan: unknown): PgSelectStep | null => {
  const candidate = plan as {
    getClassStep?: () => PgSelectStep;
    getSubplan?: () => PgSelectStep;
  };
  if (typeof candidate?.getClassStep === "function") {
    return candidate.getClassStep();
  }
  if (typeof candidate?.getSubplan === "function") {
    return candidate.getSubplan();
  }
  return null;
};

/** The caller's org ids, derived from the observer on the context. */
const orgIdsPlaceholder = (select: PgSelectStep) => {
  const orgIds = lambda(
    context().get("observer") as Step,
    (observer: ContextObserver | null) => observer?.organizations ?? [],
  );
  return select.placeholder(orgIds as Step, uuidArrayCodec);
};

/**
 * Scope a read on `repository` (or a table joined to it) to public rows plus
 * rows whose owning namespace belongs to one of the caller's orgs.
 */
const wrapRepositoryRead = (): PlanWrapperFn => (plan) => {
  const $plan = plan();
  const $select = resolvePgSelect($plan);

  if ($select && protectRoutes) {
    const placeholder = orgIdsPlaceholder($select);
    $select.where(
      ({ sql }) =>
        sql`${$select.alias}.${sql.identifier("is_public")} or exists (select 1 from ${sql.identifier("namespace")} as n where n.${sql.identifier("id")} = ${$select.alias}.${sql.identifier("namespace_id")} and n.${sql.identifier("organization_id")} = any (${placeholder}))`,
    );
  }

  return $plan;
};

/**
 * Scope a read on `namespace` to orgs the caller belongs to, plus namespaces
 * that own at least one public repository (so a public repo remains browsable
 * through its namespace).
 */
const wrapNamespaceRead = (): PlanWrapperFn => (plan) => {
  const $plan = plan();
  const $select = resolvePgSelect($plan);

  if ($select && protectRoutes) {
    const placeholder = orgIdsPlaceholder($select);
    $select.where(
      ({ sql }) =>
        sql`${$select.alias}.${sql.identifier("organization_id")} = any (${placeholder}) or exists (select 1 from ${sql.identifier("repository")} as r where r.${sql.identifier("namespace_id")} = ${$select.alias}.${sql.identifier("id")} and r.${sql.identifier("is_public")})`,
    );
  }

  return $plan;
};

/**
 * Scope a read on a child of `repository` (`artifact`, `tag`, and their
 * per-artifact metadata reach `repository` through `repository_id`) to rows
 * whose repository is visible to the caller.
 */
const wrapRepositoryChildRead = (foreignKey: string): PlanWrapperFn => {
  return (plan) => {
    const $plan = plan();
    const $select = resolvePgSelect($plan);

    if ($select) {
      const placeholder = orgIdsPlaceholder($select);
      $select.where(
        ({ sql }) =>
          sql`exists (select 1 from ${sql.identifier("repository")} as r where r.${sql.identifier("id")} = ${$select.alias}.${sql.identifier(foreignKey)} and (r.${sql.identifier("is_public")} or exists (select 1 from ${sql.identifier("namespace")} as n where n.${sql.identifier("id")} = r.${sql.identifier("namespace_id")} and n.${sql.identifier("organization_id")} = any (${placeholder}))))`,
      );
    }

    return $plan;
  };
};

/**
 * Scope a read on a child of `artifact` (`container_metadata`, `wasm_metadata`,
 * `schema_metadata` key on `artifact_id`) to rows whose artifact's repository
 * is visible to the caller.
 */
const wrapArtifactChildRead = (foreignKey: string): PlanWrapperFn => {
  return (plan) => {
    const $plan = plan();
    const $select = resolvePgSelect($plan);

    if ($select) {
      const placeholder = orgIdsPlaceholder($select);
      $select.where(
        ({ sql }) =>
          sql`exists (select 1 from ${sql.identifier("artifact")} as a join ${sql.identifier("repository")} as r on r.${sql.identifier("id")} = a.${sql.identifier("repository_id")} where a.${sql.identifier("id")} = ${$select.alias}.${sql.identifier(foreignKey)} and (r.${sql.identifier("is_public")} or exists (select 1 from ${sql.identifier("namespace")} as n where n.${sql.identifier("id")} = r.${sql.identifier("namespace_id")} and n.${sql.identifier("organization_id")} = any (${placeholder}))))`,
      );
    }

    return $plan;
  };
};

/** Scope a read on `api_token` (keyed on `namespace_id`) to the caller's orgs. */
const wrapApiTokenRead = (): PlanWrapperFn => (plan) => {
  const $plan = plan();
  const $select = resolvePgSelect($plan);

  if ($select && protectRoutes) {
    const placeholder = orgIdsPlaceholder($select);
    $select.where(
      ({ sql }) =>
        sql`exists (select 1 from ${sql.identifier("namespace")} as n where n.${sql.identifier("id")} = ${$select.alias}.${sql.identifier("namespace_id")} and n.${sql.identifier("organization_id")} = any (${placeholder}))`,
    );
  }

  return $plan;
};

const byRepository = wrapRepositoryRead();
const byNamespace = wrapNamespaceRead();
const byRepositoryId = wrapRepositoryChildRead("repository_id");
const byArtifactId = wrapArtifactChildRead("artifact_id");
const byApiTokenNamespace = wrapApiTokenRead();

/**
 * Wrap every per-table read (connection + single-by-rowId/byName) in the
 * caller's org scope. Field names follow PgSimplifyInflection.
 */
export const OrgScopePlugin = wrapPlans({
  Query: {
    namespace: byNamespace,
    namespaces: byNamespace,
    namespaceByName: byNamespace,
    repository: byRepository,
    repositories: byRepository,
    artifact: byRepositoryId,
    artifacts: byRepositoryId,
    tag: byRepositoryId,
    tags: byRepositoryId,
    npmDistTag: byRepositoryId,
    npmDistTags: byRepositoryId,
    uploadSession: byRepositoryId,
    uploadSessions: byRepositoryId,
    npmMetadatum: byArtifactId,
    npmMetadata: byArtifactId,
    cargoMetadatum: byArtifactId,
    cargoMetadata: byArtifactId,
    scanResult: byArtifactId,
    scanResults: byArtifactId,
    containerMetadatum: byArtifactId,
    wasmMetadatum: byArtifactId,
    schemaMetadatum: byArtifactId,
    apiToken: byApiTokenNamespace,
    apiTokens: byApiTokenNamespace,
  },
});
