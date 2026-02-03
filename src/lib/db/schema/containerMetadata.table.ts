import { integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { artifactTable } from "lib/db/schema/artifact.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Container metadata table (for OCI images).
 */
export const containerMetadataTable = pgTable("container_metadata", {
  artifactId: uuid()
    .primaryKey()
    .references(() => artifactTable.id, { onDelete: "cascade" }),
  schemaVersion: integer().notNull(),
  architecture: text(),
  os: text(),
  configDigest: text(),
  layerDigests: jsonb().notNull().default([]),
});

export type InsertContainerMetadata = InferInsertModel<
  typeof containerMetadataTable
>;
export type SelectContainerMetadata = InferSelectModel<
  typeof containerMetadataTable
>;
