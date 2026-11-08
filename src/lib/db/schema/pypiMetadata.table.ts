import {
  boolean,
  index,
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
 * PyPI distribution file metadata.
 *
 * Unlike cargo/npm, a single Python release version has MANY files (an sdist
 * plus one or more wheels), so each uploaded file is its own artifact and its
 * own row here. pip resolves which file to install from the Simple index file
 * list, so there is no per-version tag row.
 */
export const pypiMetadataTable = pgTable(
  "pypi_metadata",
  {
    id: generateDefaultId(),
    artifactId: uuid()
      .notNull()
      .references(() => artifactTable.id, { onDelete: "cascade" }),
    // PEP 503 normalized project name (e.g. "odk-pdk")
    name: text().notNull(),
    // PEP 440 version string (e.g. "0.1.0")
    version: text().notNull(),
    // Distribution filename (e.g. "odk_pdk-0.1.0-py3-none-any.whl")
    filename: text().notNull(),
    // "sdist" or "bdist_wheel"
    filetype: text().notNull(),
    // Python version tag from the upload (e.g. "py3", "source")
    pythonVersion: text(),
    // Requires-Python metadata (e.g. ">=3.9")
    requiresPython: text(),
    // Requires-Dist entries (dependency specifiers)
    requiresDist: jsonb().notNull().default([]),
    // Core metadata version (e.g. "2.1")
    metadataVersion: text(),
    // Summary line from the distribution metadata
    summary: text(),
    // SHA-256 hex digest of the distribution file
    sha256: text().notNull(),
    // BLAKE2b-256 hex digest, when provided by the uploader
    blake2_256: text(),
    // PEP 592 yank flag
    yanked: boolean().notNull().default(false),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.artifactId),
    // Distribution filenames are unique within a project
    uniqueIndex().on(table.name, table.filename),
    index().on(table.name),
  ],
);

export type InsertPypiMetadata = InferInsertModel<typeof pypiMetadataTable>;
export type SelectPypiMetadata = InferSelectModel<typeof pypiMetadataTable>;
