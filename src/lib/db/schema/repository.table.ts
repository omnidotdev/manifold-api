import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { namespaceTable } from "lib/db/schema/namespace.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Repository table.
 */
export const repositoryTable = pgTable(
  "repository",
  {
    id: generateDefaultId(),
    namespaceId: uuid()
      .notNull()
      .references(() => namespaceTable.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    // openapi, graphql, jsonschema, oci, wasm
    artifactType: text().notNull(),
    isPublic: boolean().notNull().default(false),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.namespaceId, table.name),
    index().on(table.namespaceId),
    index().on(table.artifactType),
  ],
);

export type InsertRepository = InferInsertModel<typeof repositoryTable>;
export type SelectRepository = InferSelectModel<typeof repositoryTable>;
