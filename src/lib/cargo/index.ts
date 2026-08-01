import { and, eq } from "drizzle-orm";

import { cargoError } from "lib/cargo/errors";
import { splitCargoFeatures } from "lib/cargo/features";
import { cratePrefix } from "lib/cargo/prefix";
import { dbPool } from "lib/db";
import {
  artifactTable,
  cargoMetadataTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";

/**
 * Sparse index config endpoint.
 *
 * Returns the registry configuration Cargo needs to locate
 * the download and API endpoints.
 */
export const configHandler = (namespace: string, baseUrl: string) => ({
  dl: `${baseUrl}/cargo/${namespace}/api/v1/crates`,
  api: `${baseUrl}/cargo/${namespace}`,
});

/**
 * Sparse index lookup handler.
 *
 * Returns newline-delimited JSON, one line per published version.
 */
export const indexLookup = async (
  namespace: string,
  prefix: string,
  crateName: string,
  set: { status?: number },
  request?: Request,
) => {
  // Validate prefix matches the crate name
  const expectedPrefix = cratePrefix(crateName);
  if (prefix !== expectedPrefix) {
    set.status = 404;
    return cargoError(`invalid prefix for crate: expected ${expectedPrefix}`);
  }

  // Find the namespace
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespace))
    .limit(1);

  if (!ns) {
    set.status = 404;
    return cargoError(`namespace not found: ${namespace}`);
  }

  // Find the repository (crate)
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
    return "";
  }

  // Fetch all versions scoped to this repo (via tag → artifact join)
  const versions = await dbPool
    .select({ meta: cargoMetadataTable })
    .from(cargoMetadataTable)
    .innerJoin(
      artifactTable,
      eq(cargoMetadataTable.artifactId, artifactTable.id),
    )
    .innerJoin(tagTable, eq(tagTable.artifactId, artifactTable.id))
    .where(eq(tagTable.repositoryId, repo.id));

  if (versions.length === 0) {
    set.status = 404;
    return "";
  }

  // Build ndjson response. Features that use `dep:`/`?/` syntax must go in
  // `features2` (with `v` >= 2), or Cargo rejects the entry as invalid.
  const lines = versions.map((v) => {
    const { features, features2 } = splitCargoFeatures(
      v.meta.features as Record<string, string[]> | null,
    );
    const hasExtended = Object.keys(features2).length > 0;
    return JSON.stringify({
      name: v.meta.name,
      vers: v.meta.vers,
      deps: v.meta.deps,
      features,
      cksum: v.meta.cksum,
      yanked: v.meta.yanked,
      links: v.meta.links,
      rust_version: v.meta.rustVersion,
      ...(hasExtended ? { features2 } : {}),
      v: hasExtended ? 2 : (v.meta.v ?? 1),
    });
  });

  const body = lines.join("\n");
  const etag = `"${Bun.hash(body).toString(16)}"`;

  // Support conditional requests
  const ifNoneMatch = request?.headers.get("If-None-Match");
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "max-age=60",
      ETag: etag,
    },
  });
};
