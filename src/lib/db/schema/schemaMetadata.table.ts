import { boolean, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { artifactTable } from "lib/db/schema/artifact.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Schema metadata table (for OpenAPI, GraphQL, JSON Schema artifacts).
 */
export const schemaMetadataTable = pgTable("schema_metadata", {
  artifactId: uuid()
    .primaryKey()
    .references(() => artifactTable.id, { onDelete: "cascade" }),
  version: text(),
  title: text(),
  isValid: boolean().notNull().default(true),
  validationErrors: jsonb(),
});

export type InsertSchemaMetadata = InferInsertModel<typeof schemaMetadataTable>;
export type SelectSchemaMetadata = InferSelectModel<typeof schemaMetadataTable>;
