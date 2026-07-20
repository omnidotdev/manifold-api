import { and, inArray, isNotNull } from "drizzle-orm";

import { dbPool } from "lib/db";
import { artifactTable, tagTable } from "lib/db/schema";
import { storage } from "lib/storage";

/** Default GC interval: 6 hours */
const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Grace window: never collect an artifact younger than this. A `docker push`
 * uploads layer blobs (each becomes an artifact row) BEFORE it PUTs the manifest
 * that references them, so a freshly-uploaded, not-yet-referenced blob looks like
 * an orphan. Without a grace window, GC firing mid-push deletes those layers --
 * silent data loss. 6h comfortably exceeds any realistic single push while still
 * reclaiming genuinely-abandoned uploads on the next cycle.
 */
const GC_GRACE_MS = 6 * 60 * 60 * 1000;

/**
 * Extract all digests referenced by an OCI manifest or index.
 *
 * Handles OCI Image Manifest (config + layers), OCI Index / Docker
 * Manifest List (manifests[]), and Docker V2 manifests.
 */
const extractReferencedDigests = (content: string): string[] => {
  const digests: string[] = [];

  try {
    const manifest = JSON.parse(content);

    // OCI Image Manifest / Docker V2: config + layers
    if (manifest.config?.digest) {
      digests.push(manifest.config.digest);
    }

    if (Array.isArray(manifest.layers)) {
      for (const layer of manifest.layers) {
        if (layer.digest) digests.push(layer.digest);
      }
    }

    // OCI Index / Docker Manifest List: manifests[]
    if (Array.isArray(manifest.manifests)) {
      for (const m of manifest.manifests) {
        if (m.digest) digests.push(m.digest);
      }
    }
  } catch {
    // Not valid JSON (e.g. non-container artifact), skip
  }

  return digests;
};

/**
 * Select artifacts safe to collect: digest not reachable from any tag AND older
 * than the grace window (a known, non-null age past `cutoffMs`). Pure so the
 * data-loss-critical grace behaviour is unit-testable without a database.
 */
export const selectOrphans = <
  T extends { digest: string; createdAt: string | null },
>(
  artifacts: T[],
  liveDigests: Set<string>,
  cutoffMs: number,
): T[] =>
  artifacts.filter(
    (a) =>
      !liveDigests.has(a.digest) &&
      a.createdAt !== null &&
      new Date(a.createdAt).getTime() < cutoffMs,
  );

/**
 * Mark-and-sweep garbage collection for orphaned blobs.
 *
 * Walks all tagged artifacts, parses manifests to find referenced
 * layer/config digests, then deletes any artifact (and its blob)
 * not reachable from a tag.
 *
 * @returns Count of deleted artifacts and bytes freed
 */
const gcOrphanedBlobs = async (): Promise<{
  deleted: number;
  freedBytes: number;
}> => {
  // Step 1: Collect all artifact IDs that have at least one tag
  const taggedRows = await dbPool
    .select({ artifactId: tagTable.artifactId })
    .from(tagTable);

  const taggedIds = new Set(taggedRows.map((r) => r.artifactId));

  if (taggedIds.size === 0) return { deleted: 0, freedBytes: 0 };

  // Step 2: Load tagged artifacts (these are typically manifests with inline content)
  const taggedArtifacts = await dbPool
    .select({
      id: artifactTable.id,
      digest: artifactTable.digest,
      content: artifactTable.content,
    })
    .from(artifactTable)
    .where(inArray(artifactTable.id, [...taggedIds]));

  // Step 3: Build the live set by walking manifest references
  const liveDigests = new Set<string>();

  // Seed with all tagged artifact digests
  for (const a of taggedArtifacts) {
    liveDigests.add(a.digest);
  }

  // First pass: extract digests from tagged manifests (indexes + image manifests)
  const pendingDigests = new Set<string>();

  for (const a of taggedArtifacts) {
    if (a.content) {
      for (const d of extractReferencedDigests(a.content)) {
        liveDigests.add(d);
        pendingDigests.add(d);
      }
    }
  }

  // Second pass: resolve OCI index -> platform manifest -> layers
  // (indexes reference manifests by digest; those manifests reference layers)
  if (pendingDigests.size > 0) {
    const referencedManifests = await dbPool
      .select({
        digest: artifactTable.digest,
        content: artifactTable.content,
      })
      .from(artifactTable)
      .where(
        and(
          inArray(artifactTable.digest, [...pendingDigests]),
          isNotNull(artifactTable.content),
        ),
      );

    for (const m of referencedManifests) {
      for (const d of extractReferencedDigests(m.content!)) {
        liveDigests.add(d);
      }
    }
  }

  // Step 4: Find orphaned artifacts (digest not in live set, has blob on disk).
  // Skip anything younger than the grace window so an in-flight push's layers
  // (uploaded before their manifest) are never collected.
  const allArtifacts = await dbPool
    .select({
      id: artifactTable.id,
      digest: artifactTable.digest,
      storagePath: artifactTable.storagePath,
      size: artifactTable.size,
      createdAt: artifactTable.createdAt,
    })
    .from(artifactTable);

  const orphans = selectOrphans(
    allArtifacts,
    liveDigests,
    Date.now() - GC_GRACE_MS,
  );

  if (orphans.length === 0) return { deleted: 0, freedBytes: 0 };

  // Step 5: Delete orphans (blobs from storage, then rows from DB)
  let freedBytes = 0;

  // Collect unique digests that have storage blobs to delete
  const blobDigestsToDelete = new Set<string>();

  for (const orphan of orphans) {
    if (orphan.storagePath) {
      blobDigestsToDelete.add(orphan.digest);
      freedBytes += orphan.size;
    }
  }

  // Delete blobs from storage
  for (const digest of blobDigestsToDelete) {
    await storage.delete(digest);
  }

  // Batch delete artifact rows
  const orphanIds = orphans.map((o) => o.id);

  // Delete in chunks to avoid oversized queries
  const CHUNK_SIZE = 500;

  for (let i = 0; i < orphanIds.length; i += CHUNK_SIZE) {
    const chunk = orphanIds.slice(i, i + CHUNK_SIZE);

    await dbPool.delete(artifactTable).where(inArray(artifactTable.id, chunk));
  }

  return { deleted: orphans.length, freedBytes };
};

/**
 * Start periodic garbage collection of orphaned blobs.
 * @param intervalMs - GC interval (default: 6 hours)
 * @returns Timer reference for stopping
 */
const startBlobGc = (intervalMs: number = DEFAULT_INTERVAL_MS): Timer => {
  const run = async () => {
    try {
      const { deleted, freedBytes } = await gcOrphanedBlobs();

      if (deleted > 0) {
        const freedMb = (freedBytes / 1024 / 1024).toFixed(1);

        // biome-ignore lint/suspicious/noConsole: background job logging
        console.log(
          `[gc] Removed ${deleted} orphaned artifact(s), freed ${freedMb} MB`,
        );
      }
    } catch (err) {
      console.error("[gc] Failed to collect orphaned blobs:", err);
    }
  };

  // Run once immediately on startup
  run();

  // Then run on the specified interval
  return setInterval(run, intervalMs);
};

export { startBlobGc };
