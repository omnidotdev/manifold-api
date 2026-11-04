import type { TrustedPublisherSeed } from "lib/oidc/seed";

/**
 * Environment variables.
 */
export const {
  NODE_ENV,
  PORT = 4000,
  // https://stackoverflow.com/a/68578294
  HOST = "0.0.0.0",
  DATABASE_URL,
  AUTH_BASE_URL = "https://localhost:8000",
  /**
   * OIDC claim namespace Gatekeeper prefixes custom claims with. Organization
   * membership arrives under `${CLAIMS_NAMESPACE}/organizations`, never a bare
   * `organizations` key, so the read-scope filter must read this prefix. Default
   * mirrors Gatekeeper's own default (`https://manifold.<TRUSTED_DOMAIN>/@omni/claims`
   * with TRUSTED_DOMAIN=omni.dev); override to match a self-host IdP.
   */
  CLAIMS_NAMESPACE = "https://manifold.omni.dev/@omni/claims",
  GRAPHQL_MAX_COMPLEXITY_COST,
  CORS_ALLOWED_ORIGINS,
  /** Secret for verifying auth webhook signatures */
  AUTH_WEBHOOK_SECRET,
  /** Secret for verifying billing webhook signatures */
  BILLING_WEBHOOK_SECRET,
  /** Billing/entitlements service base URL */
  BILLING_BASE_URL,
  /** Authorization PDP API URL */
  AUTHZ_API_URL,
  /** Enable authorization checks */

  /** Protect GraphQL routes (require authentication) */
  PROTECT_ROUTES,
  /** Default organization ID when billing is not configured */
  DEFAULT_ORG_ID = "default-org",
  /** Provider overrides */
  BILLING_PROVIDER,
  AUTHZ_PROVIDER,
  /** Billing service API key for service-to-service auth */
  BILLING_SERVICE_API_KEY,
  /** Feature flags */
  FLAGS_API_HOST,
  FLAGS_CLIENT_KEY,
  /** Comma-separated namespaces allowed during maintenance */
  MAINTENANCE_ALLOWED_NAMESPACES = "omni",
  /**
   * Enforce per-namespace `mf_` token auth on the OCI registry (`/v2/`), the
   * same model npm/cargo already use: public repos stay anonymously readable,
   * but private reads and all writes require an owning token. Default "false"
   * preserves the fully-open in-cluster behaviour the build pipeline relies on
   * (registry reachable only over the private NodePort). Set "true" ONLY once
   * every pusher (buildkit/kiln) and puller (kubelet imagePullSecret) carries an
   * `mf_` token for its namespace -- otherwise builds/deploys break. Required
   * before any public registry hostname.
   */
  REGISTRY_REQUIRE_AUTH = "false",
  /**
   * Enable vulnerability scanning. Default "false" (inert). When "true", a
   * manifest push enqueues a scan and the background worker runs the scanner
   * (Trivy) against the image. Requires the Trivy binary in the runtime and
   * SCAN_REGISTRY_ENDPOINT set to the address Trivy pulls the image from.
   */
  SCAN_ENABLED = "false",
  /** Registry endpoint Trivy pulls images from, e.g. "10.0.1.10:30501/omni". */
  SCAN_REGISTRY_ENDPOINT,
  /** Trivy `--insecure` (plaintext-HTTP registry, e.g. the NodePort). */
  SCAN_REGISTRY_INSECURE = "false",
  /**
   * Pull-through cache upstreams as JSON mapping a local namespace to an
   * upstream registry base URL, e.g.
   * `{"dockerhub":"https://registry-1.docker.io","ghcr":"https://ghcr.io"}`.
   * A pull of `<namespace>/<repo>` that misses locally is fetched from the
   * upstream, cached, and served. Empty (default) = no mirrors (inert).
   */
  PULL_THROUGH_UPSTREAMS = "{}",
  /**
   * TTL (seconds) before a pull-through-cached TAG is revalidated against its
   * upstream. Mutable tags (e.g. `latest`) can move upstream, so a cached tag
   * older than this is re-fetched on the next pull; if the upstream digest
   * changed the new manifest is cached and the tag repointed. Digest pulls are
   * immutable and never revalidated. Default "0" = never revalidate (cache
   * forever, the prior behaviour).
   */
  PULL_THROUGH_TTL_SECONDS = "0",
  /** Vortex event streaming API URL */
  VORTEX_API_URL,
  /** Vortex event streaming API key */
  VORTEX_API_KEY,
  /** Blob storage backend ("fs" or "s3") */
  BLOB_STORAGE_BACKEND,
  /** Filesystem blob storage directory */
  BLOB_STORAGE_DIR,
  /** S3 bucket name for blob storage */
  BLOB_S3_BUCKET,
  /** S3 region for blob storage */
  BLOB_S3_REGION,
  /** S3 endpoint for blob storage (MinIO, R2) */
  BLOB_S3_ENDPOINT,
  /** S3 key prefix for blob storage */
  BLOB_S3_PREFIX,
  /** Max tags to retain per repository (0 = unlimited) */
  TAG_RETENTION_COUNT = "25",
  /** Enable federation proxy (default "false") */
  FEDERATION_ENABLED = "false",
  /** Auto-approve vetted skills (default "true") */
  FEDERATION_AUTO_APPROVE = "true",
  /** Federation sync interval in ms (default 21600000 / 6h) */
  FEDERATION_SYNC_INTERVAL_MS = "21600000",
  /** JSON array of declarative OIDC trusted-publisher bindings (set by Pulumi) */
  OIDC_TRUSTED_PUBLISHERS = "[]",
  /**
   * Public base URL of this API (e.g. https://api.manifold.omni.dev). Used to
   * recognize requests that arrived via the public gateway (which routes only
   * that hostname here) so anonymous OCI `/v2` writes from the open internet can
   * be refused while REGISTRY_REQUIRE_AUTH is off. The in-cluster build pipeline
   * reaches the registry over a different (NodePort/service) Host and is
   * unaffected.
   */
  PUBLIC_URL,
} = process.env;

