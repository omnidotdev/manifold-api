import { boolean, index, jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Outbound webhook subscription.
 *
 * A user-registered HTTP endpoint that receives signed POSTs when matching
 * events occur in the owning organization. Keyed on organizationId (text, not
 * a uuid FK) so dispatch can fan out straight from an event's organizationId.
 *
 * Like the audit log, this is kept OUT of the GraphQL schema (see
 * OmitInternalTablesPlugin) and managed only through the explicitly org-scoped
 * REST router, so it can never be read or written across tenants.
 */
export const webhookTable = pgTable(
  "webhook",
  {
    id: generateDefaultId(),
    organizationId: text("organization_id").notNull(),
    // The namespace the webhook was created under (for display)
    namespaceId: text("namespace_id"),
    url: text().notNull(),
    // HMAC-SHA256 signing secret, returned once at creation
    secret: text().notNull(),
    // Event types to deliver; ["*"] delivers everything
    events: jsonb().notNull().default(["*"]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [index("webhook_organization_id_index").on(table.organizationId)],
);

export type InsertWebhook = InferInsertModel<typeof webhookTable>;
export type SelectWebhook = InferSelectModel<typeof webhookTable>;
