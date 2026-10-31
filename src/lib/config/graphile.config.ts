import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
import { makePgService } from "postgraphile/adaptors/pg";
import { PostGraphileAmberPreset } from "postgraphile/presets/amber";
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter";

import { OrgScopePlugin } from "lib/graphql/plugins/orgScope.plugin";
import RemoveQueryNodePlugin from "lib/graphql/plugins/removeQueryNode.plugin";
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
  plugins: [OrgScopePlugin, RemoveQueryNodePlugin],
  // NodeAccessorPlugin adds the unscoped `*ById` row accessors; drop it (the
  // dashboard uses the per-table connection and single-by-rowId reads instead)
  disablePlugins: ["NodeAccessorPlugin"],
  pgServices: [makePgService({ connectionString })],
  grafast: { explain: isDevEnv },
});
