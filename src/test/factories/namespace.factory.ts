import { faker } from "@faker-js/faker";

import {
  type InsertNamespace,
  type SelectNamespace,
  namespaceTable,
} from "lib/db/schema";

import { createFactory, type DbClient } from "./base";

export const namespaceFactory = createFactory<InsertNamespace, SelectNamespace>(
  () => ({
    name: faker.lorem.slug(2),
    description: faker.lorem.sentence(),
  }),
  async (db: DbClient, data: InsertNamespace) => {
    const [result] = await db.insert(namespaceTable).values(data).returning();
    return result;
  },
);
