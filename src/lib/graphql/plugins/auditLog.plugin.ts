import logAuditEvent from "lib/logging/logAuditEvent";

import type { DefinitionNode, FieldNode, SelectionNode } from "graphql";
import type { Plugin } from "graphql-yoga";
import type { ContextObserver } from "lib/graphql/createGraphqlContext";

/**
 * Log GraphQL mutations as audit events
 */
const createAuditLogPlugin = (): Plugin => ({
  onExecute({ args }) {
    const observer = (args.contextValue as { observer?: ContextObserver })
      .observer;
    const operationType = args.document.definitions.find(
      (d: DefinitionNode) => d.kind === "OperationDefinition",
    );

    if (
      !operationType ||
      operationType.kind !== "OperationDefinition" ||
      operationType.operation !== "mutation"
    ) {
      return;
    }

    const mutationNames = operationType.selectionSet.selections
      .filter((s: SelectionNode) => s.kind === "Field")
      .map((s: SelectionNode) => (s as FieldNode).name.value);

    for (const name of mutationNames) {
      logAuditEvent(
        { userId: observer?.id },
        {
          action: `graphql.${name}`,
          resource: "graphql",
          resourceId: name,
        },
      );
    }
  },
});

export default createAuditLogPlugin;
