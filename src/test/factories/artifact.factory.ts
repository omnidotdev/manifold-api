import { faker } from "@faker-js/faker";

import {
  type InsertArtifact,
  type SelectArtifact,
  artifactTable,
} from "lib/db/schema";

import { createFactory, type DbClient } from "./base";

export const artifactFactory = createFactory<InsertArtifact, SelectArtifact>(
  () => ({
    repositoryId: faker.string.uuid(),
    digest: `sha256:${faker.string.hexadecimal({ length: 64, casing: "lower", prefix: "" })}`,
    size: faker.number.int({ min: 100, max: 10000000 }),
    mediaType: faker.helpers.arrayElement([
      "application/vnd.oci.image.manifest.v1+json",
      "application/vnd.docker.distribution.manifest.v2+json",
      "application/json",
    ]),
    content: faker.lorem.paragraphs(2),
  }),
  async (db: DbClient, data: InsertArtifact) => {
    const [result] = await db.insert(artifactTable).values(data).returning();
    return result;
  },
);
