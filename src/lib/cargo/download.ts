import { and, eq } from "drizzle-orm";

import { recordUsage } from "lib/billing";
import { cargoError } from "lib/cargo/errors";
import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import { storage } from "lib/storage";

/**
 * Handle `GET /api/v1/crates/:crate/:version/download`.
 */
export const downloadHandler = async (
  namespace: string,
  crateName: string,
  version: string,
  set: { status?: number; headers: Record<string, string> },
) => {
  // Find namespace
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespace))
    .limit(1);

  if (!ns) {
    set.status = 404;
    return cargoError("namespace not found");
  }

  // Find repo
  const [repo] = await dbPool
    .select()
    .from(repositoryTable)
    .where(
      and(
        eq(repositoryTable.namespaceId, ns.id),
        eq(repositoryTable.name, crateName),
      ),
    )
    .limit(1);

  if (!repo) {
    set.status = 404;
    return cargoError(`crate not found: ${crateName}`);
  }

  // Find artifact via tag
  const [tagRow] = await dbPool
    .select({ artifact: artifactTable })
    .from(tagTable)
    .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
    .where(and(eq(tagTable.repositoryId, repo.id), eq(tagTable.name, version)))
    .limit(1);

  if (!tagRow) {
    set.status = 404;
    return cargoError(`version not found: ${crateName}@${version}`);
  }

  const { artifact } = tagRow;

  // Record bandwidth for billing
  if (ns.organizationId) {
    await recordUsage(
      "organization",
      ns.organizationId,
      "bandwidth_bytes",
      artifact.size,
    );
  }

  // Stream from blob storage
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
          "Content-Disposition": `attachment; filename="${crateName}-${version}.crate"`,
        },
      });
    }
  }

  set.status = 404;
  return cargoError("crate blob not found in storage");
};
