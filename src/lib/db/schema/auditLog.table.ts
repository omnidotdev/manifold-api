import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Audit log table.
 *
 * A persisted, append-only trail of security/compliance-relevant actions
 * (registry publishes, token use, mutations). Written best-effort by
 * logAuditEvent and never mutated. Deliberately kept OUT of the GraphQL schema
 * (see OmitInternalTablesPlugin) so it is never exposed unscoped; any
 * user-facing query must go through an explicitly org-scoped path.
 *
 * organizationId/userId are stored as text (not uuid FKs) so a malformed or
 * non-uuid actor value can never make an audit write throw.
 */
export const auditLogTable = pgTable(
  "audit_log",
  {
    id: generateDefaultId(),
    organizationId: text("organization_id"),
    userId: text("user_id"),
    action: text().notNull(),
    resource: text().notNull(),
    resourceId: text("resource_id"),
    details: jsonb(),
    requestId: text("request_id"),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    index("audit_log_organization_id_index").on(table.organizationId),
    index("audit_log_created_at_index").on(table.createdAt),
  ],
);

export type InsertAuditLog = InferInsertModel<typeof auditLogTable>;
export type SelectAuditLog = InferSelectModel<typeof auditLogTable>;
