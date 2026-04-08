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
  AUTHZ_ENABLED,
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
} = process.env;

export const isDevEnv = NODE_ENV === "development",
  isProdEnv = NODE_ENV === "production",
  hasBilling = !!BILLING_BASE_URL,
  protectRoutes = PROTECT_ROUTES === "true",
  tagRetentionCount = Number.parseInt(TAG_RETENTION_COUNT, 10) || 0,
  maintenanceAllowedNamespaces = MAINTENANCE_ALLOWED_NAMESPACES.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
