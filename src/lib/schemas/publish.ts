import { and, eq } from "drizzle-orm";

import { requireRegistryWrite } from "lib/auth/registryToken";
import {
  enforcePrivateRepoLimit,
  enforceStorageLimit,
  recordUsage,
} from "lib/billing";
import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  schemaMetadataTable,
  tagTable,
} from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";
import { computeDigest } from "lib/oci/digest";
import { events } from "lib/providers";
import { schemaError } from "lib/schemas/errors";
import { SCHEMA_MEDIA_TYPES, validateSchema } from "lib/schemas/validate";
import { storage } from "lib/storage";

import type { SchemaFormat } from "lib/schemas/validate";

type HandlerSet = { status?: number; headers: Record<string, string> };

/** Schema names mirror repository names: lowercase, dot/dash/underscore. */
const isValidSchemaName = (name: string): boolean =>
  /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(name) && name.length <= 128;

/**
 * Handle `PUT /schema/:namespace/:name/:version?format=<format>`.
 *
 * Publishes a schema document (OpenAPI, GraphQL SDL, or JSON Schema). The body
 * is the raw schema; validity is recorded but never blocks the publish, so an
 * invalid schema is still stored with its validation errors for inspection.
 */
export const publishHandler = async (
  namespace: string,
  name: string,
  version: string,
  format: SchemaFormat,
  request: Request,
  set: HandlerSet,
) => {
  let auth: Awaited<ReturnType<typeof requireRegistryWrite>>;
  try {
    auth = await requireRegistryWrite(request.headers.get("Authorization"));
  } catch (e) {
    set.status = 403;
    return schemaError((e as Error).message);
  }

  if (!isValidSchemaName(name)) {
    set.status = 400;
    return schemaError(`invalid schema name: ${name}`);
  }

  const body = await request.arrayBuffer();
  const bytes = new Uint8Array(body);
  if (bytes.byteLength === 0) {
    set.status = 400;
    return schemaError("empty schema body");
  }
  const content = new TextDecoder().decode(bytes);

  const validation = validateSchema(format, content);

  // Resolve namespace from token and verify it matches the URL
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);

  if (!ns) {
    set.status = 403;
    return schemaError("namespace not found for token");
  }
  if (ns.name !== namespace) {
    set.status = 403;
    return schemaError("token not authorized for this namespace");
  }

  // Duplicate version check (immutable versions)
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

  if (existingRepo) {
    const [existingTag] = await dbPool
      .select({ id: tagTable.id })
      .from(tagTable)
      .where(
        and(
          eq(tagTable.repositoryId, existingRepo.id),
          eq(tagTable.name, version),
        ),
      )
      .limit(1);
    if (existingTag) {
      set.status = 409;
      return schemaError(`schema \`${name}@${version}\` already exists`);
    }
  }

  // A brand-new schema creates a private repo, so enforce the private-repo cap
  if (ns.organizationId && !existingRepo) {
    const limitError = await enforcePrivateRepoLimit(ns.organizationId);
    if (limitError) {
      set.status = limitError.status;
      return limitError.body;
    }
  }

  if (ns.organizationId) {
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
  const mediaType = SCHEMA_MEDIA_TYPES[format];

  await dbPool.transaction(async (tx) => {
    const [repo] = await tx
      .insert(repositoryTable)
      .values({
        namespaceId: ns.id,
        name,
        artifactType: format,
        isPublic: false,
      })
      .onConflictDoNothing({
        target: [repositoryTable.namespaceId, repositoryTable.name],
      })
      .returning();

    const txRepoRow =
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
        repositoryId: txRepoRow.id,
        digest,
        size: bytes.byteLength,
        mediaType,
        storagePath,
      })
      .onConflictDoUpdate({
        target: [artifactTable.repositoryId, artifactTable.digest],
        set: { size: bytes.byteLength, mediaType, storagePath },
      })
      .returning();

    await tx
      .insert(tagTable)
      .values({
        repositoryId: txRepoRow.id,
        artifactId: artifact.id,
        name: version,
      })
      .onConflictDoNothing();

    await tx
      .insert(schemaMetadataTable)
      .values({
        artifactId: artifact.id,
        version,
        title: validation.title,
        isValid: validation.isValid,
        validationErrors: validation.validationErrors.length
          ? validation.validationErrors
          : null,
      })
      .onConflictDoNothing();
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
      action: "schema.publish",
      resource: "schema",
      resourceId: `${name}@${version}`,
      details: {
        namespace: ns.name,
        schema: name,
        version,
        format,
        isValid: validation.isValid,
        size: bytes.byteLength,
      },
    },
  );

  try {
    await events.emit({
      type: "manifold.artifact.published",
      data: {
        schemaName: name,
        version,
        format,
        namespace: ns.name,
        isValid: validation.isValid,
        size: bytes.byteLength,
      },
      organizationId: ns.organizationId ?? "system",
      subject: name,
    });
  } catch {
    // Event emission is best-effort; do not fail the publish
  }

  set.status = 201;
  return {
    name,
    version,
    format,
    valid: validation.isValid,
    validationErrors: validation.validationErrors,
  };
};
