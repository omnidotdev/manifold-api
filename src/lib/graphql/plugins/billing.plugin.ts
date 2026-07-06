import { and, count, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { getLimit, getTier, resolveEntitlements } from "lib/billing";
import { dbPool } from "lib/db";
import { namespaceTable, repositoryTable } from "lib/db/schema";

import type { Plugin } from "graphql-yoga";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";

/**
 * Resolve the organization id a gated mutation targets, plus the live count of
 * the resource being limited. Returns null when the mutation cannot be resolved
 * to an organization (e.g. self-hosted namespaces with no organization id), in
 * which case the gate is skipped
 */
type GateResolver = (
  variables: Record<string, unknown>,
) => Promise<{ organizationId: string; currentCount: number } | null>;

/**
 * Mutations gated by billing entitlements, keyed by mutation name.
 * Each gate maps to a catalog featureKey and a resolver that returns the target
 * organization and the current resource count so the limit can be enforced
 * BEFORE the row is persisted
 */
const BILLING_GATES: Record<
  string,
  { featureKey: string; resolve: GateResolver }
> = {
  createNamespace: {
    featureKey: "max_namespaces",
    resolve: async (variables) => {
      const namespaceInput = (variables?.input as Record<string, unknown>)
        ?.namespace as Record<string, unknown> | undefined;
      const organizationId = namespaceInput?.organizationId as
        | string
        | undefined;

      if (!organizationId) return null;

      const [row] = await dbPool
        .select({ count: count() })
        .from(namespaceTable)
        .where(eq(namespaceTable.organizationId, organizationId));

      return { organizationId, currentCount: row?.count ?? 0 };
    },
  },
  createRepository: {
    featureKey: "max_private_repos",
    resolve: async (variables) => {
      const repositoryInput = (variables?.input as Record<string, unknown>)
        ?.repository as Record<string, unknown> | undefined;
      const namespaceId = repositoryInput?.namespaceId as string | undefined;
      // public repos are not counted against the private repo limit
      const isPublic = repositoryInput?.isPublic === true;

      if (!namespaceId || isPublic) return null;

      const [namespace] = await dbPool
        .select({ organizationId: namespaceTable.organizationId })
        .from(namespaceTable)
        .where(eq(namespaceTable.id, namespaceId));

      const organizationId = namespace?.organizationId;
      if (!organizationId) return null;

      // private repos are scoped per organization (across all its namespaces)
      const [row] = await dbPool
        .select({ count: count() })
        .from(repositoryTable)
        .innerJoin(
          namespaceTable,
          eq(repositoryTable.namespaceId, namespaceTable.id),
        )
        .where(
          and(
            eq(namespaceTable.organizationId, organizationId),
            eq(repositoryTable.isPublic, false),
          ),
        );

      return { organizationId, currentCount: row?.count ?? 0 };
    },
  },
};

/**
 * GraphQL billing enforcement plugin.
 *
 * Checks resource limits BEFORE gated mutations execute by awaiting the limit
 * resolution inside `onExecute` and throwing a `GraphQLError` when the limit is
 * reached. Throwing here aborts execution before any row is persisted
 */
function createBillingPlugin(): Plugin<GraphQLContext> {
  return {
    async onExecute({ args }) {
      const { contextValue, document } = args;

      if (!contextValue.observer) return;

      for (const definition of document.definitions) {
        if (definition.kind !== "OperationDefinition") continue;
        if (definition.operation !== "mutation") continue;

        for (const selection of definition.selectionSet.selections) {
          if (selection.kind !== "Field") continue;

          const gate = BILLING_GATES[selection.name.value];
          if (!gate) continue;

          const variables = args.variableValues as Record<string, unknown>;
          const resolved = await gate.resolve(variables);
          if (!resolved) continue;

          const { organizationId, currentCount } = resolved;
          const entitlements = await resolveEntitlements(organizationId);
          const limit = getLimit(entitlements, gate.featureKey);

          if (limit !== -1 && currentCount >= limit) {
            const tier = getTier(entitlements);
            throw new GraphQLError(
              `${gate.featureKey.replace("max_", "").replaceAll("_", " ")} limit reached (${currentCount}/${limit}). Upgrade from ${tier} plan`,
              {
                extensions: {
                  code: "BILLING_LIMIT_EXCEEDED",
                  tier,
                  limit,
                  current: currentCount,
                },
              },
            );
          }
        }
      }
    },
  };
}

export default createBillingPlugin;
