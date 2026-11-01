/**
 * OCI Distribution API v2 router.
 * @see https://github.com/opencontainers/distribution-spec/blob/main/spec.md
 *
 * Endpoints:
 * - GET /v2/                                  - Check API version
 * - GET /v2/_catalog                          - List repositories
 * - GET /v2/<name>/manifests/<reference>      - Pull manifest
 * - PUT /v2/<name>/manifests/<reference>      - Push manifest
 * - HEAD /v2/<name>/manifests/<reference>     - Check manifest exists
 * - DELETE /v2/<name>/manifests/<reference>   - Delete manifest
 * - GET /v2/<name>/blobs/<digest>             - Pull blob
 * - HEAD /v2/<name>/blobs/<digest>            - Check blob exists
 * - DELETE /v2/<name>/blobs/<digest>          - Delete blob
 * - POST /v2/<name>/blobs/uploads/            - Start upload
 * - PATCH /v2/<name>/blobs/uploads/<uuid>     - Upload chunk
 * - PUT /v2/<name>/blobs/uploads/<uuid>       - Complete upload
 * - GET /v2/<name>/tags/list                  - List tags
 *
 * <name> supports both single-segment ("repo") and namespaced
 * ("namespace/repo") formats per the OCI Distribution spec.
 * A catch-all route is used because Elysia's path-parameter router
 * does not allow multi-segment dynamic segments (names with slashes).
 */

import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import {
  checkUsage,
  enforcePrivateRepoLimit,
  enforceStorageLimit,
  enforceUsageLimit,
  recordUsage,
} from "lib/billing";
import {
  maintenanceAllowedNamespaces,
  publicRegistryHost,
  pullThroughTtlMs,
  registryRequireAuth,
} from "lib/config/env.config";
import { dbPool } from "lib/db";
import { recordDownload } from "lib/db/recordDownload";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  scanResultTable,
  tagTable,
  uploadSessionTable,
} from "lib/db/schema";
import { tryFederatedTagList } from "lib/federation/proxy";
import logAuditEvent from "lib/logging/logAuditEvent";
import {
  fetchUpstreamBlob,
  fetchUpstreamManifest,
  resolveUpstream,
} from "lib/mirror/upstream";
import {
  authenticateOciToken,
  authorizeOci,
  isPublicRegistryHost,
  isPublicRegistryWrite,
  registryAuthChallenge,
} from "lib/oci/auth";
import {
  appendChunk,
  assembleBlobStream,
  cleanupSession,
  createHashingStream,
  initSession,
} from "lib/oci/chunkStore";
import { computeDigest } from "lib/oci/digest";
import * as ociErrors from "lib/oci/errors";
import {
  STORAGE_METER,
  storageDeleteDelta,
  storagePushDelta,
} from "lib/oci/storageMetering";
import { events, flags } from "lib/providers";
import { scanningEnabled } from "lib/scan";
import { storage } from "lib/storage";

const FLAGS = {
  MAINTENANCE: "manifold-api-maintenance-mode",
} as const;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Parse repository name into namespace and repository.
 * Handles both "namespace/repo" and "repo" (defaults to "library").
 */
const parseRepoName = (name: string): { namespace: string; repo: string } => {
  const parts = name.split("/");
  if (parts.length === 1) {
    return { namespace: "library", repo: parts[0] };
  }
  return { namespace: parts[0], repo: parts.slice(1).join("/") };
};

/**
 * Get repository by namespace and name.
 */
const getRepository = async (namespace: string, repoName: string) => {
  const result = await dbPool
    .select({
      repository: repositoryTable,
      namespace: namespaceTable,
    })
    .from(repositoryTable)
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .where(
      and(
        eq(namespaceTable.name, namespace),
        eq(repositoryTable.name, repoName),
      ),
    )
    .limit(1);

  return result[0];
};

/**
 * Get or auto-create a repository for push operations.
 * Creates the namespace and repository on-demand so that `docker push`
 * works without pre-registering repos (standard OCI registry behavior).
 */
const getOrCreateRepository = async (
  namespace: string,
  repoName: string,
  artifactType = "container",
) => {
  const existing = await getRepository(namespace, repoName);
  if (existing) return existing;

  // Ensure namespace exists
  const [ns] = await dbPool
    .insert(namespaceTable)
    .values({ name: namespace })
    .onConflictDoNothing()
    .returning();

  const nsRow =
    ns ??
    (
      await dbPool
        .select()
        .from(namespaceTable)
        .where(eq(namespaceTable.name, namespace))
        .limit(1)
    )[0];

  if (!nsRow) return undefined;

  // New repos are PRIVATE (below), so a first push consumes a private-repo slot;
  // enforce the org's max_private_repos before creating it.
  if (nsRow.organizationId) {
    const limitError = await enforcePrivateRepoLimit(nsRow.organizationId);
    if (limitError) return { limitError };
  }

  // Ensure repository exists. New repos default PRIVATE: publishing is an
  // explicit opt-in (a public-by-default push would silently expose a tenant's
  // images). When auth is enforced, the namespace ownership was already checked
  // by authorizeOci before this runs.
  const [repo] = await dbPool
    .insert(repositoryTable)
    .values({
      namespaceId: nsRow.id,
      name: repoName,
      artifactType,
      isPublic: false,
    })
    .onConflictDoNothing()
    .returning();

  const repoRow =
    repo ??
    (
      await dbPool
        .select()
        .from(repositoryTable)
        .where(
          and(
            eq(repositoryTable.namespaceId, nsRow.id),
            eq(repositoryTable.name, repoName),
          ),
        )
        .limit(1)
    )[0];

  if (!repoRow) return undefined;

  return { repository: repoRow, namespace: nsRow };
};

/**
 * Meter newly-stored bytes after a push. Records `size` against the org's
 * `storage_bytes` meter only when this push actually added content the org did
 * not already hold (see `storagePushDelta`). No-op when there is no org (billing
 * unconfigured / anonymous namespace).
 *
 * The idempotency key is the freshly-created artifact row id, so a retried record
 * of the SAME stored copy dedupes, while a delete + later re-push (a NEW row, new
 * id) is metered again. A digest-only key would be deduped by Aether forever and
 * silently drop the re-push.
 */
