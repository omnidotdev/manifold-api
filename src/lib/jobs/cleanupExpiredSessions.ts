import { lt } from "drizzle-orm";

import { dbPool } from "lib/db";
import { uploadSessionTable } from "lib/db/schema";
import { cleanupSession } from "lib/oci/chunkStore";

/** Default cleanup interval: 1 hour */
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Delete expired upload sessions and their chunk files.
 * @returns Count of cleaned sessions
 */
const cleanupExpiredSessions = async (): Promise<number> => {
  const now = new Date().toISOString();

  // Find all expired sessions
  const expired = await dbPool
    .select({ id: uploadSessionTable.id })
    .from(uploadSessionTable)
    .where(lt(uploadSessionTable.expiresAt, now));

  if (expired.length === 0) return 0;

  // Clean up chunk files for each expired session
  await Promise.all(expired.map(({ id }) => cleanupSession(id)));

  // Delete expired rows from the database
  await dbPool
    .delete(uploadSessionTable)
    .where(lt(uploadSessionTable.expiresAt, now));

  return expired.length;
};

/**
 * Start periodic cleanup of expired upload sessions.
 * @param intervalMs - Cleanup interval (default: 1 hour)
 * @returns Timer reference for stopping
 */
const startSessionCleanup = (
  intervalMs: number = DEFAULT_INTERVAL_MS,
): Timer => {
  const run = async () => {
    try {
      const count = await cleanupExpiredSessions();

      if (count > 0) {
        // biome-ignore lint/suspicious/noConsole: background job logging
        console.log(`[cleanup] Removed ${count} expired upload session(s)`);
      }
    } catch (err) {
      console.error("[cleanup] Failed to clean expired sessions:", err);
    }
  };

  // Run once immediately on startup
  run();

  // Then run on the specified interval
  return setInterval(run, intervalMs);
};

export { cleanupExpiredSessions, startSessionCleanup };
