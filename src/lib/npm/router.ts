import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import {
  deleteDistTagHandler,
  listDistTagsHandler,
  setDistTagHandler,
} from "lib/npm/distTags";
import { packumentHandler } from "lib/npm/packument";
import { publishHandler } from "lib/npm/publish";
import { tarballHandler } from "lib/npm/tarball";

/** Narrowed `set` shape accepted by npm handlers */
type HandlerSet = { status?: number; headers: Record<string, string> };

const scopePkg = t.Object({ scope: t.String(), pkg: t.String() });
const scopedParam = t.Object({ scope: t.String() });

/**
 * Parse a single URL-encoded scoped segment into scope + pkg. npm/bun address
 * scoped packages as one segment `@scope%2Fpkg` (the slash percent-encoded), so
 * the `@:scope` route captures `scope%2Fpkg`; decode it and split on the slash.
 * Elysia's router requires the first-segment param to share a name across
 * routes, so this one-segment route reuses `scope` and parses it here.
 */
const parseScopedParam = (raw: string) => {
  const decoded = decodeURIComponent(raw);
  const slash = decoded.indexOf("/");
  return { scope: decoded.slice(0, slash), pkg: decoded.slice(slash + 1) };
};

/**
 * npm registry router.
 *
 * Mounted at `/npm` and implements (scoped packages only):
 * - Packument (GET /@:scope/:pkg)
 * - Tarball download (GET /@:scope/:pkg/-/:file)
 * - Publish (PUT /@:scope/:pkg)
 * - dist-tags list/set/delete (/-/package/@:scope/:pkg/dist-tags[/:tag])
 */
const npmRouter = new Elysia({ prefix: "/npm" })
  // dist-tags listing (public read)
  .get(
    "/-/package/@:scope/:pkg/dist-tags",
    ({ params, set }) =>
      listDistTagsHandler(params.scope, params.pkg, set as HandlerSet),
    { params: scopePkg },
  )

  // Tarball download (public read; more specific than the packument route)
  .get(
    "/@:scope/:pkg/-/:file",
    ({ params, set, request }) =>
      tarballHandler(
        params.scope,
        params.pkg,
        params.file,
        set as HandlerSet,
        request,
      ),
    {
      params: t.Object({
        scope: t.String(),
        pkg: t.String(),
        file: t.String(),
      }),
    },
  )

  // Packument (public read), unencoded `@scope/pkg` (two path segments)
  .get(
    "/@:scope/:pkg",
    ({ params, set, request }) =>
      packumentHandler(params.scope, params.pkg, set as HandlerSet, request),
    { params: scopePkg },
  )

  // Packument, URL-encoded `@scope%2Fpkg` (one segment, what bun/npm send)
  .get(
    "/@:scope",
    ({ params, set, request }) => {
      const { scope, pkg } = parseScopedParam(params.scope);
      return packumentHandler(scope, pkg, set as HandlerSet, request);
    },
    { params: scopedParam },
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

  // Publish. Skip Elysia's body parser so the handler reads the raw JSON
  // itself (the publish body carries a large base64 tarball).
  .put(
    "/@:scope/:pkg",
    ({ params, request, set }) =>
      publishHandler(params.scope, params.pkg, request, set as HandlerSet),
    { params: scopePkg, parse: "none" },
  )

  // Publish, URL-encoded `@scope%2Fpkg` (one segment, what bun/npm send)
  .put(
    "/@:scope",
    ({ params, request, set }) => {
      const { scope, pkg } = parseScopedParam(params.scope);
      return publishHandler(scope, pkg, request, set as HandlerSet);
    },
    { params: scopedParam, parse: "none" },
  )

  // Set a dist-tag
  .put(
    "/-/package/@:scope/:pkg/dist-tags/:tag",
    ({ params, request, set }) =>
      setDistTagHandler(
        params.scope,
        params.pkg,
        params.tag,
        request,
        set as HandlerSet,
      ),
    {
      params: t.Object({
        scope: t.String(),
        pkg: t.String(),
        tag: t.String(),
      }),
      parse: "none",
    },
  )

  // Delete a dist-tag
  .delete(
    "/-/package/@:scope/:pkg/dist-tags/:tag",
    ({ params, request, set }) =>
      deleteDistTagHandler(
        params.scope,
        params.pkg,
        params.tag,
        request,
        set as HandlerSet,
      ),
    {
      params: t.Object({
        scope: t.String(),
        pkg: t.String(),
        tag: t.String(),
      }),
    },
  );

export default npmRouter;
