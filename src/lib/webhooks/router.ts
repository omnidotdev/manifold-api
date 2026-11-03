import { randomBytes } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import {
  authenticateRegistryToken,
  requireRegistryWrite,
} from "lib/auth/registryToken";
import { enforceWebhookLimit } from "lib/billing";
import { dbPool } from "lib/db";
import { namespaceTable, webhookTable } from "lib/db/schema";

const webhookError = (message: string) => ({ errors: [{ message }] });

/** Resolve the token's namespace, confirm it matches the URL, return its org. */
const resolveOrg = async (
  authHeader: string | null,
  namespace: string,
  write: boolean,
): Promise<
  | { ok: true; organizationId: string; namespaceId: string }
  | { ok: false; status: number; message: string }
> => {
  const auth = write
    ? await requireRegistryWrite(authHeader).catch(() => null)
    : await authenticateRegistryToken(authHeader);
  if (!auth) {
    return { ok: false, status: 403, message: "authentication required" };
  }

  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);
  if (!ns || ns.name !== namespace) {
    return {
      ok: false,
      status: 403,
      message: "token not authorized for this namespace",
    };
  }
  if (!ns.organizationId) {
    return {
      ok: false,
      status: 400,
      message: "namespace has no organization",
    };
  }
  return { ok: true, organizationId: ns.organizationId, namespaceId: ns.id };
};

const isValidUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Outbound webhook management router.
 *
 * Mounted at `/webhook/:namespace`:
 * - POST   /  create a webhook (returns the signing secret once)
 * - GET    /  list the org's webhooks (secret omitted)
 * - DELETE /:id  remove a webhook
 *
 * All routes are scoped to the caller's organization via the token's namespace;
 * the table is omitted from GraphQL so this is the only access path.
 */
const webhooksRouter = new Elysia({ prefix: "/webhook/:namespace" })
  .get(
    "/",
    async ({ params, request, set }) => {
      const resolved = await resolveOrg(
        request.headers.get("Authorization"),
        params.namespace,
        false,
      );
      if (!resolved.ok) {
        set.status = resolved.status;
        return webhookError(resolved.message);
      }
      const rows = await dbPool
        .select({
          id: webhookTable.id,
          url: webhookTable.url,
          events: webhookTable.events,
          isActive: webhookTable.isActive,
          createdAt: webhookTable.createdAt,
        })
        .from(webhookTable)
        .where(eq(webhookTable.organizationId, resolved.organizationId))
        .orderBy(desc(webhookTable.createdAt));
      return { webhooks: rows };
    },
    { params: t.Object({ namespace: t.String() }) },
  )
  .post(
    "/",
    async ({ params, request, set }) => {
      const resolved = await resolveOrg(
        request.headers.get("Authorization"),
        params.namespace,
        true,
      );
      if (!resolved.ok) {
        set.status = resolved.status;
        return webhookError(resolved.message);
      }

      let payload: { url?: unknown; events?: unknown };
      try {
        payload = (await request.json()) as typeof payload;
      } catch {
        set.status = 400;
        return webhookError("invalid JSON body");
      }

      if (typeof payload.url !== "string" || !isValidUrl(payload.url)) {
        set.status = 400;
        return webhookError("a valid http(s) url is required");
      }

      const events =
        Array.isArray(payload.events) &&
        payload.events.every((e) => typeof e === "string")
          ? (payload.events as string[])
          : ["*"];

      // Enforce the org's webhook cap before creating a new one
      const limitError = await enforceWebhookLimit(resolved.organizationId);
      if (limitError) {
        set.status = limitError.status;
        return limitError.body;
      }

      const secret = `whsec_${randomBytes(24).toString("hex")}`;

      const [row] = await dbPool
        .insert(webhookTable)
        .values({
          organizationId: resolved.organizationId,
          namespaceId: resolved.namespaceId,
          url: payload.url,
          secret,
          events,
        })
        .returning();

      set.status = 201;
      // The secret is returned ONCE here and never again
      return {
        id: row.id,
        url: row.url,
        events: row.events,
        isActive: row.isActive,
        secret,
      };
    },
    { params: t.Object({ namespace: t.String() }) },
  )
  .delete(
    "/:id",
    async ({ params, request, set }) => {
      const resolved = await resolveOrg(
        request.headers.get("Authorization"),
        params.namespace,
        true,
      );
      if (!resolved.ok) {
        set.status = resolved.status;
        return webhookError(resolved.message);
      }
      const deleted = await dbPool
        .delete(webhookTable)
        .where(
          and(
            eq(webhookTable.id, params.id),
            eq(webhookTable.organizationId, resolved.organizationId),
          ),
        )
        .returning({ id: webhookTable.id });
      if (deleted.length === 0) {
        set.status = 404;
        return webhookError("webhook not found");
      }
      return { deleted: true };
    },
    { params: t.Object({ namespace: t.String(), id: t.String() }) },
  );

export default webhooksRouter;
