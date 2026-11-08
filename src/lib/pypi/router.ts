/**
 * @file PyPI registry router.
 *
 * Mounted at `/pypi/:namespace/` and implements:
 * - PEP 503/691 Simple index (GET /simple/ and /simple/:project/)
 * - File download (GET /files/:project/:filename)
 * - Twine upload (POST /)
 */

import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import { downloadHandler } from "lib/pypi/download";
import { uploadHandler } from "lib/pypi/publish";
import { simpleProjectHandler, simpleRootHandler } from "lib/pypi/simple";

const BASE_URL = process.env.PUBLIC_URL ?? "https://manifold.omni.dev";

/** Narrowed `set` shape accepted by pypi handlers */
type HandlerSet = { status?: number; headers: Record<string, string> };

const pypiRouter = new Elysia({ prefix: "/pypi/:namespace" })
  // Simple index root (with and without trailing slash)
  .get(
    "/simple",
    ({ params, request }) =>
      simpleRootHandler(params.namespace, request.headers.get("accept")),
    { params: t.Object({ namespace: t.String() }) },
  )
  .get(
    "/simple/",
    ({ params, request }) =>
      simpleRootHandler(params.namespace, request.headers.get("accept")),
    { params: t.Object({ namespace: t.String() }) },
  )

  // Simple index per project (with and without trailing slash)
  .get(
    "/simple/:project",
    ({ params, request, set }) =>
      simpleProjectHandler(
        params.namespace,
        params.project,
        BASE_URL,
        request.headers.get("accept"),
        set as HandlerSet,
      ),
    { params: t.Object({ namespace: t.String(), project: t.String() }) },
  )
  .get(
    "/simple/:project/",
    ({ params, request, set }) =>
      simpleProjectHandler(
        params.namespace,
        params.project,
        BASE_URL,
        request.headers.get("accept"),
        set as HandlerSet,
      ),
    { params: t.Object({ namespace: t.String(), project: t.String() }) },
  )

  // File download
  .get(
    "/files/:project/:filename",
    ({ params, set, request }) =>
      downloadHandler(
        params.namespace,
        params.project,
        params.filename,
        set as HandlerSet,
        request,
      ),
    {
      params: t.Object({
        namespace: t.String(),
        project: t.String(),
        filename: t.String(),
      }),
    },
  )

  // Upload, with per-token rate limiting (10 req/min)
  .use(
    rateLimit({
      max: 10,
      duration: 60_000,
      scoping: "scoped",
      generator: (req) => req.headers.get("Authorization") ?? "anonymous",
    }),
  )
  .post(
    "/",
    ({ params, body, request, set }) =>
      uploadHandler(
        params.namespace,
        (body ?? {}) as Record<string, unknown>,
        request.headers.get("Authorization"),
        set as HandlerSet,
      ),
    { params: t.Object({ namespace: t.String() }) },
  );

export default pypiRouter;
