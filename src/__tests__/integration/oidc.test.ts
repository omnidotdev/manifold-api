import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { oidcApi } from "lib/api";
import { AUTH_BASE_URL } from "lib/config/env.config";
import {
  oidcIssuerTable,
  type SelectNamespace,
  trustedPublisherTable,
} from "lib/db/schema";
import { authenticateNpmToken } from "lib/npm/auth";
import { exchangeOidcForToken } from "lib/oidc/exchange";
import { namespaceFactory } from "test/factories";
import { generateTestToken } from "test/setup/mswServer";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const getDb = () => {
  if (!globalThis.__TEST_DATABASE__) {
    throw new Error("Test database not initialized (see preload.ts).");
  }
  return globalThis.__TEST_DATABASE__.db;
};

const SUBJECT = "system:serviceaccount:herald-ci:herald-sdk-publisher";
const AUDIENCE = "manifold";

/** Sign a token for the mocked issuer (AUTH_BASE_URL) with a manifold audience. */
const ciToken = (over: Record<string, unknown> = {}) =>
  generateTestToken({ sub: SUBJECT, aud: AUDIENCE, ...over });

/** Seed an enabled issuer for the mocked JWKS endpoint. */
const seedIssuer = async (over: Record<string, unknown> = {}) => {
  const db = getDb();
  const [issuer] = await db
    .insert(oidcIssuerTable)
    .values({
      issuer: AUTH_BASE_URL,
      jwksUri: `${AUTH_BASE_URL}/.well-known/jwks.json`,
      audience: AUDIENCE,
      enabled: true,
      ...over,
    })
    .returning();
  return issuer;
};

const seedBinding = async (
  issuerId: string,
  namespace: SelectNamespace,
  over: Record<string, unknown> = {},
) => {
  const db = getDb();
  const [binding] = await db
    .insert(trustedPublisherTable)
    .values({
      namespaceId: namespace.id,
      issuerId,
      subject: SUBJECT,
      scope: "write",
      createdBy: "oidc:admin",
      ...over,
    })
    .returning();
  return binding;
};

describe("OIDC trusted publishing token exchange", () => {
  let namespace: SelectNamespace;

  beforeEach(async () => {
    await getDb().execute(
      sql`TRUNCATE TABLE trusted_publisher, oidc_issuer, api_token, namespace CASCADE`,
    );
    namespace = await namespaceFactory.create(getDb(), { name: "omnidotdev" });
  });

  test("mints an ephemeral token that authenticates for publishing", async () => {
    const issuer = await seedIssuer();
    await seedBinding(issuer.id, namespace);

    const result = await exchangeOidcForToken(getDb(), {
      token: await ciToken(),
      namespace: "omnidotdev",
      scope: "write",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plaintextToken).toStartWith("mf_");
    expect(result.token.scope).toBe("write");
    expect(result.token.namespaceId).toBe(namespace.id);
    expect(result.token.expiresAt).not.toBeNull();

    // the minted token is a real, usable mf_ token
    const auth = await authenticateNpmToken(`Bearer ${result.plaintextToken}`);
    expect(auth).not.toBeNull();
    expect(auth?.scope).toBe("write");
  });

  test("honors claim constraints (ref must match)", async () => {
    const issuer = await seedIssuer();
    await seedBinding(issuer.id, namespace, {
      claimConstraints: { ref: "refs/tags/v1.0.0" },
    });

    const wrongRef = await exchangeOidcForToken(getDb(), {
      token: await ciToken({ ref: "refs/heads/master" }),
      namespace: "omnidotdev",
      scope: "write",
    });
    expect(wrongRef.ok).toBe(false);

    const rightRef = await exchangeOidcForToken(getDb(), {
      token: await ciToken({ ref: "refs/tags/v1.0.0" }),
      namespace: "omnidotdev",
      scope: "write",
    });
    expect(rightRef.ok).toBe(true);
  });

  test("grants a lower scope than the binding but not a higher one", async () => {
    const issuer = await seedIssuer();
    await seedBinding(issuer.id, namespace, { scope: "write" });

    const read = await exchangeOidcForToken(getDb(), {
      token: await ciToken(),
      namespace: "omnidotdev",
      scope: "read",
    });
    expect(read.ok).toBe(true);

    const admin = await exchangeOidcForToken(getDb(), {
      token: await ciToken(),
      namespace: "omnidotdev",
      scope: "admin",
    });
    expect(admin.ok).toBe(false);
    if (!admin.ok) expect(admin.status).toBe(403);
  });

  test("rejects a subject with no binding", async () => {
    const issuer = await seedIssuer();
    await seedBinding(issuer.id, namespace, { subject: "system:serviceaccount:other:sa" });

    const result = await exchangeOidcForToken(getDb(), {
      token: await ciToken(),
      namespace: "omnidotdev",
      scope: "write",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  test("rejects an untrusted issuer", async () => {
    // no oidc_issuer seeded, so the token's issuer is unknown
    const result = await exchangeOidcForToken(getDb(), {
      token: await ciToken(),
      namespace: "omnidotdev",
      scope: "write",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  test("rejects a disabled issuer", async () => {
    const issuer = await seedIssuer({ enabled: false });
    await seedBinding(issuer.id, namespace);

    const result = await exchangeOidcForToken(getDb(), {
      token: await ciToken(),
      namespace: "omnidotdev",
      scope: "write",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  test("rejects a malformed token", async () => {
    await seedIssuer();
    const result = await exchangeOidcForToken(getDb(), {
      token: "not.a.jwt",
      namespace: "omnidotdev",
      scope: "write",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  test("the endpoint 401s without an Authorization header", async () => {
    const app = new Elysia().use(oidcApi);
    const response = await app.handle(
      new Request("http://localhost/api/oidc/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ namespace: "omnidotdev", scope: "write" }),
      }),
    );
    expect(response.status).toBe(401);
  });
});
