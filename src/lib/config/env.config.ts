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
  /** Self-hosted mode flag */
  SELF_HOSTED,
  /** Default organization ID for self-hosted mode */
  DEFAULT_ORG_ID = "default-org",
  /** Provider overrides (default based on SELF_HOSTED) */
  BILLING_PROVIDER,
  AUTHZ_PROVIDER,
  /** Billing service API key for service-to-service auth */
  BILLING_SERVICE_API_KEY,
  /** Feature flags */
  FLAGS_API_HOST,
  FLAGS_CLIENT_KEY,
  /** Comma-separated namespaces allowed during maintenance */
  MAINTENANCE_ALLOWED_NAMESPACES = "omni",
} = process.env;

export const isDevEnv = NODE_ENV === "development",
  isProdEnv = NODE_ENV === "production",
  isSelfHosted = SELF_HOSTED === "true",
  protectRoutes = PROTECT_ROUTES === "true",
  maintenanceAllowedNamespaces = MAINTENANCE_ALLOWED_NAMESPACES.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

