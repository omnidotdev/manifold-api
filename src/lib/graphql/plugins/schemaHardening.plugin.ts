import { jsonPgSmartTags } from "postgraphile/utils";

/**
 * Remove a table from GraphQL entirely: its type, every root read, every
 * mutation, and the relation fields that point at it
 */
const HIDDEN = { tags: { behavior: "-*" } } as const;

/**
 * Re-enable the generated create/update/delete mutations that the preset's
 * fail-closed `defaultBehavior` removes. Only tables the dashboard writes
 * through GraphQL opt back in, and every one of them is checked by the
 * mutation scope guard (target org membership, plus ownership-moving patches)
 */
const WRITABLE = {
  tags: { behavior: "+resource:insert +resource:update +resource:delete" },
} as const;

/**
 * Keep the generated GraphQL surface to what the dashboard uses.
 *
 * Registry protocols (OCI, npm, Cargo, PyPI) and trusted publishing read and
 * write these tables directly, never through GraphQL. Left exposed, the
 * generated CRUD let any signed-in account register an OIDC issuer or a
 * trusted publisher for another workspace's namespace (publishing as that
 * workspace), rewrite the plugin catalog or federated sources, and read every
 * workspace's trust configuration, because the org-scope read filter and the
 * mutation guard cover only tenant tables.
 *
 * A new table gets no mutations by default (see `defaultBehavior` in the
 * preset) and must be added to the reviewed surface test before it ships.
 */
export const SchemaHardeningPlugin = jsonPgSmartTags(
  {
    version: 1,
    config: {
      class: {
        // Registry trust and global catalog: server-managed only
        oidc_issuer: HIDDEN,
        trusted_publisher: HIDDEN,
        plugin: HIDDEN,
        federated_source: HIDDEN,
        federated_skill_cache: HIDDEN,
        // In-flight upload bookkeeping, written by the registry upload paths
        upload_session: HIDDEN,
        // Tenant tables the dashboard creates, edits and deletes
        namespace: WRITABLE,
        repository: WRITABLE,
        artifact: WRITABLE,
        tag: WRITABLE,
      },
    },
  },
  null,
  { name: "SchemaHardeningPlugin" },
);
