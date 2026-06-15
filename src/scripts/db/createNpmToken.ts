import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { generateApiToken } from "lib/auth/token";
import { apiTokenTable, namespaceTable } from "lib/db/schema";

/**
 * Create (or reuse) a namespace and mint an npm API token scoped to it.
 *
 * The plaintext token is printed once; only its SHA-256 hash is stored, matching
 * how `POST /api/tokens` issues tokens. Use this for service-account style
 * publish credentials (e.g. an `@scope` npm token) without going through the UI.
 *
 * Usage:
 *   DATABASE_URL=postgres://... bun src/scripts/db/createNpmToken.ts <namespace> [scope] [name]
 *
 * Defaults: scope=write, name="<namespace> npm publish".
 */
const main = async (): Promise<void> => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const namespaceName = process.argv[2];
  const scope = process.argv[3] ?? "write";
  const tokenName = process.argv[4] ?? `${namespaceName} npm publish`;
  if (!namespaceName) {
    throw new Error("usage: createNpmToken.ts <namespace> [scope] [name]");
  }
  if (!["read", "write", "admin"].includes(scope)) {
    throw new Error(`invalid scope: ${scope} (expected read|write|admin)`);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle({
    client: pool,
    schema: { namespaceTable, apiTokenTable },
    casing: "snake_case",
  });

  try {
    // Upsert the namespace by its unique name (org-less is fine, skips billing)
    await db
      .insert(namespaceTable)
      .values({ name: namespaceName })
      .onConflictDoNothing({ target: namespaceTable.name });
    const [ns] = await db
      .select()
      .from(namespaceTable)
      .where(eq(namespaceTable.name, namespaceName))
      .limit(1);
    if (!ns) throw new Error(`failed to resolve namespace ${namespaceName}`);

    const token = generateApiToken();
    await db.insert(apiTokenTable).values({
      name: tokenName,
      tokenHash: token.hash,
      tokenPrefix: token.prefix,
      namespaceId: ns.id,
      scope,
      createdBy: "script:createNpmToken",
    });

    console.info(`namespace: ${ns.name} (${ns.id})`);
    console.info(`scope:     ${scope}`);
    console.info(`prefix:    ${token.prefix}`);
    console.info(`token:     ${token.plaintext}`);
    console.info("save the token now; only its hash is persisted");
  } finally {
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
