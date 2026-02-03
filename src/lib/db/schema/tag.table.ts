import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { artifactTable } from "lib/db/schema/artifact.table";
import { repositoryTable } from "lib/db/schema/repository.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Tag table (named references to artifacts).
 */
export const tagTable = pgTable(
  "tag",
  {
    id: generateDefaultId(),
    repositoryId: uuid()
      .notNull()
      .references(() => repositoryTable.id, { onDelete: "cascade" }),
    artifactId: uuid()
      .notNull()
      .references(() => artifactTable.id, { onDelete: "cascade" }),
    name: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.repositoryId, table.name),
    index().on(table.repositoryId),
    index().on(table.artifactId),
  ],
);

export type InsertTag = InferInsertModel<typeof tagTable>;
export type SelectTag = InferSelectModel<typeof tagTable>;