const meterStoragePush = async (
  orgId: string | null | undefined,
  digest: string,
  size: number,
  created: boolean,
  artifactId: string,
): Promise<void> => {
  if (!orgId) return;
  const delta = await storagePushDelta(orgId, digest, size, created);
  if (delta > 0) {
    await recordUsage(
      "organization",
      orgId,
      STORAGE_METER,
      delta,
      `storage:add:${artifactId}`,
    );
  }
};

/**
 * Meter freed bytes after an artifact row is deleted. Decrements the org's
 * `storage_bytes` meter by the freed size only when the org no longer holds the
 * digest in any repo, clamped so the meter never goes below zero (see
 * `storageDeleteDelta`). No idempotency key: a repeated DELETE 404s before it
 * reaches here, so there is no retry to dedupe, and a stable key would let
 * Aether suppress a legitimate later decrement (over-counting storage).
 */
const meterStorageDelete = async (
  orgId: string | null | undefined,
  digest: string,
  size: number,
): Promise<void> => {
  if (!orgId) return;
  const check = await checkUsage("organization", orgId, STORAGE_METER);
  // Null = billing unconfigured; skip (matches every other billing call here).
  if (!check) return;
  const delta = await storageDeleteDelta(orgId, digest, size, check.value);
  if (delta < 0) {
    await recordUsage("organization", orgId, STORAGE_METER, delta);
  }
};

// =============================================================================
// Route pattern matching
// =============================================================================

/**
 * Parsed OCI route from the request path.
 */
type OciRoute =
  | { kind: "version-check" }
  | { kind: "catalog" }
  | { kind: "manifest"; name: string; reference: string }
  | { kind: "referrers"; name: string; digest: string }
  | { kind: "blob"; name: string; digest: string }
  | { kind: "blob-upload-start"; name: string }
  | { kind: "blob-upload-chunk"; name: string; uuid: string }
  | { kind: "tag-list"; name: string };

/**
 * Parse the OCI Distribution path from a request URL.
 * Returns undefined if the path does not match a known OCI route.
 */
const parseOciPath = (url: string): OciRoute | undefined => {
  const path = new URL(url).pathname.replace(/^\/v2\/?/, "");

  if (!path) return { kind: "version-check" };

  // /_catalog
  if (path === "_catalog") return { kind: "catalog" };

  // Match from the end: known suffixes identify the route type,
  // everything before them is the repository name.

  // /manifests/<reference>
  const manifestMatch = path.match(/^(.+)\/manifests\/([^/]+)$/);
  if (manifestMatch) {
    return {
      kind: "manifest",
      name: manifestMatch[1],
      reference: manifestMatch[2],
    };
  }

  // /referrers/<digest>
  const referrersMatch = path.match(/^(.+)\/referrers\/([^/]+)$/);
  if (referrersMatch) {
    return {
      kind: "referrers",
      name: referrersMatch[1],
      digest: referrersMatch[2],
    };
  }

  // /blobs/uploads/<uuid>
  const uploadChunkMatch = path.match(/^(.+)\/blobs\/uploads\/([^/]+)$/);
  if (uploadChunkMatch) {
    return {
      kind: "blob-upload-chunk",
      name: uploadChunkMatch[1],
      uuid: uploadChunkMatch[2],
    };
  }

  // /blobs/uploads/ (start)
  const uploadStartMatch = path.match(/^(.+)\/blobs\/uploads\/?$/);
  if (uploadStartMatch) {
    return { kind: "blob-upload-start", name: uploadStartMatch[1] };
  }

  // /blobs/<digest>
  const blobMatch = path.match(/^(.+)\/blobs\/([^/]+)$/);
  if (blobMatch) {
    return { kind: "blob", name: blobMatch[1], digest: blobMatch[2] };
  }

  // /tags/list
  const tagListMatch = path.match(/^(.+)\/tags\/list$/);
  if (tagListMatch) {
    return { kind: "tag-list", name: tagListMatch[1] };
  }

  return undefined;
};

// =============================================================================
// Handlers
// =============================================================================

type RepoData = NonNullable<Awaited<ReturnType<typeof getRepository>>>;

/**
 * Pull-through cache: fetch a manifest from the namespace's upstream registry,
 * store it locally, and return the cached artifact + its repo. Returns undefined
 * when the namespace is not a configured mirror or the upstream fetch fails.
 * The repo path sent upstream is the local repo name verbatim, so mirror a
 * Docker Hub official image as e.g. `<mirror>/library/alpine` (not `<mirror>/alpine`).
 */
const cacheUpstreamManifest = async (
  namespace: string,
  repo: string,
  reference: string,
): Promise<
  | { artifact: typeof artifactTable.$inferSelect; repoData: RepoData }
  | undefined
> => {
  const upstream = resolveUpstream(namespace);
  if (!upstream) return undefined;

  const fetched = await fetchUpstreamManifest(upstream, repo, reference);
  if (!fetched) return undefined;

  const content = new TextDecoder().decode(fetched.content);
  const digest = fetched.digest || (await computeDigest(fetched.content));

  const repoData = await getOrCreateRepository(namespace, repo);
  if (!repoData || "limitError" in repoData) return undefined;

  let subject: string | null = null;
  try {
    subject =
      (JSON.parse(content) as { subject?: { digest?: string } }).subject
        ?.digest ?? null;
  } catch {
    // Non-JSON manifest body -- no subject.
  }

  const [artifact] = await dbPool
    .insert(artifactTable)
    .values({
      repositoryId: repoData.repository.id,
      digest,
      size: fetched.content.length,
      mediaType: fetched.mediaType,
      content,
      subject,
    })
    .onConflictDoUpdate({
      target: [artifactTable.repositoryId, artifactTable.digest],
      set: {
        size: fetched.content.length,
        mediaType: fetched.mediaType,
        content,
        subject,
      },
    })
    .returning();

  if (!reference.startsWith("sha256:")) {
    await dbPool
      .insert(tagTable)
      .values({
        repositoryId: repoData.repository.id,
        artifactId: artifact.id,
        name: reference,
      })
      .onConflictDoUpdate({
        target: [tagTable.repositoryId, tagTable.name],
        // Refresh updatedAt so it marks the last upstream revalidation (the TTL
        // clock), and repoint the tag if the upstream digest moved.
        set: { artifactId: artifact.id, updatedAt: new Date().toISOString() },
      });
  }

  return { artifact, repoData };
};

/**
 * Pull-through cache: fetch a blob (by digest) from the namespace's upstream
 * registry, store it, and return the cached artifact. Blobs are content-
 * addressed and immutable, so a cached blob never needs revalidation.
 */
