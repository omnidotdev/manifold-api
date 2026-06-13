import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import {
  namespaceTable,
  npmDistTagTable,
  npmMetadataTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import { authenticateNpmToken } from "lib/npm/auth";
import { npmError } from "lib/npm/errors";

const BASE_URL = process.env.PUBLIC_URL ?? "https://manifold.omni.dev";

interface StoredVersion {
  version: string;
  manifest: Record<string, unknown>;
  shasum: string;
  integrity: string;
  createdAt: string;
}

/** Assemble an npm packument from stored versions. */
export const buildPackument = (
  name: string,
  versions: StoredVersion[],
  distTags: Record<string, string>,
  baseUrl: string,
) => {
  const unscoped = name.split("/")[1] ?? name;
  const versionsMap: Record<string, unknown> = {};
  const time: Record<string, string> = {};
  let created = versions[0]?.createdAt;
  let modified = versions[0]?.createdAt;
  for (const v of versions) {
    versionsMap[v.version] = {
      ...v.manifest,
      name,
      version: v.version,
      dist: {
        shasum: v.shasum,
        integrity: v.integrity,
        tarball: `${baseUrl}/npm/${name}/-/${unscoped}-${v.version}.tgz`,
      },
      _id: `${name}@${v.version}`,
    };
    time[v.version] = v.createdAt;
    if (v.createdAt < (created ?? v.createdAt)) created = v.createdAt;
    if (v.createdAt > (modified ?? v.createdAt)) modified = v.createdAt;
  }
  return {
    _id: name,
    name,
    "dist-tags": distTags,
    versions: versionsMap,
    time: { created, modified, ...time },
  };
};

/** Handle `GET /npm/@:scope/:pkg` (packument: all versions + dist-tags). */
export const packumentHandler = async (
  scope: string,
  pkg: string,
  set: { status?: number; headers: Record<string, string> },
  request: Request,
) => {
  const fullName = `@${scope}/${pkg}`;

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

  const rows = await dbPool
    .select({
      version: npmMetadataTable.version,
      manifest: npmMetadataTable.manifest,
      shasum: npmMetadataTable.shasum,
      integrity: npmMetadataTable.integrity,
      createdAt: npmMetadataTable.createdAt,
    })
    .from(npmMetadataTable)
    .innerJoin(tagTable, eq(tagTable.artifactId, npmMetadataTable.artifactId))
    .where(eq(tagTable.repositoryId, repo.id));

  if (rows.length === 0) {
    set.status = 404;
    return npmError("package not found");
  }

  const versions: StoredVersion[] = rows.map((r) => ({
    version: r.version,
    manifest: r.manifest as Record<string, unknown>,
    shasum: r.shasum,
    integrity: r.integrity,
    createdAt: String(r.createdAt),
  }));

  const distTagRows = await dbPool
    .select({
      tag: npmDistTagTable.tag,
      version: npmDistTagTable.version,
    })
    .from(npmDistTagTable)
    .where(eq(npmDistTagTable.repositoryId, repo.id));
  const distTags: Record<string, string> = {};
  for (const row of distTagRows) distTags[row.tag] = row.version;

  const packument = buildPackument(fullName, versions, distTags, BASE_URL);
  const json = JSON.stringify(packument);
  const etag = `"${Bun.hash(json).toString(16)}"`;

  if (request.headers.get("If-None-Match") === etag) {
    set.status = 304;
    return null;
  }

  set.headers.ETag = etag;
  set.headers["Content-Type"] = "application/json";
  return packument;
};
