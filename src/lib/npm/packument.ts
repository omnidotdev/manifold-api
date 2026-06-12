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
