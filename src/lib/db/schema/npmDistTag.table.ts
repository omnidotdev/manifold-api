import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { repositoryTable } from "lib/db/schema/repository.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/** npm dist-tags (e.g. latest -> 1.0.0), one row per (repo, tag). */
export const npmDistTagTable = pgTable(
  "npm_dist_tag",
  {
    id: generateDefaultId(),
    repositoryId: uuid()
      .notNull()
      .references(() => repositoryTable.id, { onDelete: "cascade" }),
    tag: text().notNull(),
    version: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.repositoryId, table.tag),
    index().on(table.repositoryId),
  ],
);

export type InsertNpmDistTag = InferInsertModel<typeof npmDistTagTable>;
export type SelectNpmDistTag = InferSelectModel<typeof npmDistTagTable>;
