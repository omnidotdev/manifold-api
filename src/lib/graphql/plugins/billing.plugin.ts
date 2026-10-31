import { count, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { getLimit, getTier, resolveEntitlements } from "lib/billing";
import { namespaceTable } from "lib/db/schema";

import type { EntitlementsResponse } from "@omnidotdev/providers";
import type { Plugin } from "graphql-yoga";
import type {
  ContextObserver,
  GraphQLContext,
} from "lib/graphql/createGraphqlContext";

type Db = GraphQLContext["db"];

/** Resolve an org's entitlements; injectable so tests can exercise limits
 * deterministically (the real resolver is inert when Aether is unconfigured). */
type ResolveEntitlements = (
  organizationId: string | null,
) => Promise<EntitlementsResponse | null>;

interface BillingPluginDeps {
  resolveEntitlements?: ResolveEntitlements;
}

/**
 * Mutations gated by billing entitlements, mapped to the SSOT featureKey.
 */
const BILLING_GATES: Record<string, string> = {
  createNamespace: "max_namespaces",
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

/** Count the resources already consumed toward a limit for an org. */
const currentUsage = async (
  db: Db,
  featureKey: string,
  orgId: string,
): Promise<number> => {
  if (featureKey === "max_namespaces") {
    const [row] = await db
      .select({ value: count() })
      .from(namespaceTable)
      .where(eq(namespaceTable.organizationId, orgId));
    return row?.value ?? 0;
  }
  return 0;
};

/**
 * GraphQL billing enforcement plugin.
 *
 * Checks a resource limit BEFORE the gated mutation executes and stops it when
 * the limit is already reached, so an over-limit resource is never written.
 * The previous implementation checked in `onExecuteDone` (after the insert, no
 * rollback) with a `>=` comparison on the post-insert count, which both
 * persisted the over-limit row and rejected a free-tier user's very first
 * namespace. Counting before the write fixes both: `count >= limit` pre-insert
 * means creating one more would exceed.
 */
const createBillingPlugin = (deps: BillingPluginDeps = {}): Plugin => ({
  async onExecute({ args, setResultAndStopExecution }) {
    const resolve = deps.resolveEntitlements ?? resolveEntitlements;

    const { observer, db } = args.contextValue as unknown as {
      observer?: ContextObserver | null;
      db: Db;
    };
    if (!observer) return;

    for (const definition of args.document.definitions) {
      if (definition.kind !== "OperationDefinition") continue;
      if (definition.operation !== "mutation") continue;

      for (const selection of definition.selectionSet.selections) {
        if (selection.kind !== "Field") continue;

        const featureKey = BILLING_GATES[selection.name.value];
        if (!featureKey) continue;

        const input = asRecord(
          (args.variableValues as Record<string, unknown> | undefined)?.input,
        );
        const orgId = asRecord(input.namespace).organizationId as
          | string
          | undefined;
        if (!orgId) continue;

        const entitlements = await resolve(orgId);
        const limit = getLimit(entitlements, featureKey);
        if (limit === -1) continue; // unlimited

        const usage = await currentUsage(db, featureKey, orgId);
        if (usage >= limit) {
          const tier = getTier(entitlements);
          setResultAndStopExecution({
            errors: [
              new GraphQLError(
                `${featureKey.replace("max_", "").replaceAll("_", " ")} limit reached (${usage}/${limit}). Upgrade from ${tier} plan`,
                {
                  extensions: {
                    code: "BILLING_LIMIT_EXCEEDED",
                    tier,
                    limit,
                    current: usage,
                  },
                },
              ),
            ],
          });
          return;
        }
      }
    }
  },
});

export default createBillingPlugin;
