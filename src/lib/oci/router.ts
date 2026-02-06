/**
 * OCI Distribution API v2 router.
 * @see https://github.com/opencontainers/distribution-spec/blob/main/spec.md
 *
 * Endpoints:
 * - GET /v2/                                  - Check API version
 * - GET /v2/<name>/manifests/<reference>      - Pull manifest
 * - PUT /v2/<name>/manifests/<reference>      - Push manifest
 * - HEAD /v2/<name>/manifests/<reference>     - Check manifest exists
 * - GET /v2/<name>/blobs/<digest>             - Pull blob
 * - HEAD /v2/<name>/blobs/<digest>            - Check blob exists
 * - POST /v2/<name>/blobs/uploads/            - Start upload
 * - PATCH /v2/<name>/blobs/uploads/<uuid>     - Upload chunk
 * - PUT /v2/<name>/blobs/uploads/<uuid>       - Complete upload
 * - GET /v2/<name>/tags/list                  - List tags
 */

import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { maintenanceAllowedNamespaces } from "lib/config/env.config";
import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
  uploadSessionTable,
} from "lib/db/schema";
import {
  appendChunk,
  assembleBlob,
  cleanupSession,
  initSession,
} from "lib/oci/chunkStore";
import { isEnabled } from "lib/flags/client";
import { computeDigest } from "lib/oci/digest";
import * as ociErrors from "lib/oci/errors";

const FLAGS = {
  MAINTENANCE: "manifold-api-maintenance-mode",
} as const;

/**
 * Parse repository name into namespace and repository.
 * Handles both "namespace/repo" and "repo" (defaults to "library").
 */
const parseRepoName = (name: string): { namespace: string; repo: string } => {
  const parts = name.split("/");
  if (parts.length === 1) {
    return { namespace: "library", repo: parts[0] };
  }
  return { namespace: parts[0], repo: parts.slice(1).join("/") };
};

/**
 * Get repository by namespace and name.
 */
const getRepository = async (namespace: string, repoName: string) => {
  const result = await dbPool
    .select({
      repository: repositoryTable,
      namespace: namespaceTable,
    })
    .from(repositoryTable)
    .innerJoin(
      namespaceTable,
      eq(repositoryTable.namespaceId, namespaceTable.id),
    )
    .where(
      and(
        eq(namespaceTable.name, namespace),
        eq(repositoryTable.name, repoName),
      ),
    )
    .limit(1);

  return result[0];
};

/**
 * OCI Distribution API router.
 */