/** Parse the PULL_THROUGH_UPSTREAMS JSON into a namespace -> upstream-URL map. */
function parsePullThroughUpstreams(raw: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [ns, url] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof url === "string" && url) out[ns] = url.replace(/\/+$/, "");
    }
    return out;
  } catch {
    return {};
  }
}

/** Parse the OIDC_TRUSTED_PUBLISHERS JSON into validated seed entries. */
function parseTrustedPublishers(raw: string): TrustedPublisherSeed[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is TrustedPublisherSeed =>
        !!e &&
        typeof e === "object" &&
        typeof (e as TrustedPublisherSeed).issuer === "string" &&
        typeof (e as TrustedPublisherSeed).audience === "string" &&
        typeof (e as TrustedPublisherSeed).subject === "string" &&
        typeof (e as TrustedPublisherSeed).namespace === "string",
    );
  } catch {
    return [];
  }
}

export const oidcTrustedPublishers = parseTrustedPublishers(
  OIDC_TRUSTED_PUBLISHERS,
);

export const isDevEnv = NODE_ENV === "development",
  isProdEnv = NODE_ENV === "production",
  hasBilling = !!BILLING_BASE_URL,
  protectRoutes = PROTECT_ROUTES === "true",
  registryRequireAuth = REGISTRY_REQUIRE_AUTH === "true",
  scanEnabled = SCAN_ENABLED === "true",
  scanRegistryEndpoint = SCAN_REGISTRY_ENDPOINT,
  scanRegistryInsecure = SCAN_REGISTRY_INSECURE === "true",
  pullThroughUpstreams = parsePullThroughUpstreams(PULL_THROUGH_UPSTREAMS),
  pullThroughTtlMs =
    (Number.parseInt(PULL_THROUGH_TTL_SECONDS, 10) || 0) * 1000,
  tagRetentionCount = Number.parseInt(TAG_RETENTION_COUNT, 10) || 0,
  maintenanceAllowedNamespaces = MAINTENANCE_ALLOWED_NAMESPACES.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Hostname of the public API URL (e.g. "api.manifold.omni.dev"), or null when
 * PUBLIC_URL is unset. A request whose Host matches this arrived via the public
 * gateway, so anonymous `/v2` writes from it are refused while
 * REGISTRY_REQUIRE_AUTH is off (see isPublicRegistryWrite). The in-cluster build
 * pipeline uses a different Host (NodePort/service DNS) and is never matched.
 */
export const publicRegistryHost = (() => {
  if (!PUBLIC_URL) return null;
  try {
    return new URL(PUBLIC_URL).hostname.toLowerCase();
  } catch {
    return null;
  }
})();

// Startup warnings for optional integrations
if (!BILLING_BASE_URL)
  console.warn("BILLING_BASE_URL not set, billing disabled");
if (!AUTHZ_API_URL)
  console.warn("AUTHZ_API_URL not set, authorization disabled");
if (!FLAGS_API_HOST)
  console.warn("FLAGS_API_HOST not set, feature flags disabled");
if (!VORTEX_API_URL)
  console.warn("VORTEX_API_URL not set, event streaming disabled");
if (!BLOB_S3_BUCKET)
  console.warn("BLOB_S3_BUCKET not set, S3 blob storage disabled");
if (oidcTrustedPublishers.length === 0)
  console.warn(
    "OIDC_TRUSTED_PUBLISHERS not set, OIDC trusted publishing has no bindings",
  );
if (!registryRequireAuth)
  console.warn(
    "REGISTRY_REQUIRE_AUTH not set, OCI registry (/v2) is unauthenticated (safe only behind a private network)",
  );
