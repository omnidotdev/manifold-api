import { and, eq } from "drizzle-orm";

import { enforceUsageLimit, recordUsage } from "lib/billing";
import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  npmDistTagTable,
  npmMetadataTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";
import { requireNpmWrite } from "lib/npm/auth";
import { npmError } from "lib/npm/errors";
import { computeIntegrity } from "lib/npm/integrity";
import { isValidNpmName } from "lib/npm/name";
import { computeDigest } from "lib/oci/digest";
import { events } from "lib/providers";
import { storage } from "lib/storage";

const NPM_MEDIA_TYPE = "application/vnd.omni.npm.tgz";

const SEMVER = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;

interface NpmAttachment {
  data?: string;
}

/** Handle `PUT /npm/@:scope/:pkg` (npm publish). */
export const publishHandler = async (
  scope: string,
  pkg: string,
  request: Request,
  set: { status?: number; headers: Record<string, string> },
) => {
  // Authenticate (write scope required)
  let auth: Awaited<ReturnType<typeof requireNpmWrite>>;
  try {
    auth = await requireNpmWrite(request.headers.get("Authorization"));
  } catch (e: unknown) {
    set.status = 401;
    return npmError((e as Error).message);
  }

  // Parse JSON body
  let body: {
    name?: string;
    versions?: Record<string, Record<string, unknown>>;
    _attachments?: Record<string, NpmAttachment>;
    "dist-tags"?: Record<string, string>;
  };
  try {
    body = await request.json();
  } catch {
    set.status = 400;
    return npmError("invalid JSON body");
  }

  // Exactly one version and one attachment per publish
  const versionEntries = Object.entries(body.versions ?? {});
  const attachmentEntries = Object.entries(body._attachments ?? {});
  if (versionEntries.length !== 1 || attachmentEntries.length !== 1) {
    set.status = 400;
    return npmError("exactly one version and one attachment are required");
  }

  const [version, manifest] = versionEntries[0];
  const attachment = attachmentEntries[0][1];
  if (!attachment.data) {
    set.status = 400;
    return npmError("attachment is missing tarball data");
  }
  const bytes = new Uint8Array(Buffer.from(attachment.data, "base64"));

  const fullName = `@${scope}/${pkg}`;

  // Validate name, version, and that the body agrees with the URL
  if (!isValidNpmName(fullName)) {
    set.status = 400;
    return npmError(`invalid package name: ${fullName}`);
  }
  if (!SEMVER.test(version)) {
    set.status = 400;
    return npmError(`invalid version: ${version}`);
  }
  if (body.name !== fullName) {
    set.status = 400;
    return npmError(`body name ${body.name} does not match URL ${fullName}`);
  }

  // Resolve namespace from token and require it to own this scope
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);
  if (!ns || ns.name !== scope) {
    set.status = 403;
    return npmError("token not authorized for this scope");
  }

  // Compute integrity; verify against any client-declared value
  const { shasum, integrity } = computeIntegrity(bytes);
  const declaredIntegrity = (
    manifest.dist as { integrity?: string } | undefined
  )?.integrity;
  if (declaredIntegrity && declaredIntegrity !== integrity) {
    set.status = 400;
    return npmError("integrity mismatch");
  }

  // npm versions are immutable
  const [existing] = await dbPool
    .select({ id: npmMetadataTable.id })
    .from(npmMetadataTable)
    .where(
      and(
        eq(npmMetadataTable.name, fullName),
        eq(npmMetadataTable.version, version),
      ),
    )
    .limit(1);
  if (existing) {
    set.status = 409;
    return npmError(`${fullName}@${version} already exists`);
  }

  // Enforce the storage quota before consuming space.
  if (ns.organizationId) {
    const overLimit = await enforceUsageLimit(
      ns.organizationId,
      "storage_bytes",
      "Storage",
      bytes.byteLength,
    );
    if (overLimit) {
      set.status = overLimit.status;
      return overLimit.body;
    }
  }

  // Store the tarball blob
  const digest = await computeDigest(bytes);
  const storagePath = await storage.put(digest, bytes);

  await dbPool.transaction(async (tx) => {
    // Upsert repository (package)
    const [repo] = await tx
      .insert(repositoryTable)
      .values({
        namespaceId: ns.id,
        name: pkg,
        artifactType: "npm",
        isPublic: true,
      })
      .onConflictDoNothing({
        target: [repositoryTable.namespaceId, repositoryTable.name],
      })
      .returning();

    const repoRow =
      repo ??
      (
        await tx
          .select()
          .from(repositoryTable)
          .where(
            and(
              eq(repositoryTable.namespaceId, ns.id),
              eq(repositoryTable.name, pkg),
            ),
          )
          .limit(1)
      )[0];

    // Upsert artifact (the .tgz blob)
    const [artifact] = await tx
      .insert(artifactTable)
      .values({
        repositoryId: repoRow.id,
        digest,
        size: bytes.byteLength,
        mediaType: NPM_MEDIA_TYPE,
        storagePath,
      })
      .onConflictDoUpdate({
        target: [artifactTable.repositoryId, artifactTable.digest],
        set: { size: bytes.byteLength, mediaType: NPM_MEDIA_TYPE, storagePath },
      })
      .returning();

    // Tag the version
    await tx
      .insert(tagTable)
      .values({
        repositoryId: repoRow.id,
        artifactId: artifact.id,
        name: version,
      })
      .onConflictDoNothing();

    // Version metadata
    await tx.insert(npmMetadataTable).values({
      artifactId: artifact.id,
      name: fullName,
      version,
      manifest,
      shasum,
      integrity,
    });

    // dist-tags (default latest -> this version when none provided)
    const distTags = body["dist-tags"] ?? { latest: version };
    for (const [tag, taggedVersion] of Object.entries(distTags)) {
      await tx
        .insert(npmDistTagTable)
        .values({ repositoryId: repoRow.id, tag, version: taggedVersion })
        .onConflictDoUpdate({
          target: [npmDistTagTable.repositoryId, npmDistTagTable.tag],
          set: { version: taggedVersion },
        });
    }
  });

  if (ns.organizationId) {
    await recordUsage(
      "organization",
      ns.organizationId,
      "storage_bytes",
      bytes.byteLength,
    );
  }

  logAuditEvent(
    { organizationId: ns.organizationId ?? undefined },
    {
      action: "npm.publish",
      resource: "package",
      resourceId: `${fullName}@${version}`,
      details: { namespace: ns.name, package: fullName, version },
    },
  );

  try {
    await events.emit({
      type: "manifold.artifact.published",
      data: {
        name: fullName,
        version,
        namespace: ns.name,
        size: bytes.byteLength,
      },
      organizationId: ns.organizationId ?? "system",
      subject: fullName,
    });
  } catch {
    // Best-effort; never fail a publish on event emission
  }

  set.status = 201;
  return { ok: true, success: true, id: fullName, rev: "1-0" };
};
