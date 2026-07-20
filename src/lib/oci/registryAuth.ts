/**
 * OCI registry authentication.
 *
 * The registry (`/v2/`) is flag-gated by `REGISTRY_REQUIRE_AUTH`. When enabled,
 * every request must carry HTTP Basic credentials whose password equals the
 * configured `REGISTRY_AUTH_TOKEN`. The username is ignored (Docker/containerd
 * send an arbitrary username with token auth), so any username paired with the
 * correct token passes. This is the standard registry credential shape a
 * `docker login` / kubelet `imagePullSecret` / buildkit auth entry produces.
 *
 * Fails closed: when auth is required but no token is configured, or the header
 * is missing/malformed, or the password does not match, the request is denied.
 */

import { timingSafeEqual } from "node:crypto";

/** Challenge returned in `WWW-Authenticate` on a 401 so clients know to auth. */
export const registryAuthChallenge = 'Basic realm="Manifold Registry"';

/** Constant-time string compare that never short-circuits on length. */
const secureEquals = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on length mismatch, so compare against a
  // same-length buffer and fold the length check into the boolean result
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
};

/**
 * Verify a request's `Authorization` header against the registry token.
 *
 * @param authHeader the raw `Authorization` header value (or null/undefined)
 * @param token the configured registry token (`REGISTRY_AUTH_TOKEN`)
 * @returns true only when a token is configured AND the Basic-auth password matches
 */
export const isRegistryAuthorized = (
  authHeader: string | null | undefined,
  token: string | undefined,
): boolean => {
  if (!token) return false;
  if (!authHeader) return false;

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "basic" || !encoded) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return false;
  }

  const separator = decoded.indexOf(":");
  if (separator === -1) return false;
  const password = decoded.slice(separator + 1);

  return secureEquals(password, token);
};
