import {
  bigint,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { repositoryTable } from "lib/db/schema/repository.table";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Artifact table (blobs, manifests, schemas, etc).
 */
export const artifactTable = pgTable(
  "artifact",
  {
    id: generateDefaultId(),
    repositoryId: uuid()
      .notNull()
      .references(() => repositoryTable.id, { onDelete: "cascade" }),
    // sha256:... content-addressed digest
    digest: text().notNull(),
    size: bigint({ mode: "number" }).notNull(),
    mediaType: text().notNull(),
    // Small artifacts can be stored inline; large ones use blob storage
    content: text(),
    // Storage backend path/key (null = content is inline)
    storagePath: text(),
    // OCI referrers: the `subject` manifest digest this artifact refers to
    // (e.g. a signature/SBOM/attestation referring to an image). Null for
    // ordinary manifests. Powers GET /v2/<name>/referrers/<digest>.
    subject: text(),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.repositoryId, table.digest),
    index().on(table.repositoryId),
    index().on(table.digest),
    // Referrers lookups: all artifacts in a repo referring to a subject digest.
    index().on(table.repositoryId, table.subject),
  ],
);

export type InsertArtifact = InferInsertModel<typeof artifactTable>;
export type SelectArtifact = InferSelectModel<typeof artifactTable>;
