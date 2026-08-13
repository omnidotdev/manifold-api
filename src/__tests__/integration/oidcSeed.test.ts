import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { AUTH_BASE_URL } from "lib/config/env.config";
import { oidcIssuerTable, trustedPublisherTable } from "lib/db/schema";
import { exchangeOidcForToken } from "lib/oidc/exchange";
import { seedTrustedPublishers } from "lib/oidc/seed";
import { namespaceFactory } from "test/factories";
import { generateTestToken } from "test/setup/mswServer";

const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

const getDb = () => globalThis.__TEST_DATABASE__.db;

const SUBJECT = "system:serviceaccount:herald-ci:herald-sdk-publisher";

const entry = (over = {}) => ({
  issuer: AUTH_BASE_URL,
  jwksUri: `${AUTH_BASE_URL}/.well-known/jwks.json`,
  audience: "manifold",
  subject: SUBJECT,
  namespace: "omnidotdev",
  scope: "write",
  ...over,
});

describe("seedTrustedPublishers", () => {
  beforeEach(async () => {
    await getDb().execute(
      sql`TRUNCATE TABLE trusted_publisher, oidc_issuer, api_token, namespace CASCADE`,
    );
    await namespaceFactory.create(getDb(), { name: "omnidotdev" });
  });

  test("creates the issuer and binding from config", async () => {
    const result = await seedTrustedPublishers(getDb(), [entry()]);
    expect(result).toEqual({ seeded: 1, skipped: 0 });

    const issuers = await getDb().select().from(oidcIssuerTable);
    const bindings = await getDb().select().from(trustedPublisherTable);
    expect(issuers).toHaveLength(1);
    expect(bindings).toHaveLength(1);
    expect(bindings[0]?.subject).toBe(SUBJECT);
    expect(bindings[0]?.createdBy).toBe("system:seed");
  });

  test("is idempotent (re-running does not duplicate)", async () => {
    await seedTrustedPublishers(getDb(), [entry()]);
    await seedTrustedPublishers(getDb(), [entry({ scope: "admin" })]);

    const issuers = await getDb().select().from(oidcIssuerTable);
    const bindings = await getDb().select().from(trustedPublisherTable);
    expect(issuers).toHaveLength(1);
    expect(bindings).toHaveLength(1);
    // config change converges the existing row
    expect(bindings[0]?.scope).toBe("admin");
  });

  test("skips an entry whose namespace does not exist", async () => {
    const result = await seedTrustedPublishers(getDb(), [
      entry({ namespace: "does-not-exist" }),
    ]);
    expect(result).toEqual({ seeded: 0, skipped: 1 });
    expect(await getDb().select().from(trustedPublisherTable)).toHaveLength(0);
  });

  test("a seeded binding actually authorizes a token exchange", async () => {
    await seedTrustedPublishers(getDb(), [entry()]);

    const result = await exchangeOidcForToken(getDb(), {
      token: await generateTestToken({ sub: SUBJECT, aud: "manifold" }),
      namespace: "omnidotdev",
      scope: "write",
    });
    expect(result.ok).toBe(true);
  });
});
