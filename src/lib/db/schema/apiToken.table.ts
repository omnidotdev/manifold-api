import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { namespaceTable } from "lib/db/schema/namespace.table";
import { repositoryTable } from "lib/db/schema/repository.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * API token table for service account authentication.
 *
 * Tokens are scoped to a namespace or specific repository with read/write/admin permissions.
 */
export const apiTokenTable = pgTable(
  "api_token",
  {
    id: generateDefaultId(),
    // human-readable name for the token
    name: text().notNull(),
    // SHA-256 hash of the token (never store plaintext)
    tokenHash: text().notNull(),
    // first 11 chars of token for identification (mf_ + 8)
    tokenPrefix: text().notNull(),
    // namespace scope
    namespaceId: uuid()
      .notNull()
      .references(() => namespaceTable.id, { onDelete: "cascade" }),
    // optional repository scope (null = all repos in namespace)
    repositoryId: uuid().references(() => repositoryTable.id, {
      onDelete: "cascade",
    }),
    // permission level: read, write, admin
    scope: text().notNull().default("read"),
    // user who created this token (OIDC sub claim)
    createdBy: text().notNull(),
    // optional description
    description: text(),
    // soft revocation flag
    isActive: boolean().notNull().default(true),
    // optional expiration
    expiresAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    // last usage timestamp
    lastUsedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.tokenHash),
    index().on(table.tokenPrefix),
    index().on(table.namespaceId),
    index().on(table.repositoryId),
    index().on(table.createdBy),
    index().on(table.isActive),
  ],
);

export type InsertApiToken = InferInsertModel<typeof apiTokenTable>;
export type SelectApiToken = InferSelectModel<typeof apiTokenTable>;

/**
 * Valid token scope values.
 */
export type TokenScope = "read" | "write" | "admin";

/**
 * Check if a string is a valid token scope.
 */
export const isValidScope = (scope: string): scope is TokenScope =>
  ["read", "write", "admin"].includes(scope);
