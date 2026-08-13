import { Elysia, t } from "elysia";

import { dbPool } from "lib/db";
import { exchangeOidcForToken } from "lib/oidc/exchange";

/**
 * Extract a bearer token from an Authorization header.
 */
const extractBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
};

/**
 * OIDC trusted-publishing endpoint.
 *
 * Exchanges a CI/build identity token (GitHub Actions, the in-cluster identity,
 * Arbor CI, etc.) for a short-lived `mf_` publish token, gated by a registered
 * trusted-publisher binding. This is the credential-free alternative to a
 * long-lived, human-minted API token: nothing durable is stored, and every
 * publish is attributable to the token's issuer + subject + claims.
 */
const oidcApi = new Elysia({ prefix: "/api/oidc" }).post(
  "/token",
  async ({ body, headers, set }) => {
    const token = extractBearerToken(headers.authorization ?? null);
    if (!token) {
      set.status = 401;
      return {
        error: "OIDC identity token required (Authorization: Bearer <jwt>)",
      };
    }

    const result = await exchangeOidcForToken(dbPool, {
      token,
      namespace: body.namespace,
      scope: body.scope ?? "write",
    });

    if (!result.ok) {
      set.status = result.status;
      return { error: result.error };
    }

    // Plaintext is returned once and never stored; the client uses it
    // immediately for the publish and discards it.
    return {
      token: result.token,
      plaintextToken: result.plaintextToken,
      warning: "Ephemeral token. Use it for this run only; it expires shortly.",
    };
  },
  {
    body: t.Object({
      namespace: t.String({ minLength: 1 }),
      scope: t.Optional(t.String()),
    }),
  },
);

export default oidcApi;
