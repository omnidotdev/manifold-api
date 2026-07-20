import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { artifactTable } from "lib/db/schema/artifact.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Vulnerability scan result for a container image manifest.
 *
 * One row per scanned artifact. A manifest push enqueues a `pending` row; the
 * scan worker claims it, runs the configured scanner (e.g. Trivy) against the
 * image, and records the per-severity counts + the full findings report.
 */
export const scanResultTable = pgTable(
  "scan_result",
  {
    id: generateDefaultId(),
    artifactId: uuid()
      .notNull()
      .references(() => artifactTable.id, { onDelete: "cascade" }),
    // pending | scanning | completed | failed | skipped
    status: text().notNull().default("pending"),
    // Scanner that produced the result (e.g. "trivy"), null until scanned.
    scanner: text(),
    critical: integer().notNull().default(0),
    high: integer().notNull().default(0),
    medium: integer().notNull().default(0),
    low: integer().notNull().default(0),
    unknown: integer().notNull().default(0),
    // Full scanner report (vulnerability list); null until scanned.
    findings: jsonb(),
    // Failure detail when status = failed.
    error: text(),
    createdAt: generateDefaultDate(),
    // Set when a scan finishes (completed/failed/skipped).
    scannedAt: timestamp({ precision: 6, mode: "string", withTimezone: true }),
  },
  (table) => [
    uniqueIndex().on(table.id),
    // One scan result per artifact.
    uniqueIndex().on(table.artifactId),
    // The worker polls by status.
    index().on(table.status),
  ],
);

export type InsertScanResult = InferInsertModel<typeof scanResultTable>;
export type SelectScanResult = InferSelectModel<typeof scanResultTable>;
