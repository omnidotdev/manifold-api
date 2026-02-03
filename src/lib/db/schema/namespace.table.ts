import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Namespace table (organizations/users).
 */
export const namespaceTable = pgTable(
  "namespace",
  {
    id: generateDefaultId(),
    name: text().notNull().unique(),
    description: text(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), index().on(table.name)],
);

export type InsertNamespace = InferInsertModel<typeof namespaceTable>;
export type SelectNamespace = InferSelectModel<typeof namespaceTable>;
