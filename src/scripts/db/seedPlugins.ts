import { drizzle } from "drizzle-orm/node-postgres";

import { DATABASE_URL, isDevEnv } from "lib/config/env.config";
import { pluginTable } from "lib/db/schema";

/**
 * Seed the plugin registry with known ecosystem plugins.
 */
const seedPlugins = async () => {
  if (!isDevEnv || !DATABASE_URL?.includes("localhost")) {
    // biome-ignore lint/suspicious/noConsole: script logging
    console.log("This script can only be run in development");
    process.exit(1);
  }

  const db = drizzle(DATABASE_URL, { casing: "snake_case" });

  // biome-ignore lint/suspicious/noConsole: script logging
  console.log("Seeding plugin registry...");

  await db
    .insert(pluginTable)
    .values({
      name: "beacon",
      version: "0.1.0",
      description:
        "AI assistant runtime -- voice, messaging, and browser automation",
      type: "api",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: env var placeholder expanded by CLI at runtime
      endpoint: "${BEACON_GATEWAY_URL}",
      commands: {
        navigate: {
          description: "Navigate browser to a URL",
          method: "POST",
          path: "/browser/navigate",
        },
        screenshot: {
          description: "Take a browser screenshot",
          method: "POST",
          path: "/browser/screenshot",
        },
        click: {
          description: "Click an element",
          method: "POST",
          path: "/browser/click",
        },
        type: {
          description: "Type text into an element",
          method: "POST",
          path: "/browser/type",
        },
        execute: {
          description: "Execute JavaScript in the browser",
          method: "POST",
          path: "/browser/execute",
        },
        status: {
          description: "Get browser session status",
          method: "GET",
          path: "/browser/status",
        },
      },
    })
    .onConflictDoNothing();

  // biome-ignore lint/suspicious/noConsole: script logging
  console.log("Plugin registry seeded successfully!");
};

await seedPlugins()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
