/**
 * Reserved namespace names. Namespace names are a global, first-come
 * coordinate (the npm scope, the OCI/cargo org, the `@handle` in the URL), so
 * before a public launch we block two classes of name from being claimed:
 *
 * - Routing/system words that collide with real routes or read as official
 *   (`api`, `admin`, `docs`, `~`, ...), which would let a tenant impersonate
 *   platform surfaces.
 * - Omni/Manifold brand terms, so an outside user cannot squat the first-party
 *   identity. Names Omni already owns are unaffected (creation is blocked, not
 *   existing rows), and first-party namespaces are seeded directly.
 *
 * Matching is case-insensitive. This is a denylist for NEW namespace creation;
 * it does not touch namespaces that already exist.
 */
const RESERVED = new Set<string>([
  // routing / system
  "admin",
  "api",
  "app",
  "apps",
  "assets",
  "auth",
  "billing",
  "blog",
  "cdn",
  "create",
  "dashboard",
  "docs",
  "explore",
  "help",
  "internal",
  "login",
  "logout",
  "mail",
  "me",
  "new",
  "oauth",
  "org",
  "orgs",
  "organization",
  "organizations",
  "privacy",
  "registry",
  "root",
  "search",
  "settings",
  "signin",
  "signup",
  "static",
  "status",
  "support",
  "system",
  "team",
  "teams",
  "terms",
  "user",
  "users",
  "v1",
  "v2",
  "workspace",
  "workspaces",
  "www",
  // artifact protocols (collide with registry paths / read as official)
  "cargo",
  "npm",
  "oci",
  "wasm",
  "pypi",
  "pip",
  "schema",
  "schemas",
  // sentinels
  "~",
  "@",
  // first-party brand (anti-squat / anti-impersonation)
  "omni",
  "omnidotdev",
  "manifold",
  "gatekeeper",
  "official",
]);

/** Whether a namespace name may not be claimed by a tenant. Case-insensitive. */
export const isReservedNamespace = (name: string): boolean =>
  RESERVED.has(name.trim().toLowerCase());
