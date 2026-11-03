import { dbPool } from "lib/db";
import { auditLogTable } from "lib/db/schema";

interface TenantContext {
  organizationId?: string;
  workspaceId?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Log an audit event for compliance tracking.
 */
const logAuditEvent = (
  context: TenantContext,
  evt: {
    action: string;
    resource: string;
    resourceId: string;
    details?: Record<string, unknown>;
  },
): Promise<void> => {
  const entry = {
    level: "audit",
    timestamp: new Date().toISOString(),
    tenant: {
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      userId: context.userId,
    },
    requestId: context.requestId,
    action: evt.action,
    resource: evt.resource,
    resourceId: evt.resourceId,
    details: evt.details,
  };

  // biome-ignore lint/suspicious/noConsole: audit log output
  console.log(JSON.stringify(entry));

  // Persist best-effort: an audit write must never break or slow the action it
  // records, so callers do not await this and it swallows its own errors. The
  // promise is returned so tests (and any caller that wants to) can await it.
  return dbPool
    .insert(auditLogTable)
    .values({
      organizationId: context.organizationId ?? null,
      userId: context.userId ?? null,
      action: evt.action,
      resource: evt.resource,
      resourceId: evt.resourceId,
      details: evt.details ?? null,
      requestId: context.requestId ?? null,
    })
    .then(() => {})
    .catch(() => {});
};

export default logAuditEvent;
