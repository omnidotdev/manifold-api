// src/lib/cargo/router.ts
import { Elysia, t } from "elysia";

import { downloadHandler } from "lib/cargo/download";
import { configHandler, indexLookup } from "lib/cargo/index";
import { publishHandler } from "lib/cargo/publish";
import { yankHandler } from "lib/cargo/yank";

const BASE_URL = process.env.PUBLIC_URL ?? "https://manifold.omni.dev";

/** Narrowed `set` shape accepted by cargo handlers */
type HandlerSet = { status?: number; headers: Record<string, string> };

/**
 * Cargo registry router.
 *
 * Mounted at `/cargo/:namespace/` and implements:
 * - Sparse index (config.json + crate lookup)
 * - Publish (PUT /api/v1/crates/new)
 * - Download (GET /api/v1/crates/:crate/:version/download)
 * - Yank/Unyank (DELETE/PUT /api/v1/crates/:crate/:version/yank)
 */
const cargoRouter = new Elysia({ prefix: "/cargo/:namespace" })
  // Sparse index config
  .get(
    "/index/config.json",
    ({ params }) => configHandler(params.namespace, BASE_URL),
    { params: t.Object({ namespace: t.String() }) },
  )

  // Sparse index lookup — handle all prefix patterns
  // 1-char: /index/1/:crate
  .get(
    "/index/1/:crate",
    ({ params, set }) =>
      indexLookup(params.namespace, "1", params.crate, set as HandlerSet),
    { params: t.Object({ namespace: t.String(), crate: t.String() }) },
  )
  // 2-char: /index/2/:crate
  .get(
    "/index/2/:crate",
    ({ params, set }) =>
      indexLookup(params.namespace, "2", params.crate, set as HandlerSet),
    { params: t.Object({ namespace: t.String(), crate: t.String() }) },
  )
  // 3-char: /index/3/:first/:crate
  .get(
    "/index/3/:first/:crate",
    ({ params, set }) =>
      indexLookup(
        params.namespace,
        `3/${params.first}`,
        params.crate,
        set as HandlerSet,
      ),
    {
      params: t.Object({
        namespace: t.String(),
        first: t.String(),
        crate: t.String(),
      }),
    },
  )
  // 4+ char: /index/:a/:b/:crate
  .get(
    "/index/:a/:b/:crate",
    ({ params, set }) => {
      // Avoid matching the fixed prefixes
      if (["1", "2", "3"].includes(params.a)) return;
      return indexLookup(
        params.namespace,
        `${params.a}/${params.b}`,
        params.crate,
        set as HandlerSet,
      );
    },
    {
      params: t.Object({
        namespace: t.String(),
        a: t.String(),
        b: t.String(),
        crate: t.String(),
      }),
    },
  )

  // Publish
  .put(
    "/api/v1/crates/new",
    ({ request, set }) => publishHandler(request, set as HandlerSet),
    { params: t.Object({ namespace: t.String() }) },
  )

  // Download
  .get(
    "/api/v1/crates/:crate/:version/download",
    ({ params, set }) =>
      downloadHandler(
        params.namespace,
        params.crate,
        params.version,
        set as HandlerSet,
      ),
    {
      params: t.Object({
        namespace: t.String(),
        crate: t.String(),
        version: t.String(),
      }),
    },
  )

  // Yank
  .delete(
    "/api/v1/crates/:crate/:version/yank",
    ({ params, request, set }) =>
      yankHandler(
        params.crate,
        params.version,
        true,
        request,
        set as HandlerSet,
      ),
    {
      params: t.Object({
        namespace: t.String(),
        crate: t.String(),
        version: t.String(),
      }),
    },
  )

  // Unyank
  .put(
    "/api/v1/crates/:crate/:version/unyank",
    ({ params, request, set }) =>
      yankHandler(
        params.crate,
        params.version,
        false,
        request,
        set as HandlerSet,
      ),
    {
      params: t.Object({
        namespace: t.String(),
        crate: t.String(),
        version: t.String(),
      }),
    },
  );

export default cargoRouter;