const cacheUpstreamBlob = async (
  namespace: string,
  repo: string,
  digest: string,
): Promise<
  | { artifact: typeof artifactTable.$inferSelect; repoData: RepoData }
  | undefined
> => {
  const upstream = resolveUpstream(namespace);
  if (!upstream) return undefined;

  const bytes = await fetchUpstreamBlob(upstream, repo, digest);
  if (!bytes) return undefined;

  const repoData = await getOrCreateRepository(namespace, repo);
  if (!repoData || "limitError" in repoData) return undefined;

  const storagePath = await storage.put(digest, bytes);

  const [artifact] = await dbPool
    .insert(artifactTable)
    .values({
      repositoryId: repoData.repository.id,
      digest,
      size: bytes.length,
      mediaType: "application/octet-stream",
      storagePath,
    })
    .onConflictDoUpdate({
      target: [artifactTable.repositoryId, artifactTable.digest],
      set: { size: bytes.length, storagePath },
    })
    .returning();

  return { artifact, repoData };
};

const handleGetManifest = async (
  name: string,
  reference: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  let repoData = await getRepository(namespace, repo);

  let artifact: typeof artifactTable.$inferSelect | undefined;

  if (repoData) {
    if (reference.startsWith("sha256:")) {
      const result = await dbPool
        .select()
        .from(artifactTable)
        .where(
          and(
            eq(artifactTable.repositoryId, repoData.repository.id),
            eq(artifactTable.digest, reference),
          ),
        )
        .limit(1);
      artifact = result[0];
    } else {
      const result = await dbPool
        .select({ artifact: artifactTable, tagUpdatedAt: tagTable.updatedAt })
        .from(tagTable)
        .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
        .where(
          and(
            eq(tagTable.repositoryId, repoData.repository.id),
            eq(tagTable.name, reference),
          ),
        )
        .limit(1);
      artifact = result[0]?.artifact;

      // Pull-through revalidation: a mutable cached tag past its TTL is
      // re-fetched upstream (digest may have moved). On success serve the fresh
      // copy; on upstream failure keep serving the stale cache.
      if (artifact && resolveUpstream(namespace) && pullThroughTtlMs > 0) {
        const cachedAt = result[0]?.tagUpdatedAt;
        const stale =
          !cachedAt ||
          Date.now() - new Date(cachedAt).getTime() > pullThroughTtlMs;
        if (stale) {
          const revalidated = await cacheUpstreamManifest(
            namespace,
            repo,
            reference,
          );
          if (revalidated) {
            artifact = revalidated.artifact;
            repoData = revalidated.repoData;
          }
        }
      }
    }
  }

  // Pull-through cache: on a local miss, fetch + cache from the upstream the
  // namespace mirrors (inert unless PULL_THROUGH_UPSTREAMS maps the namespace).
  if (!artifact) {
    const cached = await cacheUpstreamManifest(namespace, repo, reference);
    if (cached) {
      artifact = cached.artifact;
      repoData = cached.repoData;
    }
  }

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }

  if (!artifact) {
    set.status = 404;
    return ociErrors.manifestUnknown(reference);
  }

  logAuditEvent(
    { organizationId: repoData.namespace.organizationId ?? undefined },
    {
      action: "artifact.pull",
      resource: "manifest",
      resourceId: artifact.digest,
      details: { namespace, repo, reference },
    },
  );

  const orgId = repoData.namespace.organizationId;

  if (orgId) {
    const overLimit = await enforceUsageLimit(
      orgId,
      "bandwidth_bytes",
      "Bandwidth",
      artifact.size,
    );
    if (overLimit) {
      set.status = overLimit.status;
      return overLimit.body;
    }
    await recordUsage("organization", orgId, "bandwidth_bytes", artifact.size);
  }

  // Count one install/pull per image (manifest), not per blob.
  recordDownload(repoData.repository.id);

  set.headers["Content-Type"] = artifact.mediaType;
  set.headers["Docker-Content-Digest"] = artifact.digest;
  set.headers["Content-Length"] = String(artifact.size);

  return artifact.content ?? "";
};

const handleHeadManifest = async (
  name: string,
  reference: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getRepository(namespace, repo);

  let artifact: typeof artifactTable.$inferSelect | undefined;

  if (repoData) {
    if (reference.startsWith("sha256:")) {
      const result = await dbPool
        .select()
        .from(artifactTable)
        .where(
          and(
            eq(artifactTable.repositoryId, repoData.repository.id),
            eq(artifactTable.digest, reference),
          ),
        )
        .limit(1);
      artifact = result[0];
    } else {
      const result = await dbPool
        .select({ artifact: artifactTable })
        .from(tagTable)
        .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
        .where(
          and(
            eq(tagTable.repositoryId, repoData.repository.id),
            eq(tagTable.name, reference),
          ),
        )
        .limit(1);
      artifact = result[0]?.artifact;
    }
  }

  // Pull-through cache: a HEAD on a mirror populates the cache like a GET would.
  if (!artifact) {
    const cached = await cacheUpstreamManifest(namespace, repo, reference);
    artifact = cached?.artifact;
  }

  if (!artifact) {
    set.status = 404;
    return;
  }

  set.headers["Content-Type"] = artifact.mediaType;
  set.headers["Docker-Content-Digest"] = artifact.digest;
  set.headers["Content-Length"] = String(artifact.size);
};

