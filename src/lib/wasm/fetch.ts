import { and, desc, eq } from "drizzle-orm";

import { authenticateRegistryToken } from "lib/auth/registryToken";
import { enforceUsageLimit, recordUsage } from "lib/billing";
import { dbPool } from "lib/db";
import { recordDownload } from "lib/db/recordDownload";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
  wasmMetadataTable,
} from "lib/db/schema";
import { storage } from "lib/storage";
import { wasmError } from "lib/wasm/errors";

type HandlerSet = { status?: number; headers: Record<string, string> };

const resolveRepo = async (
  namespace: string,
  name: string,
  authHeader: string | null,
) => {
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespace))
    .limit(1);
  if (!ns)
    return {
      ok: false as const,
      error: "namespace not found" as const,
      status: 404,
    };

  const [repo] = await dbPool
    .select()
    .from(repositoryTable)
    .where(
      and(
        eq(repositoryTable.namespaceId, ns.id),
        eq(repositoryTable.name, name),
      ),
    )
    .limit(1);
  if (!repo)
    return {
      ok: false as const,
      error: `module not found: ${name}` as const,
      status: 404,
    };

  if (!repo.isPublic) {
    const auth = await authenticateRegistryToken(authHeader);
    if (!auth || auth.namespaceId !== ns.id) {
      return {
        ok: false as const,
        error: "authentication required" as const,
        status: 403,
      };
    }
  }

  return { ok: true as const, ns, repo };
};

/**
 * Handle `GET /wasm/:namespace/:name` — list versions with runtime + metadata.
 */
export const listHandler = async (
  namespace: string,
  name: string,
  set: HandlerSet,
  request?: Request,
) => {
  const resolved = await resolveRepo(
    namespace,
    name,
    request?.headers.get("Authorization") ?? null,
  );
  if (!resolved.ok) {
    set.status = resolved.status;
    return wasmError(resolved.error);
  }
  const { repo } = resolved;

  const rows = await dbPool
    .select({
      version: tagTable.name,
      createdAt: tagTable.createdAt,
      runtime: wasmMetadataTable.runtime,
      exports: wasmMetadataTable.exports,
      imports: wasmMetadataTable.imports,
    })
    .from(tagTable)
    .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
    .leftJoin(
      wasmMetadataTable,
      eq(wasmMetadataTable.artifactId, artifactTable.id),
    )
    .where(eq(tagTable.repositoryId, repo.id))
    .orderBy(desc(tagTable.createdAt));

  return { name: repo.name, isPublic: repo.isPublic, versions: rows };
};

/**
 * Handle `GET /wasm/:namespace/:name/:version` — download the module.
 */
export const fetchHandler = async (
  namespace: string,
  name: string,
  version: string,
  set: HandlerSet,
  request?: Request,
) => {
  const resolved = await resolveRepo(
    namespace,
    name,
    request?.headers.get("Authorization") ?? null,
  );
  if (!resolved.ok) {
    set.status = resolved.status;
    return wasmError(resolved.error);
  }
  const { ns, repo } = resolved;

  const [tagRow] = await dbPool
    .select({ artifact: artifactTable })
    .from(tagTable)
    .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
    .where(and(eq(tagTable.repositoryId, repo.id), eq(tagTable.name, version)))
    .limit(1);

  if (!tagRow) {
    set.status = 404;
    return wasmError(`version not found: ${name}@${version}`);
  }

  const { artifact } = tagRow;

  if (ns.organizationId) {
    const overLimit = await enforceUsageLimit(
      ns.organizationId,
      "bandwidth_bytes",
      "Bandwidth",
      artifact.size,
    );
    if (overLimit) {
      set.status = overLimit.status;
      return overLimit.body;
    }
    await recordUsage(
      "organization",
      ns.organizationId,
      "bandwidth_bytes",
      artifact.size,
    );
  }

  recordDownload(repo.id);

  if (artifact.storagePath) {
    const blob = await storage.get(artifact.digest);
    if (blob) {
      const body = blob.buffer.slice(
        blob.byteOffset,
        blob.byteOffset + blob.byteLength,
      ) as ArrayBuffer;
      return new Response(body, {
        headers: {
          "Content-Type": "application/wasm",
          "Content-Length": String(artifact.size),
          "Content-Disposition": `attachment; filename="${name}-${version}.wasm"`,
        },
      });
    }
  }

  set.status = 404;
  return wasmError("module blob not found in storage");
};
