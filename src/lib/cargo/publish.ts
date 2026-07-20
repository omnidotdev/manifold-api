// src/lib/cargo/publish.ts
import { and, eq } from "drizzle-orm";

import {
  enforcePrivateRepoLimit,
  enforceUsageLimit,
  recordUsage,
} from "lib/billing";
import { requireCargoWrite } from "lib/cargo/auth";
import { cargoError } from "lib/cargo/errors";
import { isValidCrateName } from "lib/cargo/prefix";
import { parsePublishBody } from "lib/cargo/wireFormat";
import { dbPool } from "lib/db";
import {
  artifactTable,
  cargoMetadataTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";
import { computeDigest } from "lib/oci/digest";
import { events } from "lib/providers";
import { storage } from "lib/storage";

const CARGO_MEDIA_TYPE = "application/vnd.omni.cargo.crate";

/**
 * Handle `PUT /api/v1/crates/new`.
 */
export const publishHandler = async (
  namespace: string,
  request: Request,
  set: { status?: number; headers: Record<string, string> },
) => {
  // Authenticate
  let auth: Awaited<ReturnType<typeof requireCargoWrite>>;
  try {
    auth = await requireCargoWrite(request.headers.get("Authorization"));
  } catch (e: unknown) {
    set.status = 403;
    return cargoError((e as Error).message);
  }

  // Parse wire format body
  let parsed: ReturnType<typeof parsePublishBody>;
  try {
    const body = await request.arrayBuffer();
    parsed = parsePublishBody(body);
  } catch (e: unknown) {
    set.status = 400;
    return cargoError(`invalid publish body: ${(e as Error).message}`);
  }

  const { metadata, crateBytes } = parsed;

  // Validate crate name
  if (!isValidCrateName(metadata.name)) {
    set.status = 400;
    return cargoError(`invalid crate name: ${metadata.name}`);
  }

  // Validate semver
  if (
    !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/.test(metadata.vers)
  ) {
    set.status = 400;
    return cargoError(`invalid version: ${metadata.vers}`);
  }

  // Validate checksum
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(crateBytes);
  const actualCksum = hasher.digest("hex");

  if (metadata.cksum && metadata.cksum !== actualCksum) {
    set.status = 400;
    return cargoError(
      `checksum mismatch: expected ${metadata.cksum}, got ${actualCksum}`,
    );
  }

  // Resolve namespace from token
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);

  if (!ns) {
    set.status = 403;
    return cargoError("namespace not found for token");
  }

  // Verify token namespace matches URL namespace
  if (ns.name !== namespace) {
    set.status = 403;
    return cargoError("token not authorized for this namespace");
  }

  // Check for duplicate version
  const [existing] = await dbPool
    .select({ id: cargoMetadataTable.id })
    .from(cargoMetadataTable)
    .where(
      and(
        eq(cargoMetadataTable.name, metadata.name),
        eq(cargoMetadataTable.vers, metadata.vers),
      ),
    )
    .limit(1);

  if (existing) {
    set.status = 409;
    return cargoError(
      `crate \`${metadata.name}@${metadata.vers}\` already exists`,
    );
  }

  // A brand-new crate creates a PRIVATE repo (an existing crate's new version
  // does not), so enforce the org's private-repo limit only when it's new.
  if (ns.organizationId) {
    const [existingRepo] = await dbPool
      .select({ id: repositoryTable.id })
      .from(repositoryTable)
      .where(
        and(
          eq(repositoryTable.namespaceId, ns.id),
          eq(repositoryTable.name, metadata.name),
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
  }

  // Enforce the storage quota before consuming space.
  if (ns.organizationId) {
    const overLimit = await enforceUsageLimit(
      ns.organizationId,
      "storage_bytes",
      "Storage",
      crateBytes.byteLength,
    );
    if (overLimit) {
      set.status = overLimit.status;
      return overLimit.body;
    }
  }

  // Store .crate tarball in blob storage
  const digest = await computeDigest(crateBytes);
  const storagePath = await storage.put(digest, crateBytes);

  // Create all records in a single transaction
  await dbPool.transaction(async (tx) => {
    // Upsert repository
    const [repo] = await tx
      .insert(repositoryTable)
      .values({
        namespaceId: ns.id,
        name: metadata.name,
        artifactType: "cargo",
        isPublic: false,
      })
      .onConflictDoNothing({
        target: [repositoryTable.namespaceId, repositoryTable.name],
      })
      .returning();

    // If conflict, fetch existing
    const txRepoRow =
      repo ??
      (
        await tx
          .select()
          .from(repositoryTable)
          .where(
            and(
              eq(repositoryTable.namespaceId, ns.id),
              eq(repositoryTable.name, metadata.name),
            ),
          )
          .limit(1)
      )[0];

    // Insert artifact
    const [artifact] = await tx
      .insert(artifactTable)
      .values({
        repositoryId: txRepoRow.id,
        digest,
        size: crateBytes.byteLength,
        mediaType: CARGO_MEDIA_TYPE,
        storagePath,
      })
      .onConflictDoUpdate({
        target: [artifactTable.repositoryId, artifactTable.digest],
        set: {
          size: crateBytes.byteLength,
          mediaType: CARGO_MEDIA_TYPE,
          storagePath,
        },
      })
      .returning();

    // Insert tag (version string)
    await tx
      .insert(tagTable)
      .values({
        repositoryId: txRepoRow.id,
        artifactId: artifact.id,
        name: metadata.vers,
      })
      .onConflictDoNothing();

    // Insert cargo metadata
    await tx.insert(cargoMetadataTable).values({
      artifactId: artifact.id,
      name: metadata.name,
      vers: metadata.vers,
      deps: metadata.deps ?? [],
      features: metadata.features ?? {},
      cksum: actualCksum,
      links: metadata.links ?? null,
      rustVersion: metadata.rust_version ?? null,
    });
  });

  // Record billing
  if (ns.organizationId) {
    await recordUsage(
      "organization",
      ns.organizationId,
      "storage_bytes",
      crateBytes.byteLength,
    );
  }

  logAuditEvent(
    { organizationId: ns.organizationId ?? undefined },
    {
      action: "cargo.publish",
      resource: "crate",
      resourceId: `${metadata.name}@${metadata.vers}`,
      details: {
        namespace: ns.name,
        crate: metadata.name,
        version: metadata.vers,
        size: crateBytes.byteLength,
      },
    },
  );

  try {
    await events.emit({
      type: "manifold.artifact.published",
      data: {
        crateName: metadata.name,
        version: metadata.vers,
        namespace: ns.name,
        size: crateBytes.byteLength,
      },
      organizationId: ns.organizationId ?? "system",
      subject: metadata.name,
    });
  } catch {
    // Event emission is best-effort; do not fail the publish
  }

  return {
    warnings: {
      invalid_categories: [],
      invalid_badges: [],
      other: [],
    },
  };
};
