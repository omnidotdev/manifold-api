import { bigint, index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { repositoryTable } from "lib/db/schema/repository.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Artifact table (blobs, manifests, schemas, etc).
 */
export const artifactTable = pgTable(
  "artifact",
  {
    id: generateDefaultId(),
    repositoryId: uuid()
      .notNull()
      .references(() => repositoryTable.id, { onDelete: "cascade" }),
    // sha256:... content-addressed digest
    digest: text().notNull(),
    size: bigint({ mode: "number" }).notNull(),
    mediaType: text().notNull(),
    // small artifacts can be stored inline; large ones use blob storage
    content: text(),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.repositoryId, table.digest),
    index().on(table.repositoryId),
    index().on(table.digest),
  ],
);

export type InsertArtifact = InferInsertModel<typeof artifactTable>;
export type SelectArtifact = InferSelectModel<typeof artifactTable>;
