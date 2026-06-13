import { and, eq } from "drizzle-orm";

import { recordUsage } from "lib/billing";
import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import { authenticateNpmToken } from "lib/npm/auth";
import { npmError } from "lib/npm/errors";
import { storage } from "lib/storage";

/** Handle `GET /npm/@:scope/:pkg/-/:file` (tarball download). */
export const tarballHandler = async (
  scope: string,
  pkg: string,
  file: string,
  set: { status?: number; headers: Record<string, string> },
  request: Request,
) => {
  // Filename must be `<pkg>-<version>.tgz`
  if (!file.startsWith(`${pkg}-`) || !file.endsWith(".tgz")) {
    set.status = 400;
    return npmError(`invalid tarball filename: ${file}`);
  }
  const version = file.slice(pkg.length + 1, -".tgz".length);

  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, scope))
    .limit(1);
  if (!ns) {
    set.status = 404;
    return npmError("package not found");
  }

  const [repo] = await dbPool
    .select()
    .from(repositoryTable)
    .where(
      and(
        eq(repositoryTable.namespaceId, ns.id),
        eq(repositoryTable.name, pkg),
        eq(repositoryTable.artifactType, "npm"),
      ),
    )
    .limit(1);
  if (!repo) {
    set.status = 404;
    return npmError("package not found");
  }

  // Private packages require a token for the owning namespace
  if (!repo.isPublic) {
    const auth = await authenticateNpmToken(
      request.headers.get("Authorization"),
    );
    if (!auth || auth.namespaceId !== ns.id) {
      set.status = 403;
      return npmError("authentication required for private package");
    }
  }

  const [tagRow] = await dbPool
    .select({ artifact: artifactTable })
    .from(tagTable)
    .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
    .where(and(eq(tagTable.repositoryId, repo.id), eq(tagTable.name, version)))
    .limit(1);
  if (!tagRow) {
    set.status = 404;
    return npmError(`version not found: ${pkg}@${version}`);
  }

  const { artifact } = tagRow;

  if (ns.organizationId) {
    await recordUsage(
      "organization",
      ns.organizationId,
      "bandwidth_bytes",
      artifact.size,
    );
  }

  const blob = artifact.storagePath ? await storage.get(artifact.digest) : null;
  if (!blob) {
    set.status = 404;
    return npmError("tarball blob not found in storage");
  }

  const body = blob.buffer.slice(
    blob.byteOffset,
    blob.byteOffset + blob.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(artifact.size),
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
};
