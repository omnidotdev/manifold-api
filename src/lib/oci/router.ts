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
  enforceUsageLimit,
  getTier,
  limitExceeded,
  recordUsage,
  resolveEntitlements,
} from "lib/billing";
import {
  maintenanceAllowedNamespaces,
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
  authenticateOciToken,
  authorizeOci,
  registryAuthChallenge,
} from "lib/oci/auth";
import {
  appendChunk,
  assembleBlobStream,
  cleanupSession,
  computeStreamDigest,
  initSession,
} from "lib/oci/chunkStore";
import { computeDigest } from "lib/oci/digest";
import * as ociErrors from "lib/oci/errors";
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

const handleGetManifest = async (
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

  let artifact: typeof artifactTable.$inferSelect | undefined;

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

  if (!repoData) {
    set.status = 404;
    return;
  }

  let artifact: typeof artifactTable.$inferSelect | undefined;

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
        set: { artifactId: artifact.id },
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

  if (orgId) {
    await recordUsage(
      "organization",
      orgId,
      "storage_bytes",
      contentBytes.length,
    );
  }

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
    const entitlements = await resolveEntitlements(orgId);
    const storageCheck = await checkUsage(
      "organization",
      orgId,
      "storage_bytes",
    );

    if (storageCheck && !storageCheck.withinLimit) {
      const tier = getTier(entitlements);
      const { status, body } = limitExceeded(
        "Storage",
        storageCheck.value,
        storageCheck.limit ?? 0,
        tier,
      );

      set.status = status;
      return body;
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
  body: unknown,
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

  const chunk =
    body instanceof ArrayBuffer
      ? new Uint8Array(body)
      : typeof body === "string"
        ? new TextEncoder().encode(body)
        : new Uint8Array(0);

  const chunkSize = chunk.byteLength;

  if (chunkSize > 0) {
    await appendChunk(uuid, chunk);
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

const handleCompleteUpload = async (
  name: string,
  uuid: string,
  expectedDigest: string | undefined,
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

  const [session] = await dbPool
    .select()
    .from(uploadSessionTable)
    .where(eq(uploadSessionTable.id, uuid))
    .limit(1);

  if (!session) {
    set.status = 404;
    return ociErrors.blobUnknown(uuid);
  }

  const inlineBody =
    body instanceof ArrayBuffer
      ? new Uint8Array(body)
      : typeof body === "string" && body.length > 0
        ? new TextEncoder().encode(body)
        : null;

  // Small inline body (single PUT with content): use buffered path
  if (inlineBody && inlineBody.byteLength > 0) {
    const computedDigest = await computeDigest(inlineBody);

    if (expectedDigest && computedDigest !== expectedDigest) {
      await cleanupSession(uuid);
      set.status = 400;
      return ociErrors.digestInvalid(expectedDigest, computedDigest);
    }

    const storagePath = await storage.put(computedDigest, inlineBody);

    await dbPool
      .insert(artifactTable)
      .values({
        repositoryId: repoData.repository.id,
        digest: computedDigest,
        size: inlineBody.byteLength,
        mediaType: "application/octet-stream",
        storagePath,
      })
      .onConflictDoNothing();

    const orgId = repoData.namespace.organizationId;

    if (orgId) {
      await recordUsage(
        "organization",
        orgId,
        "storage_bytes",
        inlineBody.byteLength,
      );
    }

    await dbPool
      .delete(uploadSessionTable)
      .where(eq(uploadSessionTable.id, uuid));

    await cleanupSession(uuid);

    logAuditEvent(
      { organizationId: repoData.namespace.organizationId ?? undefined },
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
    return;
  }

  if (session.offset === 0) {
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

  // Streaming path: tee the file stream for concurrent digest + upload
  const { stream: blobStream, size: blobSize } = assembleBlobStream(uuid);
  const [digestStream, uploadStream] = blobStream.tee();

  const [computedDigest, storagePath] = await Promise.all([
    computeStreamDigest(digestStream),
    storage.putStream(expectedDigest ?? "pending", uploadStream, blobSize),
  ]);

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

  await dbPool
    .insert(artifactTable)
    .values({
      repositoryId: repoData.repository.id,
      digest: computedDigest,
      size: blobSize,
      mediaType: "application/octet-stream",
      storagePath,
    })
    .onConflictDoNothing();

  const orgId = repoData.namespace.organizationId;

  if (orgId) {
    await recordUsage("organization", orgId, "storage_bytes", blobSize);
  }

  await dbPool
    .delete(uploadSessionTable)
    .where(eq(uploadSessionTable.id, uuid));

  await cleanupSession(uuid);

  logAuditEvent(
    { organizationId: repoData.namespace.organizationId ?? undefined },
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
        if (method === "POST") return handleStartUpload(route.name, set);
        break;

      case "blob-upload-chunk":
        if (method === "PATCH")
          return handleUploadChunk(route.name, route.uuid, body, set);
        if (method === "PUT")
          return handleCompleteUpload(
            route.name,
            route.uuid,
            (query as Record<string, string>).digest,
            body,
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
