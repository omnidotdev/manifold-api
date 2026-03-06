import { drizzle } from "drizzle-orm/node-postgres";

import { DATABASE_URL, isDevEnv } from "lib/config/env.config";
import { federatedSourceTable } from "lib/db/schema";

/**
 * Seed the ClawHub federated source.
 */
const seedFederation = async () => {
  if (!isDevEnv || !DATABASE_URL?.includes("localhost")) {
    // biome-ignore lint/suspicious/noConsole: script logging
    console.log("This script can only be run in development");
    process.exit(1);
  }

  const db = drizzle(DATABASE_URL, { casing: "snake_case" });

  // biome-ignore lint/suspicious/noConsole: script logging
  console.log("Seeding ClawHub federated source...");

  await db
    .insert(federatedSourceTable)
    .values({
      namespace: "clawhub",
      upstreamBaseUrl: "https://clawhub.ai/api/v1",
      upstreamType: "clawhub",
      enabled: true,
      rateLimitRpm: 100,
      cacheTtlSeconds: 3600,
      tagListCacheTtlSeconds: 600,
      requireVetting: true,
    })
    .onConflictDoNothing();

  // biome-ignore lint/suspicious/noConsole: script logging
  console.log("ClawHub federated source seeded successfully!");
};

await seedFederation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
