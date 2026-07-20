import { asc, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  scanResultTable,
} from "lib/db/schema";
import { scanImage, scanImageRef, scanningEnabled } from "lib/scan";

/** Poll interval when scanning is idle: 1 minute. */
const DEFAULT_INTERVAL_MS = 60_000;
/** Safety cap on drains per tick. */
const MAX_PER_TICK = 100;

const nowIso = () => new Date().toISOString();

/**
 * Atomically claim the next pending scan (`FOR UPDATE SKIP LOCKED`, so concurrent
 * workers/replicas never grab the same one), flipping it to `scanning`.
 */
const claimNext = async () =>
  dbPool.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: scanResultTable.id,
        digest: artifactTable.digest,
        repo: repositoryTable.name,
        namespace: namespaceTable.name,
      })
      .from(scanResultTable)
      .innerJoin(
        artifactTable,
        eq(scanResultTable.artifactId, artifactTable.id),
      )
      .innerJoin(
        repositoryTable,
        eq(artifactTable.repositoryId, repositoryTable.id),
      )
      .innerJoin(
        namespaceTable,
        eq(repositoryTable.namespaceId, namespaceTable.id),
      )
      .where(eq(scanResultTable.status, "pending"))
      .orderBy(asc(scanResultTable.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });
    if (!row) return null;
    await tx
      .update(scanResultTable)
      .set({ status: "scanning" })
      .where(eq(scanResultTable.id, row.id));
    return row;
  });

/** Process one pending scan. Returns whether anything was processed. */
const runScansOnce = async (): Promise<{ processed: boolean }> => {
  const job = await claimNext();
  if (!job) return { processed: false };

  try {
    const result = await scanImage(
      scanImageRef(job.namespace, job.repo, job.digest),
    );
    if (!result) {
      // Scanner unavailable (e.g. Trivy not installed) -> record as skipped.
      await dbPool
        .update(scanResultTable)
        .set({ status: "skipped", scannedAt: nowIso() })
        .where(eq(scanResultTable.id, job.id));
    } else {
      await dbPool
        .update(scanResultTable)
        .set({
          status: "completed",
          scanner: result.scanner,
          critical: result.counts.critical,
          high: result.counts.high,
          medium: result.counts.medium,
          low: result.counts.low,
          unknown: result.counts.unknown,
          findings: result.findings,
          scannedAt: nowIso(),
        })
        .where(eq(scanResultTable.id, job.id));
    }
  } catch (err) {
    await dbPool
      .update(scanResultTable)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        scannedAt: nowIso(),
      })
      .where(eq(scanResultTable.id, job.id));
  }
  return { processed: true };
};

/**
 * Start the background vulnerability-scan worker. A no-op each tick while
 * scanning is disabled (`SCAN_ENABLED`); otherwise drains the pending queue.
 */
export const startVulnerabilityScans = (
  intervalMs: number = DEFAULT_INTERVAL_MS,
): Timer => {
  const run = async () => {
    if (!scanningEnabled()) return;
    try {
      for (let i = 0; i < MAX_PER_TICK; i += 1) {
        const { processed } = await runScansOnce();
        if (!processed) break;
      }
    } catch (err) {
      console.error("[scan] worker error:", err);
    }
  };

  run();
  return setInterval(run, intervalMs);
};
