import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import { schemaError } from "lib/schemas/errors";
import { fetchHandler, listHandler } from "lib/schemas/fetch";
import { publishHandler } from "lib/schemas/publish";
import { SCHEMA_FORMATS, isSchemaFormat } from "lib/schemas/validate";

type HandlerSet = { status?: number; headers: Record<string, string> };

/**
 * Schema registry router.
 *
 * Mounted at `/schema/:namespace` and implements:
 * - List versions:  GET  /schema/:namespace/:name
 * - Fetch a schema: GET  /schema/:namespace/:name/:version
 * - Publish:        PUT  /schema/:namespace/:name/:version?format=openapi|graphql|jsonschema
 */
const schemasRouter = new Elysia({ prefix: "/schema/:namespace" })
  .get(
    "/:name",
    ({ params, set, request }) =>
      listHandler(params.namespace, params.name, set as HandlerSet, request),
    { params: t.Object({ namespace: t.String(), name: t.String() }) },
  )
  .get(
    "/:name/:version",
    ({ params, set, request }) =>
      fetchHandler(
        params.namespace,
        params.name,
        params.version,
        set as HandlerSet,
        request,
      ),
    {
      params: t.Object({
        namespace: t.String(),
        name: t.String(),
        version: t.String(),
      }),
    },
  )

  // Write operations with per-token rate limiting (10 req/min)
  .use(
    rateLimit({
      max: 10,
      duration: 60_000,
      scoping: "scoped",
      generator: (req) => req.headers.get("Authorization") ?? "anonymous",
    }),
  )

  .put(
    "/:name/:version",
    ({ params, query, request, set }) => {
      const format = query.format ?? "";
      if (!isSchemaFormat(format)) {
        set.status = 400;
        return schemaError(
          `invalid or missing format; expected one of: ${SCHEMA_FORMATS.join(", ")}`,
        );
      }
      return publishHandler(
        params.namespace,
        params.name,
        params.version,
        format,
        request,
        set as HandlerSet,
      );
    },
    {
      params: t.Object({
        namespace: t.String(),
        name: t.String(),
        version: t.String(),
      }),
      query: t.Object({ format: t.Optional(t.String()) }),
    },
  );

export default schemasRouter;
