import type { SelectTrustedPublisher } from "lib/db/schema";

/** Permission levels, ordered from least to most privileged. */
const SCOPE_RANK: Record<string, number> = { read: 1, write: 2, admin: 3 };

/**
 * Whether a granted scope is sufficient for a requested one. A higher scope
 * covers every lower one (admin covers write covers read); an unknown scope
 * covers nothing.
 */
export const scopeCovers = (granted: string, requested: string): boolean => {
  const g = SCOPE_RANK[granted];
  const r = SCOPE_RANK[requested];
  if (g === undefined || r === undefined) return false;
  return g >= r;
};

/**
 * Whether the verified token claims satisfy a binding's required claim
 * constraints. Every constraint must be present and equal (strict, primitive
 * equality); an empty constraint set is always satisfied.
 */
const claimsSatisfy = (
  constraints: Record<string, unknown>,
  claims: Record<string, unknown>,
): boolean =>
  Object.entries(constraints).every(([key, value]) => claims[key] === value);

/**
 * Select the first trusted-publisher binding that authorizes a mint.
 *
 * Candidates are expected to be pre-filtered to the resolved namespace and
 * issuer (that scoping is a DB concern). This applies the security-critical
 * checks: the binding must be active, its subject must equal the token's `sub`,
 * every claim constraint must match, and its scope must cover the requested
 * one. Returns null when nothing authorizes the request.
 */
export const selectTrustedPublisher = (
  candidates: SelectTrustedPublisher[],
  claims: Record<string, unknown>,
  requestedScope: string,
): SelectTrustedPublisher | null =>
  candidates.find(
    (binding) =>
      binding.isActive &&
      binding.subject === claims.sub &&
      claimsSatisfy(
        (binding.claimConstraints ?? {}) as Record<string, unknown>,
        claims,
      ) &&
      scopeCovers(binding.scope, requestedScope),
  ) ?? null;
