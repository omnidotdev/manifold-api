import { desc, eq, inArray, sql } from "drizzle-orm";

import { tagRetentionCount } from "lib/config/env.config";
import { dbPool } from "lib/db";
import { artifactTable, tagTable } from "lib/db/schema";
import { getDeployedDigests } from "./deployedDigests";

/** Default prune interval: 6 hours */
const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Enforce tag retention policy by pruning the oldest tags beyond
 * the configured limit per repository.
 *
 * Tags whose image is currently deployed (or a rollback candidate) in the
 * Fractal fleet are never pruned, so a running service or its rollback target
 * can never lose its image to retention. The orphaned artifacts left behind are
 * cleaned up by the separate blob GC job.
 *
 * @returns Count of pruned tags
 */
const pruneOldTags = async (): Promise<number> => {
  if (tagRetentionCount <= 0) return 0;

  // Never prune a tag whose image is in use by the fleet. Fail SAFE: if the
  // deployed-digest set can't be resolved (no in-cluster creds, RBAC denied,
  // API error), skip pruning this cycle rather than risk deleting a live image.
  const protectedDigests = await getDeployedDigests();
  if (protectedDigests === null) {
    console.warn(
      "[retention] could not resolve deployed image digests; skipping prune this cycle",
    );
    return 0;
  }

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

  for (const { repositoryId } of overLimitRepos) {
    // Candidate tags: everything beyond the newest N (by updatedAt), joined to
    // their artifact digest so in-use images can be filtered out. Keep the N
    // most recent AND any in-use image regardless of age.
    const candidates = await dbPool
      .select({ id: tagTable.id, digest: artifactTable.digest })
      .from(tagTable)
      .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
      .where(eq(tagTable.repositoryId, repositoryId))
      .orderBy(desc(tagTable.updatedAt))
      .offset(tagRetentionCount);

    const ids = candidates
      .filter((candidate) => !protectedDigests.has(candidate.digest))
      .map((candidate) => candidate.id);

    if (ids.length === 0) continue;

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
