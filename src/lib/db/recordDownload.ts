import { eq, sql } from "drizzle-orm";

import { dbPool } from "lib/db";
import { repositoryTable } from "lib/db/schema";

/**
 * Increment a repository's total download counter. Fire-and-forget: the write is
 * not awaited and errors are swallowed, so it never adds latency to (or fails) a
 * download. Call once per install/pull -- manifest pulls for OCI, tarball/crate
 * downloads for npm/cargo (not per-blob, which would over-count an image pull).
 */
export const recordDownload = (repositoryId: string): void => {
  void dbPool
    .update(repositoryTable)
    .set({ downloadCount: sql`${repositoryTable.downloadCount} + 1` })
    .where(eq(repositoryTable.id, repositoryId))
    .catch(() => {});
};
