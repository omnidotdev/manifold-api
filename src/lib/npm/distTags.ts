import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import {
  namespaceTable,
  npmDistTagTable,
  repositoryTable,
  tagTable,
} from "lib/db/schema";
import { requireNpmWrite } from "lib/npm/auth";
import { npmError } from "lib/npm/errors";

type Set = { status?: number; headers: Record<string, string> };

/** Resolve a public namespace + npm repository by scope/pkg, or null. */
const resolveRepo = async (scope: string, pkg: string) => {
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, scope))
    .limit(1);
  if (!ns) return null;
  const [repo] = await dbPool
    .select()
    .from(repositoryTable)
    .where(
      and(
        eq(repositoryTable.namespaceId, ns.id),
        eq(repositoryTable.name, pkg),
        eq(repositoryTable.artifactType, "npm"),
      ),
    )
    .limit(1);
  if (!repo) return null;
  return { ns, repo };
};

/** Handle `GET /npm/-/package/@:scope/:pkg/dist-tags`. */
export const listDistTagsHandler = async (
  scope: string,
  pkg: string,
  set: Set,
) => {
  const resolved = await resolveRepo(scope, pkg);
  if (!resolved) {
    set.status = 404;
    return npmError("package not found");
  }
  const rows = await dbPool
    .select({ tag: npmDistTagTable.tag, version: npmDistTagTable.version })
    .from(npmDistTagTable)
    .where(eq(npmDistTagTable.repositoryId, resolved.repo.id));
  const tags: Record<string, string> = {};
  for (const row of rows) tags[row.tag] = row.version;
  return tags;
};

/** Authenticate a write request and require the token to own `scope`. */
const requireScopeWrite = async (scope: string, request: Request, set: Set) => {
  let auth: Awaited<ReturnType<typeof requireNpmWrite>>;
  try {
    auth = await requireNpmWrite(request.headers.get("Authorization"));
  } catch (e: unknown) {
    set.status = 401;
    return { error: npmError((e as Error).message) };
  }
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);
  if (!ns || ns.name !== scope) {
    set.status = 403;
    return { error: npmError("token not authorized for this scope") };
  }
  return { ns };
};

/** Handle `PUT /npm/-/package/@:scope/:pkg/dist-tags/:tag` (body = JSON version string). */
export const setDistTagHandler = async (
  scope: string,
  pkg: string,
  tag: string,
  request: Request,
  set: Set,
) => {
  const authResult = await requireScopeWrite(scope, request, set);
  if ("error" in authResult) return authResult.error;

  let version: unknown;
  try {
    version = await request.json();
  } catch {
    set.status = 400;
    return npmError("invalid body: expected a JSON version string");
  }
  if (typeof version !== "string") {
    set.status = 400;
    return npmError("invalid body: expected a JSON version string");
  }

  const resolved = await resolveRepo(scope, pkg);
  if (!resolved) {
    set.status = 404;
    return npmError("package not found");
  }

  // The version must already be published
  const [tagged] = await dbPool
    .select({ id: tagTable.id })
    .from(tagTable)
    .where(
      and(
        eq(tagTable.repositoryId, resolved.repo.id),
        eq(tagTable.name, version),
      ),
    )
    .limit(1);
  if (!tagged) {
    set.status = 404;
    return npmError(`version not found: ${version}`);
  }

  await dbPool
    .insert(npmDistTagTable)
    .values({ repositoryId: resolved.repo.id, tag, version })
    .onConflictDoUpdate({
      target: [npmDistTagTable.repositoryId, npmDistTagTable.tag],
      set: { version },
    });

  return { ok: true };
};

/** Handle `DELETE /npm/-/package/@:scope/:pkg/dist-tags/:tag`. */
export const deleteDistTagHandler = async (
  scope: string,
  pkg: string,
  tag: string,
  request: Request,
  set: Set,
) => {
  const authResult = await requireScopeWrite(scope, request, set);
  if ("error" in authResult) return authResult.error;

  // `latest` is required; never let it be removed
  if (tag === "latest") {
    set.status = 400;
    return npmError("cannot delete the `latest` dist-tag");
  }

  const resolved = await resolveRepo(scope, pkg);
  if (!resolved) {
    set.status = 404;
    return npmError("package not found");
  }

  await dbPool
    .delete(npmDistTagTable)
    .where(
      and(
        eq(npmDistTagTable.repositoryId, resolved.repo.id),
        eq(npmDistTagTable.tag, tag),
      ),
    );

  return { ok: true };
};
