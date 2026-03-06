/**
 * Background sync job for federated sources.
 * Pre-populates cache with popular skills from upstream registries.
 * Follows the cleanupExpiredSessions pattern.
 */

import { eq } from "drizzle-orm";

import {
  FEDERATION_ENABLED,
  FEDERATION_SYNC_INTERVAL_MS,
} from "lib/config/env.config";
import { dbPool } from "lib/db";
import { federatedSourceTable } from "lib/db/schema";
import { listSkills } from "lib/federation/clawhubClient";
import { fetchAndCache } from "lib/federation/proxy";

/** Default sync interval: 6 hours */
const DEFAULT_INTERVAL_MS = Number(FEDERATION_SYNC_INTERVAL_MS) || 21_600_000;

/** Max skills to sync per source per run */
const MAX_SKILLS_PER_SYNC = 500;

/**
 * Sync popular skills from all enabled federated sources.
 * @returns Count of skills synced
 */
const syncFederatedSources = async (): Promise<number> => {
  if (FEDERATION_ENABLED !== "true") return 0;

  const sources = await dbPool
    .select()
    .from(federatedSourceTable)
    .where(eq(federatedSourceTable.enabled, true));

  if (sources.length === 0) return 0;

  let totalSynced = 0;

  for (const source of sources) {
    try {
      // Fetch top skills by downloads
      const skills = await listSkills(
        source.upstreamBaseUrl,
        source.id,
        source.rateLimitRpm,
        { limit: MAX_SKILLS_PER_SYNC, sort: "downloads" },
      );

      let sourceSynced = 0;

      for (const skill of skills) {
        try {
          await fetchAndCache(
            source.id,
            source.upstreamBaseUrl,
            source.rateLimitRpm,
            skill.slug,
            source.cacheTtlSeconds,
            source.requireVetting,
          );
          sourceSynced++;
        } catch (err) {
          console.error(
            `[federation-sync] Failed to cache skill "${skill.slug}" from ${source.namespace}:`,
            err,
          );
        }
      }

      // biome-ignore lint/suspicious/noConsole: background job logging
      console.log(
        `[federation-sync] Synced ${sourceSynced}/${skills.length} skills from ${source.namespace}`,
      );
      totalSynced += sourceSynced;
    } catch (err) {
      console.error(
        `[federation-sync] Failed to sync source ${source.namespace}:`,
        err,
      );
    }
  }

  return totalSynced;
};

/**
 * Start periodic federation sync.
 * @param intervalMs - Sync interval (default: 6 hours)
 * @returns Timer reference for stopping
 */
const startFederationSync = (
  intervalMs: number = DEFAULT_INTERVAL_MS,
): Timer => {
  const run = async () => {
    try {
      const count = await syncFederatedSources();

      if (count > 0) {
        // biome-ignore lint/suspicious/noConsole: background job logging
        console.log(`[federation-sync] Completed: ${count} skill(s) synced`);
      }
    } catch (err) {
      console.error("[federation-sync] Sync run failed:", err);
    }
  };

  // Run once immediately on startup
  run();

  // Then run on the specified interval
  return setInterval(run, intervalMs);
};

export { startFederationSync, syncFederatedSources };
