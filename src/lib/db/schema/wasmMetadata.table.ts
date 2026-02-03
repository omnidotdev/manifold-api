import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { artifactTable } from "lib/db/schema/artifact.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * WASM metadata table.
 */
export const wasmMetadataTable = pgTable("wasm_metadata", {
  artifactId: uuid()
    .primaryKey()
    .references(() => artifactTable.id, { onDelete: "cascade" }),
  runtime: text(),
  exports: jsonb().notNull().default([]),
  imports: jsonb().notNull().default([]),
});

export type InsertWasmMetadata = InferInsertModel<typeof wasmMetadataTable>;
export type SelectWasmMetadata = InferSelectModel<typeof wasmMetadataTable>;
