/**
 * Admin federation router.
 * CRUD for federated sources and cache management.
 * Mounted at /admin/federation.
 */

import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db";
import { federatedSkillCacheTable, federatedSourceTable } from "lib/db/schema";
import { syncFederatedSources } from "lib/federation/sync";

import type { VetStatus } from "lib/db/schema/federatedSkillCache.table";

/**
 * Extract bearer token from Authorization header.
 */
const extractBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
};

/**
 * Admin federation router.
 */
const federationRouter = new Elysia({ prefix: "/admin/federation" })
  // Require JWT auth on all federation admin routes
  .onBeforeHandle(({ headers, set }) => {
    const token = extractBearerToken(headers.authorization ?? null);

    if (!token || token.startsWith("mf_")) {
      set.status = 401;
      return { error: "Admin authentication required" };
    }
  })

  // List all federated sources
  .get("/sources", async () => {
    const sources = await dbPool.select().from(federatedSourceTable);
    return { sources };
  })

  // Create a federated source
  .post(
    "/sources",
    async ({ body, set }) => {
      const [source] = await dbPool
        .insert(federatedSourceTable)
        .values(body)
        .returning();

      set.status = 201;
      return { source };
    },
    {
      body: t.Object({
        namespace: t.String({ minLength: 1, maxLength: 255 }),
        upstreamBaseUrl: t.String(),
        upstreamType: t.String(),
        enabled: t.Optional(t.Boolean()),
        rateLimitRpm: t.Optional(t.Number()),
        cacheTtlSeconds: t.Optional(t.Number()),
        tagListCacheTtlSeconds: t.Optional(t.Number()),
        requireVetting: t.Optional(t.Boolean()),
      }),
    },
  )

  // Update a federated source
  .patch(
    "/sources/:id",
    async ({ params, body, set }) => {
      const [source] = await dbPool
        .update(federatedSourceTable)
        .set({ ...body, updatedAt: new Date().toISOString() })
        .where(eq(federatedSourceTable.id, params.id))
        .returning();

      if (!source) {
        set.status = 404;
        return { error: "Federated source not found" };
      }

      return { source };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        upstreamBaseUrl: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        rateLimitRpm: t.Optional(t.Number()),
        cacheTtlSeconds: t.Optional(t.Number()),
        tagListCacheTtlSeconds: t.Optional(t.Number()),
        requireVetting: t.Optional(t.Boolean()),
      }),
    },
  )

  // Delete a federated source
  .delete(
    "/sources/:id",
    async ({ params, set }) => {
      const [deleted] = await dbPool
        .delete(federatedSourceTable)
        .where(eq(federatedSourceTable.id, params.id))
        .returning({ id: federatedSourceTable.id });

      if (!deleted) {
        set.status = 404;
        return { error: "Federated source not found" };
      }

      return { message: "Federated source deleted" };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    },
  )

  // List cached skills (with optional filters)
  .get(
    "/cache",
    async ({ query }) => {
      const conditions = [];

      if (query.sourceId) {
        conditions.push(eq(federatedSkillCacheTable.sourceId, query.sourceId));
      }
      if (query.vetStatus) {
        conditions.push(
          eq(federatedSkillCacheTable.vetStatus, query.vetStatus as VetStatus),
        );
      }

      const skills =
        conditions.length > 0
          ? await dbPool
              .select()
              .from(federatedSkillCacheTable)
              .where(and(...conditions))
              .orderBy(federatedSkillCacheTable.slug)
          : await dbPool
              .select()
              .from(federatedSkillCacheTable)
              .orderBy(federatedSkillCacheTable.slug);

      return { skills, count: skills.length };
    },
    {
      query: t.Object({
        sourceId: t.Optional(t.String({ format: "uuid" })),
        vetStatus: t.Optional(t.String()),
      }),
    },
  )

  // Manually approve/reject a cached skill
  .patch(
    "/cache/:id/vet",
    async ({ params, body, set }) => {
      const [updated] = await dbPool
        .update(federatedSkillCacheTable)
        .set({
          vetStatus: body.vetStatus as VetStatus,
          vetReason: body.reason ?? null,
          vettedBy: "admin",
          vettedAt: new Date().toISOString(),
        })
        .where(eq(federatedSkillCacheTable.id, params.id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Cached skill not found" };
      }

      return { skill: updated };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        vetStatus: t.String(),
        reason: t.Optional(t.String()),
      }),
    },
  )

  // Trigger a manual sync
  .post("/sync", async () => {
    const count = await syncFederatedSources();
    return { message: `Sync completed: ${count} skill(s) synced` };
  });

export default federationRouter;
