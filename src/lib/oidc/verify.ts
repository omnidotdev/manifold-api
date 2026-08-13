import { createRemoteJWKSet, jwtVerify } from "jose";

import type { SelectOidcIssuer } from "lib/db/schema";

/**
 * Cache of remote JWK sets keyed by JWKS URL. `createRemoteJWKSet` handles its
 * own key caching + rotation; this map just avoids rebuilding the fetcher per
 * request.
 */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

const getJwks = (jwksUri: string) => {
  let set = jwksCache.get(jwksUri);
  if (!set) {
    set = createRemoteJWKSet(new URL(jwksUri));
    jwksCache.set(jwksUri, set);
  }
  return set;
};

/** Resolve an issuer's JWKS URL, via the explicit column or OIDC discovery. */
const resolveJwksUri = async (issuer: SelectOidcIssuer): Promise<string> => {
  if (issuer.jwksUri) return issuer.jwksUri;

  const base = issuer.issuer.endsWith("/")
    ? issuer.issuer
    : `${issuer.issuer}/`;
  const discovery = new URL(".well-known/openid-configuration", base);
  const response = await fetch(discovery);
  if (!response.ok) {
    throw new Error(`OIDC discovery failed for ${issuer.issuer}`);
  }
  const doc = (await response.json()) as { jwks_uri?: unknown };
  if (typeof doc.jwks_uri !== "string") {
    throw new Error(`OIDC discovery for ${issuer.issuer} has no jwks_uri`);
  }
  return doc.jwks_uri;
};

/**
 * Verify a presented OIDC token against a trusted issuer: signature (via the
 * issuer's JWKS), plus the `iss`, `aud`, `exp`, and `nbf` claims. Returns the
 * verified claim set. Throws on any failure; the caller maps that to a 401.
 */
export const verifyOidcToken = async (
  token: string,
  issuer: SelectOidcIssuer,
): Promise<Record<string, unknown>> => {
  const jwksUri = await resolveJwksUri(issuer);
  const { payload } = await jwtVerify(token, getJwks(jwksUri), {
    issuer: issuer.issuer,
    audience: issuer.audience,
  });
  return payload as Record<string, unknown>;
};
