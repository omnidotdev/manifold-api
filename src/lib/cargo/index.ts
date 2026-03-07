import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import {
  cargoMetadataTable,
  namespaceTable,
  repositoryTable,
} from "lib/db/schema";
import { cargoError } from "lib/cargo/errors";
import { cratePrefix } from "lib/cargo/prefix";

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

  // Fetch all versions
  const versions = await dbPool
    .select()
    .from(cargoMetadataTable)
    .where(eq(cargoMetadataTable.name, crateName));

  if (versions.length === 0) {
    set.status = 404;
    return "";
  }

  // Build ndjson response
  const lines = versions.map((v) =>
    JSON.stringify({
      name: v.name,
      vers: v.vers,
      deps: v.deps,
      features: v.features,
      cksum: v.cksum,
      yanked: v.yanked,
      links: v.links,
      rust_version: v.rustVersion,
      v: v.v,
    }),
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "max-age=60",
      ETag: `"${Bun.hash(lines.join("\n")).toString(16)}"`,
    },
  });
};