const ociRouter = new Elysia({ prefix: "/v2" })
  // Block non-allowed namespaces during maintenance
  .onBeforeHandle(async ({ request, set }) => {
    const path = new URL(request.url).pathname.replace(/^\/v2\/?/, "");

    // Allow /v2/ version check
    if (!path) return;

    if (!(await isEnabled(FLAGS.MAINTENANCE))) return;

    const segment = decodeURIComponent(path.split("/")[0]);
    const namespace = segment.split("/")[0];

    if (!maintenanceAllowedNamespaces.includes(namespace)) {
      set.status = 503;
      return ociErrors.denied("Registry is in maintenance mode");
    }
  })

  // version check
  .get("/", ({ set }) => {
    set.headers["Docker-Distribution-API-Version"] = "registry/2.0";
    return {};
  })

  // get manifest
  .get(
    "/:name/manifests/:reference",
    async ({ params, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return ociErrors.nameUnknown(params.name);
      }

      // find artifact by tag or digest
      let artifact: typeof artifactTable.$inferSelect | undefined;

      if (params.reference.startsWith("sha256:")) {
        const result = await dbPool
          .select()
          .from(artifactTable)
          .where(
            and(
              eq(artifactTable.repositoryId, repoData.repository.id),
              eq(artifactTable.digest, params.reference),
            ),
          )
          .limit(1);
        artifact = result[0];
      } else {
        const result = await dbPool
          .select({ artifact: artifactTable })
          .from(tagTable)
          .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
          .where(
            and(
              eq(tagTable.repositoryId, repoData.repository.id),
              eq(tagTable.name, params.reference),
            ),
          )
          .limit(1);
        artifact = result[0]?.artifact;
      }

      if (!artifact) {
        set.status = 404;
        return ociErrors.manifestUnknown(params.reference);
      }

      set.headers["Content-Type"] = artifact.mediaType;
      set.headers["Docker-Content-Digest"] = artifact.digest;
      set.headers["Content-Length"] = String(artifact.size);

      return artifact.content ?? "";
    },
    {
      params: t.Object({
        name: t.String(),
        reference: t.String(),
      }),
    },
  )

  // head manifest
  .head(
    "/:name/manifests/:reference",
    async ({ params, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return;
      }

      let artifact: typeof artifactTable.$inferSelect | undefined;

      if (params.reference.startsWith("sha256:")) {
        const result = await dbPool
          .select()
          .from(artifactTable)
          .where(
            and(
              eq(artifactTable.repositoryId, repoData.repository.id),
              eq(artifactTable.digest, params.reference),
            ),
          )
          .limit(1);
        artifact = result[0];
      } else {
        const result = await dbPool
          .select({ artifact: artifactTable })
          .from(tagTable)
          .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
          .where(
            and(
              eq(tagTable.repositoryId, repoData.repository.id),
              eq(tagTable.name, params.reference),
            ),
          )
          .limit(1);
        artifact = result[0]?.artifact;
      }

      if (!artifact) {
        set.status = 404;
        return;
      }

      set.headers["Content-Type"] = artifact.mediaType;
      set.headers["Docker-Content-Digest"] = artifact.digest;
      set.headers["Content-Length"] = String(artifact.size);
    },
    {
      params: t.Object({
        name: t.String(),
        reference: t.String(),
      }),
    },
  )

  // put manifest
  .put(
    "/:name/manifests/:reference",
    async ({ params, body, request, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return ociErrors.nameUnknown(params.name);
      }

      const contentType =
        request.headers.get("Content-Type") ??
        "application/vnd.oci.image.manifest.v1+json";

      // Elysia may not parse vendor media types; fall back to raw request body
      const content =
        typeof body === "string"
          ? body
          : body && typeof body === "object"
            ? JSON.stringify(body)
            : await request.text();
      const contentBytes = new TextEncoder().encode(content);
      const digest = await computeDigest(contentBytes);

      // upsert artifact
      const [artifact] = await dbPool
        .insert(artifactTable)
        .values({
          repositoryId: repoData.repository.id,
          digest,
          size: contentBytes.length,
          mediaType: contentType,
          content,
        })
        .onConflictDoUpdate({
          target: [artifactTable.repositoryId, artifactTable.digest],
          set: {
            size: contentBytes.length,
            mediaType: contentType,
            content,
          },
        })
        .returning();

      // if reference is a tag (not a digest), create/update tag
      if (!params.reference.startsWith("sha256:")) {
        await dbPool
          .insert(tagTable)
          .values({
            repositoryId: repoData.repository.id,
            artifactId: artifact.id,
            name: params.reference,
          })
          .onConflictDoUpdate({
            target: [tagTable.repositoryId, tagTable.name],
            set: { artifactId: artifact.id },
          });
      }

      set.status = 201;
      set.headers.Location = `/v2/${params.name}/manifests/${digest}`;
      set.headers["Docker-Content-Digest"] = digest;
    },
    {
      params: t.Object({
        name: t.String(),
        reference: t.String(),
      }),
    },
  )

  // get blob
  .get(
    "/:name/blobs/:digest",
    async ({ params, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return ociErrors.nameUnknown(params.name);
      }

      const [artifact] = await dbPool
        .select()
        .from(artifactTable)
        .where(
          and(
            eq(artifactTable.repositoryId, repoData.repository.id),
            eq(artifactTable.digest, params.digest),
          ),
        )
        .limit(1);

      if (!artifact) {
        set.status = 404;
        return ociErrors.blobUnknown(params.digest);
      }

      set.headers["Content-Type"] = "application/octet-stream";
      set.headers["Docker-Content-Digest"] = artifact.digest;
      set.headers["Content-Length"] = String(artifact.size);

      return artifact.content ?? "";
    },
    {
      params: t.Object({
        name: t.String(),
        digest: t.String(),
      }),
    },
  )

  // head blob
  .head(
    "/:name/blobs/:digest",
    async ({ params, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return;
      }

      const [artifact] = await dbPool
        .select()
        .from(artifactTable)
        .where(
          and(
            eq(artifactTable.repositoryId, repoData.repository.id),
            eq(artifactTable.digest, params.digest),
          ),
        )
        .limit(1);

      if (!artifact) {
        set.status = 404;
        return;
      }

      set.headers["Content-Type"] = "application/octet-stream";
      set.headers["Docker-Content-Digest"] = artifact.digest;
      set.headers["Content-Length"] = String(artifact.size);
    },
    {
      params: t.Object({
        name: t.String(),
        digest: t.String(),
      }),
    },
  )

  // start blob upload
  .post(
    "/:name/blobs/uploads/",
    async ({ params, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return ociErrors.nameUnknown(params.name);
      }

      // create upload session
      const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      const [session] = await dbPool
        .insert(uploadSessionTable)
        .values({
          repositoryId: repoData.repository.id,
          expiresAt,
        })
        .returning();

      await initSession(session.id);

      set.status = 202;
      set.headers.Location = `/v2/${params.name}/blobs/uploads/${session.id}`;
      set.headers["Docker-Upload-UUID"] = session.id;
      set.headers.Range = "0-0";
    },
    {
      params: t.Object({
        name: t.String(),
      }),
    },
  )

  // upload chunk (PATCH)
  .patch(
    "/:name/blobs/uploads/:uuid",
    async ({ params, body, set }) => {
      const [session] = await dbPool
        .select()
        .from(uploadSessionTable)
        .where(eq(uploadSessionTable.id, params.uuid))
        .limit(1);

      if (!session) {
        set.status = 404;
        return ociErrors.blobUnknown(params.uuid);
      }

      const chunk =
        body instanceof ArrayBuffer
          ? new Uint8Array(body)
          : typeof body === "string"
            ? new TextEncoder().encode(body)
            : new Uint8Array(0);

      const chunkSize = chunk.byteLength;

      if (chunkSize > 0) {
        await appendChunk(params.uuid, chunk);
      }

      const newOffset = session.offset + chunkSize;

      await dbPool
        .update(uploadSessionTable)
        .set({ offset: newOffset })
        .where(eq(uploadSessionTable.id, params.uuid));

      set.status = 202;
      set.headers.Location = `/v2/${params.name}/blobs/uploads/${params.uuid}`;
      set.headers["Docker-Upload-UUID"] = params.uuid;
      set.headers.Range = `0-${newOffset}`;
    },
    {
      params: t.Object({
        name: t.String(),
        uuid: t.String(),
      }),
    },
  )

  // complete upload (PUT)
  .put(
    "/:name/blobs/uploads/:uuid",
    async ({ params, query, body, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return ociErrors.nameUnknown(params.name);
      }

      const [session] = await dbPool
        .select()
        .from(uploadSessionTable)
        .where(eq(uploadSessionTable.id, params.uuid))
        .limit(1);

      if (!session) {
        set.status = 404;
        return ociErrors.blobUnknown(params.uuid);
      }

      // Determine content source: inline body (monolithic) or assembled chunks
      let content: Uint8Array;

      const inlineBody =
        body instanceof ArrayBuffer
          ? new Uint8Array(body)
          : typeof body === "string" && body.length > 0
            ? new TextEncoder().encode(body)
            : null;

      if (inlineBody && inlineBody.byteLength > 0) {
        content = inlineBody;
      } else if (session.offset > 0) {
        content = new Uint8Array(await assembleBlob(params.uuid));
      } else {
        set.status = 400;
        return {
          errors: [
            {
              code: "BLOB_UPLOAD_INVALID",
              message: "No content provided",
            },
          ],
        };
      }

      const computedDigest = await computeDigest(content);

      if (query.digest && computedDigest !== query.digest) {
        await cleanupSession(params.uuid);
        set.status = 400;
        return ociErrors.digestInvalid(query.digest, computedDigest);
      }

      // Create artifact
      await dbPool
        .insert(artifactTable)
        .values({
          repositoryId: repoData.repository.id,
          digest: computedDigest,
          size: content.byteLength,
          mediaType: "application/octet-stream",
          content: new TextDecoder().decode(content),
        })
        .onConflictDoNothing();

      // Cleanup session and chunk data
      await dbPool
        .delete(uploadSessionTable)
        .where(eq(uploadSessionTable.id, params.uuid));

      await cleanupSession(params.uuid);

      set.status = 201;
      set.headers.Location = `/v2/${params.name}/blobs/${computedDigest}`;
      set.headers["Docker-Content-Digest"] = computedDigest;
    },
    {
      params: t.Object({
        name: t.String(),
        uuid: t.String(),
      }),
      query: t.Object({
        digest: t.Optional(t.String()),
      }),
    },
  )

  // list tags
  .get(
    "/:name/tags/list",
    async ({ params, query, set }) => {
      const { namespace, repo } = parseRepoName(params.name);
      const repoData = await getRepository(namespace, repo);

      if (!repoData) {
        set.status = 404;
        return ociErrors.nameUnknown(params.name);
      }

      let tags = await dbPool
        .select({ name: tagTable.name })
        .from(tagTable)
        .where(eq(tagTable.repositoryId, repoData.repository.id))
        .orderBy(tagTable.name);

      // pagination
      if (query.last) {
        const lastIdx = tags.findIndex((t) => t.name === query.last);
        if (lastIdx >= 0) {
          tags = tags.slice(lastIdx + 1);
        }
      }
      if (query.n) {
        tags = tags.slice(0, query.n);
      }

      return {
        name: params.name,
        tags: tags.map((t) => t.name),
      };
    },
    {
      params: t.Object({
        name: t.String(),
      }),
      query: t.Object({
        n: t.Optional(t.Numeric()),
        last: t.Optional(t.String()),
      }),
    },
  );

export default ociRouter;
