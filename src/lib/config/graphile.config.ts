import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
import { makePgService } from "postgraphile/adaptors/pg";
import { PostGraphileAmberPreset } from "postgraphile/presets/amber";
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter";

import OmitInternalTablesPlugin from "lib/graphql/plugins/omitInternalTables.plugin";
import { OrgScopePlugin } from "lib/graphql/plugins/orgScope.plugin";
import RemoveQueryNodePlugin from "lib/graphql/plugins/removeQueryNode.plugin";
import { SchemaHardeningPlugin } from "lib/graphql/plugins/schemaHardening.plugin";
import { DATABASE_URL, isDevEnv } from "./env.config";

/**
 * Build the Graphile preset.
 *
 * Exposed as a factory so the test harness can bind the schema to its
 * ephemeral container, while the server and schema generator use the
 * environment's `DATABASE_URL`.
 */
export const createGraphilePreset = (
  connectionString: string | undefined = DATABASE_URL,
): GraphileConfig.Preset => ({
  extends: [
    PostGraphileAmberPreset,
    PgSimplifyInflectionPreset,
    PostGraphileConnectionFilterPreset,
  ],
  plugins: [
    SchemaHardeningPlugin,
    OrgScopePlugin,
    RemoveQueryNodePlugin,
    OmitInternalTablesPlugin,
  ],
  // NodeAccessorPlugin adds the unscoped `*ById` row accessors; drop it (the
  // dashboard uses the per-table connection and single-by-rowId reads instead)
  disablePlugins: ["NodeAccessorPlugin"],
  schema: {
    // Fail closed: no table gets generated create/update/delete mutations
    // unless SchemaHardeningPlugin opts it back in, so a newly added table is
    // never writable through GraphQL by default
    defaultBehavior: "-resource:insert -resource:update -resource:delete",
  },
  pgServices: [makePgService({ connectionString })],
  grafast: { explain: isDevEnv },
});
