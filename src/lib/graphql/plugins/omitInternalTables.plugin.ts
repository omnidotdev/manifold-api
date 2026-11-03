/**
 * Omit internal tables from the GraphQL schema.
 *
 * Some tables are system-written and must never be reachable through the
 * auto-generated CRUD API, because the org-scope plugin is a per-field
 * whitelist: a table left in the schema but absent from that whitelist would
 * be readable (and writable) across tenants. The audit log is one such table.
 * It is served, if at all, only through an explicitly org-scoped path.
 *
 * This removes every Query and Mutation field whose name references an omitted
 * table (connection, single read, and create/update/delete). The row type may
 * remain defined but is unreachable: no field returns it and no FK relation
 * points to it, so it cannot be selected.
 */

/** Inflection stems (lowercased) of tables to omit from Query and Mutation. */
const OMITTED_STEMS = ["auditlog", "webhook"];

const OmitInternalTablesPlugin: GraphileConfig.Plugin = {
  name: "OmitInternalTablesPlugin",
  version: "1.0.0",
  schema: {
    hooks: {
      GraphQLObjectType_fields(fields, _build, context) {
        const typeName = context.Self.name;
        if (typeName !== "Query" && typeName !== "Mutation") return fields;

        const mutable = fields as Record<string, unknown>;
        for (const key of Object.keys(mutable)) {
          const lower = key.toLowerCase();
          if (OMITTED_STEMS.some((stem) => lower.includes(stem))) {
            delete mutable[key];
          }
        }

        return fields;
      },
    },
  },
};

export default OmitInternalTablesPlugin;
