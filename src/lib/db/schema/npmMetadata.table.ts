import { jsonb, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { artifactTable } from "lib/db/schema/artifact.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/** npm package version metadata; one row per published version. */
export const npmMetadataTable = pgTable(
  "npm_metadata",
  {
    id: generateDefaultId(),
    artifactId: uuid()
      .notNull()
      .references(() => artifactTable.id, { onDelete: "cascade" }),
    // Full scoped name, e.g. "@coopbri/astro"
    name: text().notNull(),
    version: text().notNull(),
    // The version's package.json (manifest) as published
    manifest: jsonb().notNull(),
    // npm dist.shasum (sha1 hex)
    shasum: text().notNull(),
    // npm dist.integrity (sha512 SRI)
    integrity: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.artifactId),
    uniqueIndex().on(table.name, table.version),
  ],
);

export type InsertNpmMetadata = InferInsertModel<typeof npmMetadataTable>;
export type SelectNpmMetadata = InferSelectModel<typeof npmMetadataTable>;
