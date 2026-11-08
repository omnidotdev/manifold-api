/**
 * @file Serve a distribution file (wheel or sdist) by filename.
 */

import { and, eq } from "drizzle-orm";

import { enforceUsageLimit, recordUsage } from "lib/billing";
import { dbPool } from "lib/db";
import { recordDownload } from "lib/db/recordDownload";
import {
  artifactTable,
  namespaceTable,
  pypiMetadataTable,
  repositoryTable,
} from "lib/db/schema";
import { authenticatePypi } from "lib/pypi/auth";
import { normalizeProjectName } from "lib/pypi/normalize";
import { storage } from "lib/storage";

/** Handle `GET /pypi/:namespace/files/:project/:filename`. */
export const downloadHandler = async (
  namespace: string,
  project: string,
  filename: string,
  set: { status?: number; headers: Record<string, string> },
  request?: Request,
) => {
  const name = normalizeProjectName(project);

  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespace))
    .limit(1);

  if (!ns) {
    set.status = 404;
    return "namespace not found";
  }

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

  if (!repo) {
    set.status = 404;
    return "project not found";
  }

  // Private repositories require a token scoped to the namespace
  if (!repo.isPublic) {
    const auth = await authenticatePypi(
      request?.headers.get("Authorization") ?? null,
    );
    if (!auth || auth.namespaceId !== ns.id) {
      set.status = 403;
      return "authentication required for private projects";
    }
  }

  const [row] = await dbPool
    .select({ artifact: artifactTable })
    .from(pypiMetadataTable)
    .innerJoin(
      artifactTable,
      eq(pypiMetadataTable.artifactId, artifactTable.id),
    )
    .where(
      and(
        eq(artifactTable.repositoryId, repo.id),
        eq(pypiMetadataTable.filename, filename),
      ),
    )
    .limit(1);

  if (!row) {
    set.status = 404;
    return "file not found";
  }

  const { artifact } = row;

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
          "Content-Type": "application/octet-stream",
          "Content-Length": String(artifact.size),
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  }

  set.status = 404;
  return "file blob not found in storage";
};
