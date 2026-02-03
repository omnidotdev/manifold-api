import { bigint, index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { repositoryTable } from "lib/db/schema/repository.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Upload session table (for chunked OCI uploads).
 */
export const uploadSessionTable = pgTable(
  "upload_session",
  {
    id: generateDefaultId(),
    repositoryId: uuid()
      .notNull()
      .references(() => repositoryTable.id, { onDelete: "cascade" }),
    offset: bigint({ mode: "number" }).notNull().default(0),
    createdAt: generateDefaultDate(),
    expiresAt: timestamp({ precision: 6, mode: "string", withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.repositoryId),
    index().on(table.expiresAt),
  ],
);

export type InsertUploadSession = InferInsertModel<typeof uploadSessionTable>;
export type SelectUploadSession = InferSelectModel<typeof uploadSessionTable>;
