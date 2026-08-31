/**
 * Storage metering for the OCI registry.
 *
 * The `storage_bytes` meter must reflect the bytes an org actually STORES, not
 * the bytes it has ever pushed. Blob (and manifest) content is content-addressed
 * and de-duplicated by digest, so:
 *
 * - A re-push of the same image (same digest, same repo) stores nothing new: the
 *   artifact row is a no-op `onConflictDoNothing`, so it must not be metered again.
 * - Copying the same digest into a second repo of the SAME org (e.g. shared base
 *   layers, or a cross-repo mount) also stores nothing new physically, so the org
 *   is only billed once per distinct digest it holds.
 * - Deleting one reference must only free the bytes when the org no longer holds
 *   that digest in ANY of its repos. The physical blob can still be shared with
 *   OTHER orgs (global content-addressed storage), but that is a separate concern
 *   handled by `deleteBlobIfUnreferenced`; the meter is per-org.
 *
 * The decision functions below are pure w.r.t. the DB (they only READ it) and
 * return the delta to record, so they can be unit-tested without a live billing
 * backend. The thin `meterStoragePush` / `meterStorageDelete` wrappers in the
 * router perform the actual `recordUsage` call.
 */

import { and, count, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import { artifactTable, namespaceTable, repositoryTable } from "lib/db/schema";

/** The usage meter key for stored bytes. */
export const STORAGE_METER = "storage_bytes";

/**
 * Count how many artifact rows across ALL of `orgId`'s repositories reference
 * `digest`. This is the per-org reference count for a content-addressed digest;
 * it drives both "is this newly stored for the org?" and "is it still held after
 * a delete?".
 */
const orgDigestRefCount = async (
  orgId: string,
  digest: string,
): Promise<number> => {
  const [row] = await dbPool
    .select({ value: count() })
    .from(artifactTable)
    .innerJoin(
      repositoryTable,
      eq(artifactTable.repositoryId, repositoryTable.id),
    )
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .where(
      and(
        eq(namespaceTable.organizationId, orgId),
        eq(artifactTable.digest, digest),
      ),
    );

  return row?.value ?? 0;
};

/**
 * Compute the storage delta to bill for a push of `size` bytes of `digest` into
 * `orgId`. MUST be called AFTER the artifact row insert. `created` is whether the
 * insert actually created a new row (`onConflictDoNothing().returning()` non-empty
 * for blobs, or a not-previously-present row for manifests); a re-push that
 * conflicts stores nothing and returns 0. When a new row was created, bill only
 * if it is the org's SOLE reference to the digest (count === 1), so copying an
 * already-held digest into another repo is not double-billed.
 */
export const storagePushDelta = async (
  orgId: string,
  digest: string,
  size: number,
  created: boolean,
): Promise<number> => {
  if (!created) return 0;
  const refs = await orgDigestRefCount(orgId, digest);
  return refs > 1 ? 0 : size;
};

/**
 * Compute the (negative) storage delta to credit when `size` bytes of `digest`
 * are deleted from `orgId`. MUST be called AFTER the artifact row is deleted.
 * Returns 0 when the org still references the digest in another repo (so a blob
 * shared across the org's repos is not decremented while still in use). The
 * decrement is clamped to `currentValue` so the meter never goes below zero.
 */
export const storageDeleteDelta = async (
  orgId: string,
  digest: string,
  size: number,
  currentValue: number,
): Promise<number> => {
  const refs = await orgDigestRefCount(orgId, digest);
  if (refs > 0) return 0;
  const decrement = Math.min(size, Math.max(currentValue, 0));
  return decrement > 0 ? -decrement : 0;
};