const handlePutManifest = async (
  name: string,
  reference: string,
  request: Request,
  body: unknown,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getOrCreateRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }
  if ("limitError" in repoData) {
    set.status = repoData.limitError.status;
    return repoData.limitError.body;
  }

  const contentType =
    request.headers.get("Content-Type") ??
    "application/vnd.oci.image.manifest.v1+json";

  const content =
    typeof body === "string"
      ? body
      : body && typeof body === "object"
        ? JSON.stringify(body)
        : await request.text();
  const contentBytes = new TextEncoder().encode(content);
  const digest = await computeDigest(contentBytes);

  // Push-by-digest must match the content (spec: DIGEST_INVALID otherwise).
  if (reference.startsWith("sha256:") && reference !== digest) {
    set.status = 400;
    return ociErrors.digestInvalid(reference, digest);
  }

  // OCI referrers: a manifest carrying a `subject` refers to another manifest
  // (a signature/SBOM/attestation on an image). Index the subject digest so
  // GET /referrers/<digest> can list it.
  let subject: string | null = null;
  try {
    const parsed = JSON.parse(content) as { subject?: { digest?: string } };
    subject = parsed.subject?.digest ?? null;
  } catch {
    // Non-JSON manifest body -- no subject.
  }

  // Was this manifest already stored in this repo? Content is immutable per
  // digest, so the upsert below only refreshes metadata; this flag drives
  // storage metering (a re-push must not be billed as newly stored).
  const [existingArtifact] = await dbPool
    .select({ id: artifactTable.id })
    .from(artifactTable)
    .where(
      and(
        eq(artifactTable.repositoryId, repoData.repository.id),
        eq(artifactTable.digest, digest),
      ),
    )
    .limit(1);

  const [artifact] = await dbPool
    .insert(artifactTable)
    .values({
      repositoryId: repoData.repository.id,
      digest,
      size: contentBytes.length,
      mediaType: contentType,
      content,
      subject,
    })
    .onConflictDoUpdate({
      target: [artifactTable.repositoryId, artifactTable.digest],
      set: {
        size: contentBytes.length,
        mediaType: contentType,
        content,
        subject,
      },
    })
    .returning();

  // Enqueue a vulnerability scan for the pushed image (once per digest; inert
  // unless SCAN_ENABLED). Manifests + indexes only, not raw blobs.
  if (scanningEnabled() && contentType.includes("manifest")) {
    await dbPool
      .insert(scanResultTable)
      .values({ artifactId: artifact.id })
      .onConflictDoNothing({ target: scanResultTable.artifactId });
  }

  if (!reference.startsWith("sha256:")) {
    await dbPool
      .insert(tagTable)
      .values({
        repositoryId: repoData.repository.id,
        artifactId: artifact.id,
        name: reference,
      })
      .onConflictDoUpdate({
        target: [tagTable.repositoryId, tagTable.name],
        // Refresh updatedAt on every re-push: the retention pruner keeps the N
        // most-recently-updated tags (order by updatedAt desc). Without this a
        // continuously re-pushed rolling tag (e.g. latest/stable) keeps its
        // first-push timestamp, so once the repo exceeds the retention count the
        // pruner ranks the actively-used tag as oldest and deletes it. Mirrors
        // the pull-through path above.
        set: { artifactId: artifact.id, updatedAt: new Date().toISOString() },
      });
  }

  logAuditEvent(
    { organizationId: repoData.namespace.organizationId ?? undefined },
    {
      action: "artifact.push",
      resource: "manifest",
      resourceId: digest,
      details: { namespace, repo, reference },
    },
  );

  const orgId = repoData.namespace.organizationId;

  // Meter only newly-stored content: a re-push of the same manifest digest (or
  // a copy already held elsewhere in the org) adds no stored bytes.
  await meterStoragePush(
    orgId,
    digest,
    contentBytes.length,
    !existingArtifact,
    artifact.id,
  );

  try {
    await events.emit({
      type: "manifold.artifact.pushed",
      data: {
        repository: name,
        tag: reference.startsWith("sha256:") ? undefined : reference,
        digest,
        namespace,
        repo,
      },
      organizationId: orgId ?? "system",
      subject: name,
    });
  } catch {
    // Event emission is best-effort; do not fail the push
  }

  set.status = 201;
  set.headers.Location = `/v2/${name}/manifests/${digest}`;
  set.headers["Docker-Content-Digest"] = digest;
  // Echo the subject so clients know the registry accepted the referrer.
  if (subject) set.headers["OCI-Subject"] = subject;
};

/**
 * OCI referrers API: list every manifest in the repo whose `subject` is
 * `digest` (signatures, SBOMs, attestations on an image), as an OCI image index.
 * Optionally filtered to a single `artifactType`.
 * @see https://github.com/opencontainers/distribution-spec/blob/main/spec.md#listing-referrers
 */
const handleReferrers = async (
  name: string,
  digest: string,
  artifactTypeFilter: string | undefined,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getRepository(namespace, repo);
  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }

  const rows = await dbPool
    .select({
      digest: artifactTable.digest,
      mediaType: artifactTable.mediaType,
      size: artifactTable.size,
      content: artifactTable.content,
    })
    .from(artifactTable)
    .where(
      and(
        eq(artifactTable.repositoryId, repoData.repository.id),
        eq(artifactTable.subject, digest),
      ),
    );

  const manifests = rows
    .map((row) => {
      let artifactType: string | undefined;
      let annotations: Record<string, string> | undefined;
      try {
        const parsed = JSON.parse(row.content ?? "{}") as {
          artifactType?: string;
          config?: { mediaType?: string };
          annotations?: Record<string, string>;
        };
        artifactType = parsed.artifactType ?? parsed.config?.mediaType;
        annotations = parsed.annotations;
      } catch {
        // Non-JSON referrer content; leave artifactType/annotations unset.
      }
      return {
        mediaType: row.mediaType,
        digest: row.digest,
        size: row.size,
        ...(artifactType ? { artifactType } : {}),
        ...(annotations ? { annotations } : {}),
      };
    })
    .filter(
      (m) => !artifactTypeFilter || m.artifactType === artifactTypeFilter,
    );

  set.headers["Content-Type"] = "application/vnd.oci.image.index.v1+json";
  if (artifactTypeFilter) set.headers["OCI-Filters-Applied"] = "artifactType";

  return {
    schemaVersion: 2,
    mediaType: "application/vnd.oci.image.index.v1+json",
    manifests,
  };
};

