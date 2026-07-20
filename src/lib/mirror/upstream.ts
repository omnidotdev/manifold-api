import { pullThroughUpstreams } from "lib/config/env.config";

/** The upstream registry base URL a namespace mirrors, or null if not a mirror. */
export const resolveUpstream = (namespace: string): string | null =>
  pullThroughUpstreams[namespace] ?? null;

const MANIFEST_ACCEPT = [
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
].join(", ");

/** Parse a `WWW-Authenticate: Bearer realm=...,service=...,scope=...` header. */
const parseChallenge = (header: string): Record<string, string> | null => {
  if (!/^Bearer\s/i.test(header)) return null;
  const params: Record<string, string> = {};
  for (const match of header
    .slice("Bearer".length)
    .matchAll(/(\w+)="([^"]*)"/g)) {
    params[match[1]] = match[2];
  }
  return params.realm ? params : null;
};

/** Exchange a Bearer challenge for a pull token (the Docker registry auth dance). */
const fetchBearerToken = async (header: string): Promise<string | null> => {
  const params = parseChallenge(header);
  if (!params) return null;
  const query = new URLSearchParams();
  if (params.service) query.set("service", params.service);
  if (params.scope) query.set("scope", params.scope);
  const url = query.size ? `${params.realm}?${query.toString()}` : params.realm;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const body = (await res.json()) as {
      token?: string;
      access_token?: string;
    };
    return body.token ?? body.access_token ?? null;
  } catch {
    return null;
  }
};

/**
 * Fetch an upstream URL, performing the Bearer token dance: try anonymously,
 * then on a 401 challenge get a token and retry once. Returns null on any
 * network error (the caller falls back to a normal 404).
 */
const upstreamFetch = async (
  url: string,
  accept: string,
): Promise<Response | null> => {
  try {
    const first = await fetch(url, { headers: { Accept: accept } });
    if (first.status !== 401) return first;
    const token = await fetchBearerToken(
      first.headers.get("www-authenticate") ?? "",
    );
    if (!token) return first;
    return await fetch(url, {
      headers: { Accept: accept, Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
};

interface UpstreamManifest {
  content: Uint8Array;
  mediaType: string;
  /** Upstream-reported content digest (may be empty if the header is absent). */
  digest: string;
}

/** Fetch a manifest (by tag or digest) from an upstream registry. */
export const fetchUpstreamManifest = async (
  upstream: string,
  repoPath: string,
  reference: string,
): Promise<UpstreamManifest | null> => {
  const res = await upstreamFetch(
    `${upstream}/v2/${repoPath}/manifests/${reference}`,
    MANIFEST_ACCEPT,
  );
  if (!res?.ok) return null;
  return {
    content: new Uint8Array(await res.arrayBuffer()),
    mediaType:
      res.headers.get("content-type") ??
      "application/vnd.oci.image.manifest.v1+json",
    digest: res.headers.get("docker-content-digest") ?? "",
  };
};

/** Fetch a blob (by digest) from an upstream registry. */
export const fetchUpstreamBlob = async (
  upstream: string,
  repoPath: string,
  digest: string,
): Promise<Uint8Array | null> => {
  const res = await upstreamFetch(
    `${upstream}/v2/${repoPath}/blobs/${digest}`,
    "application/octet-stream",
  );
  if (!res?.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
};
