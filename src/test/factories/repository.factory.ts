import { faker } from "@faker-js/faker";

import {
  type InsertRepository,
  type SelectRepository,
  repositoryTable,
} from "lib/db/schema";

import { createFactory, type DbClient } from "./base";

export const repositoryFactory = createFactory<InsertRepository, SelectRepository>(
  () => ({
    namespaceId: faker.string.uuid(),
    name: faker.lorem.slug(2),
    description: faker.lorem.sentence(),
    artifactType: faker.helpers.arrayElement(["oci", "openapi", "graphql", "jsonschema", "wasm"]),
    isPublic: faker.datatype.boolean(),
  }),
  async (db: DbClient, data: InsertRepository) => {
    const [result] = await db.insert(repositoryTable).values(data).returning();
    return result;
  },
);
