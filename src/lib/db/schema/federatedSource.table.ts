import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Federated source table.
 * Stores upstream registry config for federated namespaces (e.g. ClawHub).
 */
export const federatedSourceTable = pgTable(
  "federated_source",
  {
    id: generateDefaultId(),
    /** Unique namespace prefix (e.g. "clawhub") */
    namespace: text().notNull().unique(),
    /** Upstream API base URL */
    upstreamBaseUrl: text().notNull(),
    /** Upstream registry type (extensible for future upstreams) */
    upstreamType: text().notNull(),
    enabled: boolean().notNull().default(true),
    /** Requests per minute limit for upstream calls */
    rateLimitRpm: integer().notNull().default(100),
    /** Cache TTL for individual skill content (seconds) */
    cacheTtlSeconds: integer().notNull().default(3600),
    /** Cache TTL for tag/skill list responses (seconds) */
    tagListCacheTtlSeconds: integer().notNull().default(600),
    /** Whether skills need manual approval before serving */
    requireVetting: boolean().notNull().default(true),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.namespace),
    index().on(table.upstreamType),
  ],
);

export type InsertFederatedSource = InferInsertModel<
  typeof federatedSourceTable
>;
export type SelectFederatedSource = InferSelectModel<
  typeof federatedSourceTable
>;
