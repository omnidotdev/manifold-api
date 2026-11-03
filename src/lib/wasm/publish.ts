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
  tagTable,
  wasmMetadataTable,
} from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";
import { computeDigest } from "lib/oci/digest";
import { events } from "lib/providers";
import { storage } from "lib/storage";
import { wasmError } from "lib/wasm/errors";
import { parseWasm } from "lib/wasm/parse";

type HandlerSet = { status?: number; headers: Record<string, string> };

const WASM_MEDIA_TYPE = "application/wasm";

const isValidModuleName = (name: string): boolean =>
  /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(name) && name.length <= 128;

/**
 * Handle `PUT /wasm/:namespace/:name/:version`.
 *
 * Publishes a WebAssembly module. The binary is validated and its
 * exports/imports/runtime are extracted; a non-WASM or malformed binary is
 * rejected.
 */
export const publishHandler = async (
  namespace: string,
  name: string,
  version: string,
  request: Request,
  set: HandlerSet,
) => {
  let auth: Awaited<ReturnType<typeof requireRegistryWrite>>;
  try {
    auth = await requireRegistryWrite(request.headers.get("Authorization"));
  } catch (e) {
    set.status = 403;
    return wasmError((e as Error).message);
  }

  if (!isValidModuleName(name)) {
    set.status = 400;
    return wasmError(`invalid module name: ${name}`);
  }

  const body = await request.arrayBuffer();
  const bytes = new Uint8Array(body);
  if (bytes.byteLength === 0) {
    set.status = 400;
    return wasmError("empty module body");
  }

  const parsed = parseWasm(bytes);
  if (!parsed.valid) {
    set.status = 400;
    return wasmError(`invalid WebAssembly module: ${parsed.error}`);
  }

  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);

  if (!ns) {
    set.status = 403;
    return wasmError("namespace not found for token");
  }
  if (ns.name !== namespace) {
    set.status = 403;
    return wasmError("token not authorized for this namespace");
  }

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
      return wasmError(`module \`${name}@${version}\` already exists`);
    }
  }

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

  await dbPool.transaction(async (tx) => {
    const [repo] = await tx
      .insert(repositoryTable)
      .values({
        namespaceId: ns.id,
        name,
        artifactType: "wasm",
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
        mediaType: WASM_MEDIA_TYPE,
        storagePath,
      })
      .onConflictDoUpdate({
        target: [artifactTable.repositoryId, artifactTable.digest],
        set: {
          size: bytes.byteLength,
          mediaType: WASM_MEDIA_TYPE,
          storagePath,
        },
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
      .insert(wasmMetadataTable)
      .values({
        artifactId: artifact.id,
        runtime: parsed.runtime,
        exports: parsed.exports,
        imports: parsed.imports,
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
      action: "wasm.publish",
      resource: "wasm",
      resourceId: `${name}@${version}`,
      details: {
        namespace: ns.name,
        module: name,
        version,
        runtime: parsed.runtime,
        size: bytes.byteLength,
      },
    },
  );

  try {
    await events.emit({
      type: "manifold.artifact.published",
      data: {
        moduleName: name,
        version,
        runtime: parsed.runtime,
        namespace: ns.name,
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
    runtime: parsed.runtime,
    exports: parsed.exports.length,
    imports: parsed.imports.length,
  };
};
