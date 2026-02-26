import { GraphQLError } from "graphql";

import { checkTokenPermission } from "lib/auth/checkTokenPermission";
import { isTokenObserver } from "lib/graphql/createGraphqlContext";

import type { Plugin } from "graphql-yoga";
import type { ContextObserver } from "lib/graphql/createGraphqlContext";

/**
 * Mutation names that require admin scope.
 * These are destructive operations that cannot be undone.
 */
const DELETE_MUTATIONS = new Set([
  "deleteNamespace",
  "deleteNamespaceById",
  "deleteNamespaceByName",
  "deleteRepository",
  "deleteRepositoryById",
  "deleteArtifact",
  "deleteArtifactById",
]);

/**
 * Determine the required permission for a GraphQL operation.
 *
 * @param operationType - The GraphQL operation type (query, mutation, subscription)
 * @param mutationNames - Field names for mutation operations
 * @returns Required permission level
 */
const getRequiredPermission = (
  operationType: string,
  mutationNames: string[],
): "read" | "write" | "admin" => {
  if (operationType !== "mutation") return "read";

  const hasDeleteMutation = mutationNames.some((name) =>
    DELETE_MUTATIONS.has(name),
  );

  if (hasDeleteMutation) return "admin";

  return "write";
};

/**
 * Create scope enforcement plugin for API token authorization.
 *
 * Intercepts GraphQL execution and enforces permission scopes for API tokens.
 * JWT users pass through without scope checks (they use org-level RBAC).
 *
 * Scope hierarchy: read < write < admin
 * - Queries require `read`
 * - Mutations require `write`
 * - Delete mutations require `admin`
 */
const createScopeEnforcementPlugin = (): Plugin => ({
  onExecute({ args }) {
    const observer =
      (args.contextValue as { observer?: ContextObserver }).observer ?? null;

    // JWT users pass through without scope checks
    if (!isTokenObserver(observer)) return;

    const operationDef = args.document.definitions.find(
      (d: { kind: string }): boolean => d.kind === "OperationDefinition",
    ) as
      | {
          operation: string;
          selectionSet: {
            selections: Array<{ kind: string; name: { value: string } }>;
          };
        }
      | undefined;

    if (!operationDef) return;

    const operationType = operationDef.operation;

    // Extract mutation field names for permission check
    const mutationNames =
      operationType === "mutation"
        ? operationDef.selectionSet.selections
            .filter((s: { kind: string }) => s.kind === "Field")
            .map((s: { name: { value: string } }) => s.name.value)
        : [];

    const requiredPermission = getRequiredPermission(
      operationType,
      mutationNames,
    );

    const hasPermission = checkTokenPermission(
      {
        scope: observer.scope,
        namespaceId: observer.namespaceId,
        repositoryId: observer.repositoryId,
      },
      observer.namespaceId,
      observer.repositoryId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new GraphQLError(
        `API token lacks required '${requiredPermission}' scope for this operation`,
        {
          extensions: {
            code: "FORBIDDEN",
            requiredScope: requiredPermission,
            tokenScope: observer.scope,
          },
        },
      );
    }
  },
});

export default createScopeEnforcementPlugin;