const handleGetBlob = async (
  name: string,
  digest: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  let repoData = await getRepository(namespace, repo);

  let artifact: typeof artifactTable.$inferSelect | undefined;

  if (repoData) {
    const [row] = await dbPool
      .select()
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.repositoryId, repoData.repository.id),
          eq(artifactTable.digest, digest),
        ),
      )
      .limit(1);
    artifact = row;
  }

  // Pull-through cache: fetch + cache the blob from the upstream on a local miss.
  if (!artifact) {
    const cached = await cacheUpstreamBlob(namespace, repo, digest);
    if (cached) {
      artifact = cached.artifact;
      repoData = cached.repoData;
    }
  }

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }

  if (!artifact) {
    set.status = 404;
    return ociErrors.blobUnknown(digest);
  }

  logAuditEvent(
    { organizationId: repoData.namespace.organizationId ?? undefined },
    {
      action: "blob.pull",
      resource: "blob",
      resourceId: artifact.digest,
      details: { namespace, repo, digest },
    },
  );

  const orgId = repoData.namespace.organizationId;

  if (orgId) {
    const overLimit = await enforceUsageLimit(
      orgId,
      "bandwidth_bytes",
      "Bandwidth",
      artifact.size,
    );
    if (overLimit) {
      set.status = overLimit.status;
      return overLimit.body;
    }
    await recordUsage("organization", orgId, "bandwidth_bytes", artifact.size);
  }

  if (artifact.storagePath) {
    const result = await storage.getStream(artifact.digest);

    if (!result) {
      // Blob record exists in DB but the file is missing from storage
      console.error(
        `Blob missing from storage: ${artifact.digest} (path: ${artifact.storagePath})`,
      );
      set.status = 404;
      return ociErrors.blobUnknown(digest);
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Docker-Content-Digest": artifact.digest,
        "Content-Length": String(artifact.size),
      },
    });
  }

  set.headers["Content-Type"] = "application/octet-stream";
  set.headers["Docker-Content-Digest"] = artifact.digest;
  set.headers["Content-Length"] = String(artifact.size);

  return artifact.content ?? "";
};

const handleHeadBlob = async (
  name: string,
  digest: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return;
  }

  const [artifact] = await dbPool
    .select()
    .from(artifactTable)
    .where(
      and(
        eq(artifactTable.repositoryId, repoData.repository.id),
        eq(artifactTable.digest, digest),
      ),
    )
    .limit(1);

  if (!artifact) {
    set.status = 404;
    return;
  }

  set.headers["Content-Type"] = "application/octet-stream";
  set.headers["Docker-Content-Digest"] = artifact.digest;
  set.headers["Content-Length"] = String(artifact.size);
};

/**
 * OCI cross-repo blob mount: POST /v2/<name>/blobs/uploads/?mount=<digest>&from=<repo>.
 * Blobs are content-addressed and stored globally by digest, so "mounting" a
 * layer that already exists just links it into the target repo (no re-upload,
 * no data copy) and returns 201. On any miss it falls back to a normal upload
 * session (202), which is spec-compliant.
 * @see https://github.com/opencontainers/distribution-spec/blob/main/spec.md#mounting-a-blob-from-another-repository
 */
const handleMountBlob = async (
  name: string,
  mountDigest: string,
  fromRepo: string | undefined,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getOrCreateRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }
  if ("limitError" in repoData) {
    set.status = repoData.limitError.status;
    return repoData.limitError.body;
  }

  // Locate the source blob. Prefer the named `from` repo, then fall back to any
  // repo holding it (global content-addressed dedup). When REGISTRY_REQUIRE_AUTH
  // is enabled the write to `name` was already authorized; the digest itself is
  // the capability (you must already possess the content to know it).
  let source: typeof artifactTable.$inferSelect | undefined;
  if (fromRepo) {
    const { namespace: fromNs, repo: fromName } = parseRepoName(fromRepo);
    const fromData = await getRepository(fromNs, fromName);
    if (fromData) {
      const [row] = await dbPool
        .select()
        .from(artifactTable)
        .where(
          and(
            eq(artifactTable.repositoryId, fromData.repository.id),
            eq(artifactTable.digest, mountDigest),
          ),
        )
        .limit(1);
      source = row;
    }
  }
  if (!source) {
    const [row] = await dbPool
      .select()
      .from(artifactTable)
      .where(eq(artifactTable.digest, mountDigest))
      .limit(1);
    source = row;
  }

  // Only a real stored blob can be mounted; otherwise start a normal upload.
  if (!source?.storagePath) {
    return handleStartUpload(name, set);
  }

  const [mounted] = await dbPool
    .insert(artifactTable)
    .values({
      repositoryId: repoData.repository.id,
      digest: source.digest,
      size: source.size,
      mediaType: source.mediaType,
      storagePath: source.storagePath,
    })
    .onConflictDoNothing({
      target: [artifactTable.repositoryId, artifactTable.digest],
    })
    .returning();

  // A mount links an existing blob into this repo. Meter it like any other push
  // (consistent with the upload path): only billed when it created a new row and
  // the org did not already hold the digest elsewhere.
  if (mounted) {
    await meterStoragePush(
      repoData.namespace.organizationId,
      source.digest,
      source.size,
      true,
      mounted.id,
    );
  }

  set.status = 201;
  set.headers.Location = `/v2/${name}/blobs/${source.digest}`;
  set.headers["Docker-Content-Digest"] = source.digest;
};

const handleStartUpload = async (
  name: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getOrCreateRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }
  if ("limitError" in repoData) {
    set.status = repoData.limitError.status;
    return repoData.limitError.body;
  }

  const orgId = repoData.namespace.organizationId;

  if (orgId) {
    // Gate on the org's current stored bytes: the blob size is not known until
    // the upload completes, so this blocks starting a new upload once the org is
    // already at its storage cap (the completed blob is metered post-write)
    const overLimit = await enforceStorageLimit(orgId, 0);
    if (overLimit) {
      set.status = overLimit.status;
      return overLimit.body;
    }
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const [session] = await dbPool
    .insert(uploadSessionTable)
    .values({
      repositoryId: repoData.repository.id,
      expiresAt,
    })
    .returning();

  await initSession(session.id);

  set.status = 202;
  set.headers.Location = `/v2/${name}/blobs/uploads/${session.id}`;
  set.headers["Docker-Upload-UUID"] = session.id;
  set.headers.Range = "0-0";
};

const handleUploadChunk = async (
  name: string,
  uuid: string,
  request: Request,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const [session] = await dbPool
    .select()
    .from(uploadSessionTable)
    .where(eq(uploadSessionTable.id, uuid))
    .limit(1);

  if (!session) {
    set.status = 404;
    return ociErrors.blobUnknown(uuid);
  }

  // Stream the incoming chunk straight to the on-disk session file instead of
  // buffering it in RAM. The parser hook on the router leaves `request.body` an
  // unread stream for octet-stream blob-upload writes, so a multi-GB chunk is
  // appended piece by piece and never materialized as one Uint8Array
  let chunkSize = 0;
  if (request.body) {
    for await (const chunk of request.body) {
      await appendChunk(uuid, chunk);
      chunkSize += chunk.byteLength;
    }
  }

  const newOffset = session.offset + chunkSize;

  await dbPool
    .update(uploadSessionTable)
    .set({ offset: newOffset })
    .where(eq(uploadSessionTable.id, uuid));

  set.status = 202;
  set.headers.Location = `/v2/${name}/blobs/uploads/${uuid}`;
  set.headers["Docker-Upload-UUID"] = uuid;
  set.headers.Range = `0-${newOffset - 1}`;
};

