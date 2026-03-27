import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { dbPool } from "lib/db";
import { pluginTable } from "lib/db/schema";

/**
 * Plugin registry REST endpoints.
 *
 * Public (unauthenticated) endpoints for CLI plugin discovery and installation.
 */
const pluginsApi = new Elysia({ prefix: "/api/plugins" })
  // list all plugins
  .get("/", async () => {
    const plugins = await dbPool
      .select({
        name: pluginTable.name,
        version: pluginTable.version,
        description: pluginTable.description,
        type: pluginTable.type,
        bin: pluginTable.bin,
        endpoint: pluginTable.endpoint,
        commands: pluginTable.commands,
        packages: pluginTable.packages,
      })
      .from(pluginTable);

    return { plugins };
  })
  // get a plugin by name
  .get("/:name", async ({ params, set }) => {
    const [plugin] = await dbPool
      .select({
        name: pluginTable.name,
        version: pluginTable.version,
        description: pluginTable.description,
        type: pluginTable.type,
        bin: pluginTable.bin,
        endpoint: pluginTable.endpoint,
        commands: pluginTable.commands,
        packages: pluginTable.packages,
      })
      .from(pluginTable)
      .where(eq(pluginTable.name, params.name));

    if (!plugin) {
      set.status = 404;
      return { error: "Plugin not found" };
    }

    return { plugin };
  });

export default pluginsApi;
