import { desc, eq, inArray, sql } from "drizzle-orm";

import { tagRetentionCount } from "lib/config/env.config";
import { dbPool } from "lib/db";
import { tagTable } from "lib/db/schema";

/** Default prune interval: 6 hours */
const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Enforce tag retention policy by pruning the oldest tags beyond
 * the configured limit per repository.
 *
 * The orphaned artifacts left behind are cleaned up by the
 * separate blob GC job.
 *
 * @returns Count of pruned tags
 */
const pruneOldTags = async (): Promise<number> => {
  if (tagRetentionCount <= 0) return 0;

  // Find repositories that exceed the tag limit
  const overLimitRepos = await dbPool
    .select({
      repositoryId: tagTable.repositoryId,
      tagCount: sql<number>`count(*)::int`.as("tag_count"),
    })
    .from(tagTable)
    .groupBy(tagTable.repositoryId)
    .having(sql`count(*) > ${tagRetentionCount}`);

  if (overLimitRepos.length === 0) return 0;

  let totalPruned = 0;

  for (const { repositoryId, tagCount } of overLimitRepos) {
    const excess = tagCount - tagRetentionCount;

    // Find the oldest tags beyond the retention limit
    // Keep: the N most recently updated tags
    // Prune: everything else
    const tagsToDelete = await dbPool
      .select({ id: tagTable.id })
      .from(tagTable)
      .where(eq(tagTable.repositoryId, repositoryId))
      .orderBy(desc(tagTable.updatedAt))
      .offset(tagRetentionCount)
      .limit(excess);

    if (tagsToDelete.length === 0) continue;

    const ids = tagsToDelete.map((t) => t.id);

    await dbPool.delete(tagTable).where(inArray(tagTable.id, ids));

    totalPruned += ids.length;
  }

  return totalPruned;
};

/**
 * Start periodic tag retention enforcement.
 * @param intervalMs - Prune interval (default: 6 hours)
 * @returns Timer reference for stopping
 */
const startTagRetention = (intervalMs: number = DEFAULT_INTERVAL_MS): Timer => {
  const run = async () => {
    try {
      const pruned = await pruneOldTags();

      if (pruned > 0) {
        // biome-ignore lint/suspicious/noConsole: background job logging
        console.log(`[retention] Pruned ${pruned} old tag(s)`);
      }
    } catch (err) {
      console.error("[retention] Failed to prune old tags:", err);
    }
  };

  // Run once immediately on startup
  run();

  // Then run on the specified interval
  return setInterval(run, intervalMs);
};

export { startTagRetention };