/**
 * Persist a freshly-stored blob: insert its artifact row, meter newly-stored
 * bytes, tear down the upload session, and set the 201 response. Shared by the
 * monolithic (single PUT) and chunked (PATCH + PUT) completion paths so both
 * meter and audit identically.
 */
const finalizeBlobUpload = async (
  repoData: RepoData,
  name: string,
  namespace: string,
  repo: string,
  uuid: string,
  computedDigest: string,
  size: number,
  storagePath: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const [inserted] = await dbPool
    .insert(artifactTable)
    .values({
      repositoryId: repoData.repository.id,
      digest: computedDigest,
      size,
      mediaType: "application/octet-stream",
      storagePath,
    })
    .onConflictDoNothing()
    .returning();

  const orgId = repoData.namespace.organizationId;

  // Meter only when this upload created a new artifact row: a re-push of an
  // already-stored blob conflicts (no row) and must not be billed again.
  if (inserted) {
    await meterStoragePush(orgId, computedDigest, size, true, inserted.id);
  }

  await dbPool
    .delete(uploadSessionTable)
    .where(eq(uploadSessionTable.id, uuid));

  await cleanupSession(uuid);

  logAuditEvent(
    { organizationId: orgId ?? undefined },
    {
      action: "blob.push",
      resource: "blob",
      resourceId: computedDigest,
      details: { namespace, repo, uuid },
    },
  );

  set.status = 201;
  set.headers.Location = `/v2/${name}/blobs/${computedDigest}`;
  set.headers["Docker-Content-Digest"] = computedDigest;
};

/** Parse a non-negative Content-Length header into a byte-count hint, if valid. */
const parseContentLength = (request: Request): number | undefined => {
  const raw = request.headers.get("content-length");
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) || n < 0 ? undefined : n;
};

const handleCompleteUpload = async (
  name: string,
  uuid: string,
  expectedDigest: string | undefined,
  request: Request,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getOrCreateRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }
  if ("limitError" in repoData) {
    set.status = repoData.limitError.status;
    return repoData.limitError.body;
  }

  const [session] = await dbPool
    .select()
    .from(uploadSessionTable)
    .where(eq(uploadSessionTable.id, uuid))
    .limit(1);

  if (!session) {
    set.status = 404;
    return ociErrors.blobUnknown(uuid);
  }

  // Monolithic push (buildkit cache blob, oras, docker with a single PUT): the
  // whole blob arrives in this PUT body with no prior PATCH chunks. Stream it
  // straight to storage, hashing inline, so a multi-GB body is never buffered in
  // RAM (the OOM this fix targets) nor staged to disk. The router's parser hook
  // leaves `request.body` an unread stream for octet-stream blob writes.
  if (session.offset === 0 && request.body) {
    // storage keys off the digest; the digest is only known after streaming, so
    // stage under the client-declared digest and verify what we computed matches
    const storageKey = expectedDigest ?? "pending";
    const { stream, result } = createHashingStream(request.body);

    let storagePath: string;
    try {
      storagePath = await storage.putStream(
        storageKey,
        stream,
        parseContentLength(request),
      );
    } catch (err) {
      await cleanupSession(uuid);
      throw err;
    }

    const { digest: computedDigest, size } = await result;

    if (expectedDigest && computedDigest !== expectedDigest) {
      // Remove the mis-keyed object staged under the declared digest
      try {
        await storage.delete(storageKey);
      } catch {
        // Best-effort cleanup
      }
      await cleanupSession(uuid);
      set.status = 400;
      return ociErrors.digestInvalid(expectedDigest, computedDigest);
    }

    return finalizeBlobUpload(
      repoData,
      name,
      namespace,
      repo,
      uuid,
      computedDigest,
      size,
      storagePath,
      set,
    );
  }

  // Chunked completion: a final PUT after one or more PATCH chunks. It may carry
  // a trailing chunk, which we append (streaming) to the session file before
  // assembling. `session.offset` was tracked as chunks were appended
  if (request.body) {
    let trailing = 0;
    for await (const chunk of request.body) {
      await appendChunk(uuid, chunk);
      trailing += chunk.byteLength;
    }
    if (trailing > 0) {
      await dbPool
        .update(uploadSessionTable)
        .set({ offset: session.offset + trailing })
        .where(eq(uploadSessionTable.id, uuid));
    }
  }

  const { stream: blobStream, size: blobSize } = assembleBlobStream(uuid);

  if (blobSize === 0) {
    set.status = 400;
    return {
      errors: [
        {
          code: "BLOB_UPLOAD_INVALID",
          message: "No content provided",
        },
      ],
    };
  }

  // Stream the assembled file to storage, hashing inline (single pass, O(1)
  // memory, no `tee()` fan-out that would buffer the whole blob)
  const { stream: hashingStream, result } = createHashingStream(blobStream);
  const storagePath = await storage.putStream(
    expectedDigest ?? "pending",
    hashingStream,
    blobSize,
  );
  const { digest: computedDigest } = await result;

  if (expectedDigest && computedDigest !== expectedDigest) {
    // Clean up the incorrectly-keyed blob from storage
    try {
      await storage.delete(expectedDigest);
    } catch {
      // Best-effort cleanup
    }
    await cleanupSession(uuid);
    set.status = 400;
    return ociErrors.digestInvalid(expectedDigest, computedDigest);
  }

  return finalizeBlobUpload(
    repoData,
    name,
    namespace,
    repo,
    uuid,
    computedDigest,
    blobSize,
    storagePath,
    set,
  );
};

const handleCatalog = async (
  query: { n?: string; last?: string },
  visibility?: { filter: boolean; namespaceId: string | null },
) => {
  const repos = await dbPool
    .select({
      namespace: namespaceTable.name,
      repo: repositoryTable.name,
      isPublic: repositoryTable.isPublic,
      namespaceId: repositoryTable.namespaceId,
    })
    .from(repositoryTable)
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .orderBy(namespaceTable.name, repositoryTable.name);

  // When auth is enforced, never leak private repos of other tenants: return
  // public repos plus (for an authenticated caller) their own namespace.
  const visible = visibility?.filter
    ? repos.filter(
        (r) =>
          r.isPublic ||
          (visibility.namespaceId !== null &&
            r.namespaceId === visibility.namespaceId),
      )
    : repos;

  let names = visible.map((r) =>
    r.namespace === "library" ? r.repo : `${r.namespace}/${r.repo}`,
  );

  if (query.last) {
    const lastIdx = names.indexOf(query.last);
    if (lastIdx >= 0) names = names.slice(lastIdx + 1);
  }
  if (query.n) {
    const n = Number.parseInt(query.n, 10);
    if (!Number.isNaN(n)) names = names.slice(0, n);
  }

  return { repositories: names };
};

