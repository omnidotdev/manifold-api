import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { namespaceTable } from "lib/db/schema/namespace.table";
import { oidcIssuerTable } from "lib/db/schema/oidcIssuer.table";
import { repositoryTable } from "lib/db/schema/repository.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Trusted publisher bindings.
 *
 * A binding says: a token from `issuer` whose `subject` (and any
 * `claimConstraints`) match may mint an ephemeral `mf_` token scoped to this
 * namespace (optionally a single repository) with this permission. This is the
 * OIDC-native equivalent of a stored publish secret, with no secret to leak.
 */
export const trustedPublisherTable = pgTable(
  "trusted_publisher",
  {
    id: generateDefaultId(),
    // namespace this binding grants publish access to
    namespaceId: uuid()
      .notNull()
      .references(() => namespaceTable.id, { onDelete: "cascade" }),
    // optional repository scope (null = all repos in the namespace)
    repositoryId: uuid().references(() => repositoryTable.id, {
      onDelete: "cascade",
    }),
    // issuer whose tokens this binding trusts
    issuerId: uuid()
      .notNull()
      .references(() => oidcIssuerTable.id, { onDelete: "cascade" }),
    // expected `sub` claim (exact match), e.g.
    // "system:serviceaccount:herald-ci:herald-sdk-publisher"
    subject: text().notNull(),
    // additional required claims, matched by equality (e.g. ref, workflow); an
    // empty object means "subject + issuer are sufficient"
    claimConstraints: jsonb().notNull().default({}),
    // permission granted to minted tokens: read, write, admin
    scope: text().notNull().default("write"),
    // soft revocation flag
    isActive: boolean().notNull().default(true),
    // user (OIDC sub) who registered the binding
    createdBy: text().notNull(),
    // last time a token was minted through this binding
    lastUsedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    index().on(table.namespaceId),
    index().on(table.issuerId),
    index().on(table.subject),
    index().on(table.isActive),
  ],
);

export type InsertTrustedPublisher = InferInsertModel<
  typeof trustedPublisherTable
>;
export type SelectTrustedPublisher = InferSelectModel<
  typeof trustedPublisherTable
>;
