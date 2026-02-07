import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Namespace table (organizations/users).
 * Each namespace maps 1:1 to an organization in Gatekeeper.
 */
export const namespaceTable = pgTable(
  "namespace",
  {
    id: generateDefaultId(),
    // External reference to Gatekeeper organization ID
    organizationId: uuid("organization_id"),
    name: text().notNull().unique(),
    description: text(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.name),
    index("namespace_organization_id_index").on(table.organizationId),
  ],
);

export type InsertNamespace = InferInsertModel<typeof namespaceTable>;
export type SelectNamespace = InferSelectModel<typeof namespaceTable>;