/**
 * Remove a blob from storage only when no artifact (in ANY repo) still
 * references its content-addressed digest. Blob storage is global +
 * content-addressed, so the same digest is shared across repos; blindly
 * deleting it would corrupt every other repo that references it. Call this
 * AFTER the artifact row has been deleted, and only when the artifact actually
 * had a stored blob (`storagePath`). `storage.delete` takes the DIGEST, not the
 * storage path -- passing the path throws in `parseDigest`.
 */
const deleteBlobIfUnreferenced = async (digest: string) => {
  const [stillUsed] = await dbPool
    .select({ id: artifactTable.id })
    .from(artifactTable)
    .where(eq(artifactTable.digest, digest))
    .limit(1);
  if (!stillUsed) await storage.delete(digest);
};

const handleDeleteManifest = async (
  name: string,
  reference: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }

  if (reference.startsWith("sha256:")) {
    // Delete by digest: remove artifact and all tags pointing to it
    const [artifact] = await dbPool
      .select()
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.repositoryId, repoData.repository.id),
          eq(artifactTable.digest, reference),
        ),
      )
      .limit(1);

    if (!artifact) {
      set.status = 404;
      return ociErrors.manifestUnknown(reference);
    }

    await dbPool.delete(tagTable).where(eq(tagTable.artifactId, artifact.id));
    await dbPool.delete(artifactTable).where(eq(artifactTable.id, artifact.id));

    // Free the metered bytes now that the row is gone (only if the org no longer
    // holds this digest anywhere; clamped at zero). Called after the delete so
    // the per-org reference count reflects the removal.
    await meterStorageDelete(
      repoData.namespace.organizationId,
      artifact.digest,
      artifact.size,
    );

    if (artifact.storagePath) {
      await deleteBlobIfUnreferenced(artifact.digest);
    }
  } else {
    // Delete by tag: remove the tag only
    const result = await dbPool
      .delete(tagTable)
      .where(
        and(
          eq(tagTable.repositoryId, repoData.repository.id),
          eq(tagTable.name, reference),
        ),
      )
      .returning();

    if (!result.length) {
      set.status = 404;
      return ociErrors.manifestUnknown(reference);
    }
  }

  set.status = 202;
  return "";
};

const handleDeleteBlob = async (
  name: string,
  digest: string,
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);
  const repoData = await getRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }

  const [artifact] = await dbPool
    .select()
    .from(artifactTable)
    .where(
      and(
        eq(artifactTable.repositoryId, repoData.repository.id),
        eq(artifactTable.digest, digest),
      ),
    )
    .limit(1);

  if (!artifact) {
    set.status = 404;
    return ociErrors.blobUnknown(digest);
  }

  await dbPool.delete(artifactTable).where(eq(artifactTable.id, artifact.id));

  // Free the metered bytes now that the row is gone (only if the org no longer
  // holds this digest anywhere; clamped at zero).
  await meterStorageDelete(
    repoData.namespace.organizationId,
    artifact.digest,
    artifact.size,
  );

  if (artifact.storagePath) {
    await deleteBlobIfUnreferenced(artifact.digest);
  }

  set.status = 202;
  return "";
};

const handleListTags = async (
  name: string,
  query: { n?: string; last?: string },
  set: { status?: number | string; headers: Record<string, string | number> },
) => {
  const { namespace, repo } = parseRepoName(name);

  const federated = await tryFederatedTagList(namespace, repo);
  if (federated) return federated;

  const repoData = await getRepository(namespace, repo);

  if (!repoData) {
    set.status = 404;
    return ociErrors.nameUnknown(name);
  }

  let tags = await dbPool
    .select({ name: tagTable.name })
    .from(tagTable)
    .where(eq(tagTable.repositoryId, repoData.repository.id))
    .orderBy(tagTable.name);

  if (query.last) {
    const lastIdx = tags.findIndex((t) => t.name === query.last);
    if (lastIdx >= 0) {
      tags = tags.slice(lastIdx + 1);
    }
  }
  if (query.n) {
    const n = Number.parseInt(query.n, 10);
    if (!Number.isNaN(n)) {
      tags = tags.slice(0, n);
    }
  }

  return {
    name,
    tags: tags.map((t) => t.name),
  };
};

// =============================================================================
// Router
// =============================================================================

/**
 * OCI Distribution API router.
 *
 * Uses a catch-all route (`/*`) to support multi-segment repository
 * names (e.g., "omnidotdev/kiln"). Elysia's parametric router only
 * captures single path segments, which breaks the OCI Distribution
 * spec requirement that <name> may contain slashes.
 */
