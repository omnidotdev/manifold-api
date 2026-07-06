/**
 * Web content router.
 * Serves registry artifacts at human-friendly URLs.
 *
 * Pattern: /@<namespace>/<repo>/<reference>
 * Example: /@omni/schemas/persona.schema.json
 */

import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import { tryFederatedArtifact } from "lib/federation/proxy";

/** OCI manifest media types that require layer resolution */
const OCI_MANIFEST_TYPES = new Set([
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json",
]);

/**
 * Infer Content-Type from a file path.
 */
const inferContentType = (path: string): string => {
  if (path.endsWith(".schema.json")) return "application/schema+json";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".yaml") || path.endsWith(".yml"))
    return "application/yaml";
  if (path.endsWith(".graphql") || path.endsWith(".gql")) return "text/graphql";
  if (path.endsWith(".wasm")) return "application/wasm";
  return "application/octet-stream";
};

/**
 * Resolve blob content from an OCI manifest artifact.
 * Parses the manifest JSON and fetches the first layer.
 */
const resolveManifestBlob = async (
  repositoryId: string,
  manifestContent: string,
): Promise<{ content: string; mediaType: string } | null> => {
  try {
    const manifest = JSON.parse(manifestContent);
    const layers: { digest: string; mediaType?: string }[] =
      manifest.layers ?? [];

    if (layers.length === 0) return null;

    const [blob] = await dbPool
      .select()
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.repositoryId, repositoryId),
          eq(artifactTable.digest, layers[0].digest),
        ),
      )
      .limit(1);

    if (!blob?.content) return null;

    return {
      content: blob.content,
      mediaType: layers[0].mediaType ?? blob.mediaType,
    };
  } catch {
    return null;
  }
};

/**
 * Web content router for serving artifacts at friendly URLs.
 */
const webRouter = new Elysia().get(
  "/@:namespace/:repo/*",
  async ({ params, set }) => {
    const { namespace, repo } = params;
    const reference = params["*"];

    // Check federated sources before local DB lookup
    const federated = await tryFederatedArtifact(namespace, repo, reference);
    if (federated) {
      set.headers["Content-Type"] = federated.mediaType;
      return federated.content;
    }

    // Look up repository
    const [repoData] = await dbPool
      .select({
        repository: repositoryTable,
      })
      .from(repositoryTable)
      .innerJoin(
        namespaceTable,
        eq(repositoryTable.namespaceId, namespaceTable.id),
      )
      .where(
        and(eq(namespaceTable.name, namespace), eq(repositoryTable.name, repo)),
      )
      .limit(1);

    if (!repoData) {
      set.status = 404;
      return { error: "Not found" };
    }

    // Find artifact by tag
    const [tagResult] = await dbPool
      .select({ artifact: artifactTable })
      .from(tagTable)
      .innerJoin(artifactTable, eq(tagTable.artifactId, artifactTable.id))
      .where(
        and(
          eq(tagTable.repositoryId, repoData.repository.id),
          eq(tagTable.name, reference),
        ),
      )
      .limit(1);

    if (!tagResult?.artifact) {
      set.status = 404;
      return { error: "Not found" };
    }

    const { artifact } = tagResult;

    // If the artifact is an OCI manifest, resolve the first layer blob
    if (OCI_MANIFEST_TYPES.has(artifact.mediaType) && artifact.content) {
      const blob = await resolveManifestBlob(
        repoData.repository.id,
        artifact.content,
      );

      if (blob) {
        set.headers["Content-Type"] = inferContentType(reference);
        return blob.content;
      }
    }

    // Serve artifact content directly
    set.headers["Content-Type"] = inferContentType(reference);

    return artifact.content ?? "";
  },
  {
    params: t.Object({
      namespace: t.String(),
      repo: t.String(),
      "*": t.String(),
    }),
  },
);

export default webRouter;
