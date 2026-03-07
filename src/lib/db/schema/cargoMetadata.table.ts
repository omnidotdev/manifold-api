import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { artifactTable } from "lib/db/schema/artifact.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Cargo crate metadata table.
 *
 * Stores Cargo-specific fields needed to serve the sparse index.
 * Each row corresponds to one published crate version.
 */
export const cargoMetadataTable = pgTable(
  "cargo_metadata",
  {
    id: generateDefaultId(),
    artifactId: uuid()
      .notNull()
      .references(() => artifactTable.id, { onDelete: "cascade" }),
    // Crate name (e.g. "beacon-gateway")
    name: text().notNull(),
    // Semver version string (e.g. "0.1.0")
    vers: text().notNull(),
    // Dependency array in Cargo index format
    deps: jsonb().notNull().default([]),
    // Feature map: feature name → enabled features
    features: jsonb().notNull().default({}),
    // SHA-256 hex digest of the .crate tarball
    cksum: text().notNull(),
    // Whether this version has been yanked
    yanked: boolean().notNull().default(false),
    // Native library linkage (Cargo `links` field)
    links: text(),
    // Minimum supported Rust version
    rustVersion: text(),
    // Index schema version
    v: integer().notNull().default(2),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.artifactId),
    uniqueIndex().on(table.name, table.vers),
  ],
);

export type InsertCargoMetadata = InferInsertModel<typeof cargoMetadataTable>;
export type SelectCargoMetadata = InferSelectModel<typeof cargoMetadataTable>;