const ociRouter = new Elysia({ prefix: "/v2" })
  // Blob-upload writes must never be buffered into RAM: a multi-GB layer or
  // buildkit cache blob would OOM the process. Elysia's default octet-stream
  // parser calls `request.arrayBuffer()`, materializing the whole body before
  // the handler runs. This parser hook intercepts PATCH/PUT to a blob-upload
  // path and returns the live request stream: Elysia assigns it to `body` and
  // marks the body parsed, so the default parser is skipped and `request.body`
  // stays an unread `ReadableStream` the handler streams straight to storage.
  // Every other route (manifests, tiny blobs) returns nothing here and keeps the
  // default buffered parsing.
  .onParse(({ request }) => {
    if (request.method !== "PATCH" && request.method !== "PUT") return;

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/octet-stream")) return;

    if (parseOciPath(request.url)?.kind !== "blob-upload-chunk") return;

    // Returning a defined value skips the default parser. A completion PUT with
    // no body (chunked upload finalize) has a null `request.body`; return an
    // empty stream so parsing is still skipped and `request.body` stays null
    return request.body ?? new ReadableStream<Uint8Array>();
  })
  .onBeforeHandle(async ({ request, set }) => {
    const path = new URL(request.url).pathname.replace(/^\/v2\/?/, "");

    if (!path) return;

    if (!(await flags.isEnabled(FLAGS.MAINTENANCE))) return;

    const namespace = decodeURIComponent(path.split("/")[0]);

    if (!maintenanceAllowedNamespaces.includes(namespace)) {
      set.status = 503;
      return ociErrors.denied("Registry is in maintenance mode");
    }
  })

  // Version check (exact match, not catch-all)
  .get("/", ({ set }) => {
    set.headers["Docker-Distribution-API-Version"] = "registry/2.0";
    return {};
  })

  // Catch-all for all OCI Distribution routes
  .all("/*", async ({ request, body, set, query }) => {
    const route = parseOciPath(request.url);

    if (!route) {
      set.status = 404;
      return "NOT_FOUND";
    }

    if (route.kind === "version-check") {
      set.headers["Docker-Distribution-API-Version"] = "registry/2.0";
      return {};
    }

    const method = request.method;

    // Containment while REGISTRY_REQUIRE_AUTH is off: refuse anonymous WRITES
    // that arrived via the public host. With auth off the registry is fully
    // open, which on the public host (api.manifold.omni.dev) would let the open
    // internet push/overwrite/delete images in the shared namespace -- a
    // supply-chain path into every deploy. The in-cluster build pipeline reaches
    // the registry over a different Host (NodePort/service DNS) and is
    // unaffected; the gateway routes the public hostname here only when the Host
    // is that hostname, so a public client cannot spoof an internal Host. Once
    // REGISTRY_REQUIRE_AUTH is on, per-token authz below supersedes this.
    if (
      !registryRequireAuth &&
      isPublicRegistryWrite(
        method,
        request.headers.get("host"),
        publicRegistryHost,
      )
    ) {
      set.status = 403;
      set.headers["Docker-Distribution-API-Version"] = "registry/2.0";
      return ociErrors.denied("public registry writes are disabled");
    }

    // Containment while REGISTRY_REQUIRE_AUTH is off: also authorize READS that
    // arrived via the public host, so the open internet cannot anonymously pull
    // a PRIVATE image over it. authorizeOci still serves public repos
    // anonymously, so public pulls are unaffected; the in-cluster pipeline uses
    // a different Host and is not matched, so fleet pulls stay open. Once
    // REGISTRY_REQUIRE_AUTH is on, the per-token authz below covers every host.
    if (
      !registryRequireAuth &&
      route.kind !== "catalog" &&
      (method === "GET" || method === "HEAD") &&
      isPublicRegistryHost(request.headers.get("host"), publicRegistryHost)
    ) {
      const { namespace, repo } = parseRepoName(route.name);
      const decision = await authorizeOci(
        namespace,
        repo,
        "read",
        request.headers.get("authorization"),
      );
      if (!decision.ok) {
        set.status = decision.status;
        if (decision.challenge)
          set.headers["WWW-Authenticate"] = registryAuthChallenge;
        set.headers["Docker-Distribution-API-Version"] = "registry/2.0";
        return decision.status === 401
          ? ociErrors.unauthorized(decision.error)
          : ociErrors.denied(decision.error);
      }
    }

    // Authorization (flag-gated). OFF = fully open (the in-cluster build
    // pipeline relies on this). ON = per-namespace `mf_` token auth: public
    // repos are anonymously readable, private reads and all writes require a
    // token whose namespace owns the target and whose scope covers the op.
    // The catalog is not gated here -- it filters its own results by visibility.
    if (registryRequireAuth && route.kind !== "catalog") {
      const isWrite =
        method === "PUT" ||
        method === "PATCH" ||
        method === "POST" ||
        method === "DELETE";
      const { namespace, repo } = parseRepoName(route.name);
      const decision = await authorizeOci(
        namespace,
        repo,
        isWrite ? "write" : "read",
        request.headers.get("authorization"),
      );
      if (!decision.ok) {
        set.status = decision.status;
        if (decision.challenge)
          set.headers["WWW-Authenticate"] = registryAuthChallenge;
        set.headers["Docker-Distribution-API-Version"] = "registry/2.0";
        return decision.status === 401
          ? ociErrors.unauthorized(decision.error)
          : ociErrors.denied(decision.error);
      }
    }

    switch (route.kind) {
      case "catalog":
        if (method === "GET") {
          const catalogAuth = registryRequireAuth
            ? await authenticateOciToken(request.headers.get("authorization"))
            : null;
          return handleCatalog(query as Record<string, string>, {
            filter: registryRequireAuth,
            namespaceId: catalogAuth?.namespaceId ?? null,
          });
        }
        break;

      case "manifest":
        if (method === "GET")
          return handleGetManifest(route.name, route.reference, set);
        if (method === "HEAD")
          return handleHeadManifest(route.name, route.reference, set);
        if (method === "PUT")
          return handlePutManifest(
            route.name,
            route.reference,
            request,
            body,
            set,
          );
        if (method === "DELETE")
          return handleDeleteManifest(route.name, route.reference, set);
        break;

      case "referrers":
        if (method === "GET")
          return handleReferrers(
            route.name,
            route.digest,
            (query as Record<string, string>).artifactType,
            set,
          );
        break;

      case "blob":
        if (method === "GET")
          return handleGetBlob(route.name, route.digest, set);
        if (method === "HEAD")
          return handleHeadBlob(route.name, route.digest, set);
        if (method === "DELETE")
          return handleDeleteBlob(route.name, route.digest, set);
        break;

      case "blob-upload-start":
        if (method === "POST") {
          const q = query as Record<string, string>;
          // Cross-repo mount (?mount=<digest>&from=<repo>) links an existing
          // blob without re-upload; otherwise start a normal upload session.
          if (q.mount) return handleMountBlob(route.name, q.mount, q.from, set);
          return handleStartUpload(route.name, set);
        }
        break;

      case "blob-upload-chunk":
        if (method === "PATCH")
          return handleUploadChunk(route.name, route.uuid, request, set);
        if (method === "PUT")
          return handleCompleteUpload(
            route.name,
            route.uuid,
            (query as Record<string, string>).digest,
            request,
            set,
          );
        break;

      case "tag-list":
        if (method === "GET")
          return handleListTags(
            route.name,
            query as Record<string, string>,
            set,
          );
        break;
    }

    set.status = 405;
    return { errors: [{ code: "UNSUPPORTED", message: "Method not allowed" }] };
  });

export default ociRouter;
