import { count, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { getLimit, getTier, resolveEntitlements } from "lib/billing";
import { dbPool } from "lib/db";
import { namespaceTable } from "lib/db/schema";

import type { Plugin } from "graphql-yoga";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";

/**
 * Mutations gated by billing entitlements.
 * Maps mutation name to featureKey for limit checking
 */
const BILLING_GATES: Record<string, string> = {
  createNamespace: "max_namespaces",
};

/**
 * GraphQL billing enforcement plugin.
 * Checks resource limits before gated mutations execute
 */
function createBillingPlugin(): Plugin<GraphQLContext> {
  return {
    onExecute({ args }) {
      const { contextValue, document } = args;
      const observer = contextValue.observer;

      if (!observer) return;

      // Extract mutation names from the document
      for (const definition of document.definitions) {
        if (definition.kind !== "OperationDefinition") continue;
        if (definition.operation !== "mutation") continue;

        for (const selection of definition.selectionSet.selections) {
          if (selection.kind !== "Field") continue;

          const mutationName = selection.name.value;
          const featureKey = BILLING_GATES[mutationName];

          if (!featureKey) continue;

          // Extract organizationId from input variables
          const input = args.variableValues as Record<string, unknown>;
          const namespaceInput = (input?.input as Record<string, unknown>)
            ?.namespace as Record<string, unknown> | undefined;
          const orgId = namespaceInput?.organizationId as string | undefined;

          if (!orgId) continue;

          return {
            async onExecuteDone({ setResult }) {
              const entitlements = await resolveEntitlements(orgId);

              // Count current resources
              let currentCount = 0;
              if (featureKey === "max_namespaces") {
                const [row] = await dbPool
                  .select({ count: count() })
                  .from(namespaceTable)
                  .where(eq(namespaceTable.organizationId, orgId));
                currentCount = row?.count ?? 0;
              }

              const limit = getLimit(entitlements, featureKey);

              if (limit !== -1 && currentCount >= limit) {
                const tier = getTier(entitlements);
                setResult({
                  errors: [
                    new GraphQLError(
                      `${featureKey.replace("max_", "").replaceAll("_", " ")} limit reached (${currentCount}/${limit}). Upgrade from ${tier} plan`,
                      {
                        extensions: {
                          code: "BILLING_LIMIT_EXCEEDED",
                          tier,
                          limit,
                          current: currentCount,
                        },
                      },
                    ),
                  ],
                });
              }
            },
          };
        }
      }
    },
  };
}

export default createBillingPlugin;
