/**
 * Remove the Relay root node accessors.
 *
 * The `id`/`nodeId` global identifier on each table type is kept (the dashboard
 * selects `id` on every row), but the root `node(nodeId)` query and the
 * `*ById` accessors are removed: they are unscoped, polymorphic read paths that
 * the org-scope plugin cannot filter, so a caller could otherwise fetch any row
 * by its global id. The `*ById` accessors come from `NodeAccessorPlugin`
 * (disabled in the preset); this hook drops the remaining `node`/`nodeId`
 * fields from the Query type, which `NodePlugin` adds inseparably from the
 * kept `id` field.
 */

const RemoveQueryNodePlugin: GraphileConfig.Plugin = {
  name: "RemoveQueryNodePlugin",
  version: "1.0.0",
  schema: {
    hooks: {
      GraphQLObjectType_fields(fields, _build, context) {
        if (context.Self.name !== "Query") return fields;

        const mutable = fields as Record<string, unknown>;
        delete mutable.node;
        delete mutable.nodeId;

        return fields;
      },
    },
  },
};

export default RemoveQueryNodePlugin;
