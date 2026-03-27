import { jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * CLI plugin registry table.
 *
 * Stores plugin manifests that the Omni CLI fetches during `omni install`.
 */
export const pluginTable = pgTable(
  "plugin",
  {
    id: generateDefaultId(),
    name: text().notNull().unique(),
    version: text().notNull(),
    description: text().notNull(),
    // "bin", "api", or "launch"
    type: text().notNull(),
    // Binary name for bin/launch plugins
    bin: text(),
    // API endpoint URL for api plugins
    endpoint: text(),
    // Command definitions
    commands: jsonb()
      .$type<
        Record<string, { description: string; method?: string; path?: string }>
      >()
      .default({}),
    // System package manager hints
    packages: jsonb().$type<{ aur?: string; homebrew?: string }>(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), uniqueIndex().on(table.name)],
);

export type InsertPlugin = InferInsertModel<typeof pluginTable>;
export type SelectPlugin = InferSelectModel<typeof pluginTable>;
