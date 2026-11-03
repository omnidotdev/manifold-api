import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import { fetchHandler, listHandler } from "lib/wasm/fetch";
import { publishHandler } from "lib/wasm/publish";

type HandlerSet = { status?: number; headers: Record<string, string> };

/**
 * WASM registry router.
 *
 * Mounted at `/wasm/:namespace` and implements:
 * - List versions:  GET  /wasm/:namespace/:name
 * - Download:        GET  /wasm/:namespace/:name/:version
 * - Publish:         PUT  /wasm/:namespace/:name/:version
 */
const wasmRouter = new Elysia({ prefix: "/wasm/:namespace" })
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
    ({ params, request, set }) =>
      publishHandler(
        params.namespace,
        params.name,
        params.version,
        request,
        set as HandlerSet,
      ),
    {
      params: t.Object({
        namespace: t.String(),
        name: t.String(),
        version: t.String(),
      }),
    },
  );

export default wasmRouter;
