/**
 * @file Handle Twine uploads: `POST /pypi/:namespace/`.
 */

import { and, eq } from "drizzle-orm";

import {
  enforcePrivateRepoLimit,
  enforceStorageLimit,
  recordUsage,
} from "lib/billing";
import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  pypiMetadataTable,
  repositoryTable,
} from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";
import { computeDigest } from "lib/oci/digest";
import { events } from "lib/providers";
import { requirePypiWrite } from "lib/pypi/auth";
import { parseFilename } from "lib/pypi/metadata";
import { isValidProjectName, normalizeProjectName } from "lib/pypi/normalize";
import { storage } from "lib/storage";

const PYPI_MEDIA_TYPE = "application/vnd.omni.pypi.file";

/** Parsed multipart form, as exposed by Elysia for `multipart/form-data` */
type UploadBody = Record<string, unknown>;

const str = (body: UploadBody, key: string): string | null => {
  const v = body[key];
  return typeof v === "string" ? v : null;
};

const isFile = (v: unknown): v is Blob & { name?: string } =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Blob).arrayBuffer === "function";

/** Handle a Twine `file_upload` multipart POST (Elysia-parsed body). */
export const uploadHandler = async (
  namespace: string,
  body: UploadBody,
  authHeader: string | null,
  set: { status?: number; headers: Record<string, string> },
) => {
  let auth: Awaited<ReturnType<typeof requirePypiWrite>>;
  try {
    auth = await requirePypiWrite(authHeader);
  } catch (e: unknown) {
    set.status = 403;
    return (e as Error).message;
  }

  if (str(body, ":action") !== "file_upload") {
    set.status = 400;
    return "unsupported :action (expected file_upload)";
  }

  const declaredName = str(body, "name");
  const version = str(body, "version");
  const content = body.content;

  if (!declaredName || !version || !isFile(content)) {
    set.status = 400;
    return "missing required fields: name, version, content";
  }

  if (!isValidProjectName(declaredName)) {
    set.status = 400;
    return `invalid project name: ${declaredName}`;
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9.!+_-]*$/.test(version)) {
    set.status = 400;
    return `invalid version: ${version}`;
  }

  const name = normalizeProjectName(declaredName);
  const filename = typeof content.name === "string" ? content.name : "";
  if (!filename) {
    set.status = 400;
    return "uploaded file is missing a filename";
  }

  // Cross-check the filename against the declared name/version
  let parsed: ReturnType<typeof parseFilename>;
  try {
    parsed = parseFilename(filename);
  } catch (e: unknown) {
    set.status = 400;
    return (e as Error).message;
  }
  if (parsed.name !== name) {
    set.status = 400;
    return `filename project (${parsed.name}) does not match name (${name})`;
  }

  const bytes = new Uint8Array(await content.arrayBuffer());

  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(bytes);
  const sha256 = hasher.digest("hex");

  const declaredSha = str(body, "sha256_digest");
  if (declaredSha && declaredSha.toLowerCase() !== sha256) {
    set.status = 400;
    return `sha256 mismatch: declared ${declaredSha}, got ${sha256}`;
  }

  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);

  if (!ns) {
    set.status = 403;
    return "namespace not found for token";
  }
  if (ns.name !== namespace) {
    set.status = 403;
    return "token not authorized for this namespace";
  }

  // Distribution files are immutable: a filename may be uploaded once
  const [existing] = await dbPool
    .select({ id: pypiMetadataTable.id })
    .from(pypiMetadataTable)
    .where(
      and(
        eq(pypiMetadataTable.name, name),
        eq(pypiMetadataTable.filename, filename),
      ),
    )
    .limit(1);

  if (existing) {
    set.status = 400;
    return `File already exists (${filename})`;
  }

  // A brand-new project creates a private repo; enforce the private-repo limit
  // only then, and the storage cap on every upload.
  if (ns.organizationId) {
    const [existingRepo] = await dbPool
      .select({ id: repositoryTable.id })
      .from(repositoryTable)
      .where(
        and(
          eq(repositoryTable.namespaceId, ns.id),
          eq(repositoryTable.name, name),
        ),
      )
      .limit(1);
    if (!existingRepo) {
      const limitError = await enforcePrivateRepoLimit(ns.organizationId);
      if (limitError) {
        set.status = limitError.status;
        return limitError.body;
      }
    }

    const overLimit = await enforceStorageLimit(
      ns.organizationId,
      bytes.byteLength,
    );
    if (overLimit) {
      set.status = overLimit.status;
      return overLimit.body;
    }
  }

  const digest = await computeDigest(bytes);
  const storagePath = await storage.put(digest, bytes);

  const rawRequiresDist = body.requires_dist;
  const requiresDist = (
    Array.isArray(rawRequiresDist) ? rawRequiresDist : [rawRequiresDist]
  ).filter((v): v is string => typeof v === "string");

  await dbPool.transaction(async (tx) => {
    const [repo] = await tx
      .insert(repositoryTable)
      .values({
        namespaceId: ns.id,
        name,
        artifactType: "pypi",
        isPublic: false,
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
              eq(repositoryTable.name, name),
            ),
          )
          .limit(1)
      )[0];

    const [artifact] = await tx
      .insert(artifactTable)
      .values({
        repositoryId: repoRow.id,
        digest,
        size: bytes.byteLength,
        mediaType: PYPI_MEDIA_TYPE,
        storagePath,
      })
      .onConflictDoUpdate({
        target: [artifactTable.repositoryId, artifactTable.digest],
        set: {
          size: bytes.byteLength,
          mediaType: PYPI_MEDIA_TYPE,
          storagePath,
        },
      })
      .returning();

    await tx.insert(pypiMetadataTable).values({
      artifactId: artifact.id,
      name,
      version,
      filename,
      filetype: str(body, "filetype") ?? parsed.filetype,
      pythonVersion: str(body, "pyversion"),
      requiresPython: str(body, "requires_python"),
      requiresDist,
      metadataVersion: str(body, "metadata_version"),
      summary: str(body, "summary"),
      sha256,
      blake2_256: str(body, "blake2_256_digest"),
    });
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
      action: "pypi.publish",
      resource: "distribution",
      resourceId: filename,
      details: {
        namespace: ns.name,
        name,
        version,
        filename,
        size: bytes.byteLength,
      },
    },
  );

  try {
    await events.emit({
      type: "manifold.artifact.published",
      data: {
        name,
        version,
        filename,
        namespace: ns.name,
        size: bytes.byteLength,
      },
      organizationId: ns.organizationId ?? "system",
      subject: name,
    });
  } catch {
    // best-effort
  }

  set.status = 200;
  return "OK";
};
