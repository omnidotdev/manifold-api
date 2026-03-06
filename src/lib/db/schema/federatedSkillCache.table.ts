import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { federatedSourceTable } from "lib/db/schema/federatedSource.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/** Vetting status for federated skills */
type VetStatus = "pending" | "approved" | "rejected" | "quarantined";

/**
 * Federated skill cache table.
 * Stores cached SKILL.md content fetched from upstream registries.
 */
export const federatedSkillCacheTable = pgTable(
  "federated_skill_cache",
  {
    id: generateDefaultId(),
    /** FK to federated source */
    sourceId: uuid()
      .notNull()
      .references(() => federatedSourceTable.id, { onDelete: "cascade" }),
    /** Skill slug (e.g. "gogcli") */
    slug: text().notNull(),
    /** Raw SKILL.md content */
    content: text(),
    /** SHA-256 digest of content for change detection */
    contentDigest: text(),
    fetchedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    expiresAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    /** Vetting status */
    vetStatus: text().$type<VetStatus>().notNull().default("pending"),
    /** Reason for vetting decision */
    vetReason: text(),
    /** Who approved/rejected (admin user ID or "auto") */
    vettedBy: text(),
    vettedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    /** Upstream metadata (downloads, stars, version, etc) */
    upstreamMeta: jsonb(),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.sourceId, table.slug),
    index().on(table.sourceId),
    index().on(table.slug),
    index().on(table.vetStatus),
    index().on(table.expiresAt),
  ],
);

export type InsertFederatedSkillCache = InferInsertModel<
  typeof federatedSkillCacheTable
>;
export type SelectFederatedSkillCache = InferSelectModel<
  typeof federatedSkillCacheTable
>;
export type { VetStatus };
