import { and, eq } from "drizzle-orm";

import { checkTokenPermission } from "lib/auth/checkTokenPermission";
import { hashToken, isValidTokenFormat } from "lib/auth/token";
import { dbPool } from "lib/db";
import { apiTokenTable, namespaceTable, repositoryTable } from "lib/db/schema";

import type { TokenScope } from "lib/db/schema";

/**
 * OCI registry authorization, mirroring the npm/cargo model: public
 * repositories are anonymously readable, but every write and every private read
 * requires a Manifold `mf_` token whose namespace owns the target repository and
 * whose scope covers the operation. This replaces the earlier single shared
 * static token, which had no per-namespace, per-user, or scope enforcement.
 *
 * Enforcement is gated by `REGISTRY_REQUIRE_AUTH` at the router: OFF preserves
 * the fully-open behaviour the in-cluster build pipeline relies on; ON turns on
 * everything below.
 */

/** `WWW-Authenticate` challenge returned on a 401 so clients know to auth. */
export const registryAuthChallenge = 'Basic realm="Manifold Registry"';

/**
 * Should this OCI request be refused as an anonymous public WRITE?
 *
 * The `/v2` registry is published on the same public host as the product API
 * (`api.manifold.omni.dev`). While REGISTRY_REQUIRE_AUTH is off the registry is
 * fully open, which over a PUBLIC host means the open internet can push,
 * overwrite, and delete images in the shared namespace -- a supply-chain path
 * into every deploy. The in-cluster build pipeline reaches the registry over a
 * different (NodePort/service-DNS) Host, and the gateway routes the public
 * hostname here only when the Host IS that hostname, so a public client cannot
 * spoof an internal Host. Refusing writes whose Host equals the public host
 * therefore blocks anonymous public writes without touching the in-cluster
 * pipeline. Caller passes `publicHost` (null disables the guard); once
 * REGISTRY_REQUIRE_AUTH is on, real per-token authz supersedes this.
 */
export const isPublicRegistryWrite = (
  method: string,
  host: string | null,
  publicHost: string | null,
): boolean => {
  if (!publicHost) return false;
  const isWrite =
    method === "PUT" ||
    method === "POST" ||
    method === "PATCH" ||
    method === "DELETE";
  if (!isWrite) return false;
  // Strip any :port and compare case-insensitively.
  const reqHost = (host ?? "").toLowerCase().split(":")[0];
  return reqHost === publicHost;
};

export interface OciTokenAuth {
  namespaceId: string;
  repositoryId: string | null;
  scope: TokenScope;
}

/** Pull the token out of a Basic (`base64(user:token)`) or Bearer header. */
const extractToken = (authHeader: string | null): string | null => {
  if (!authHeader) return null;
  const [scheme, rest] = authHeader.split(" ");
  if (!scheme || !rest) return null;
  const kind = scheme.toLowerCase();
  if (kind === "bearer") return rest.trim();
  if (kind === "basic") {
    // Docker/containerd send `base64(username:password)`; the password is the
    // token and the username is ignored (matches `docker login` UX).
    try {
      const decoded = Buffer.from(rest, "base64").toString("utf8");
      const sep = decoded.indexOf(":");
      return sep === -1 ? decoded : decoded.slice(sep + 1);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Authenticate an OCI request's credentials to an active `mf_` token, or null.
 * Accepts Basic (docker) and Bearer.
 */
export const authenticateOciToken = async (
  authHeader: string | null,
): Promise<OciTokenAuth | null> => {
  const token = extractToken(authHeader);
  if (!token || !isValidTokenFormat(token)) return null;

  const hash = hashToken(token);
  const [row] = await dbPool
    .select()
    .from(apiTokenTable)
    .where(
      and(eq(apiTokenTable.tokenHash, hash), eq(apiTokenTable.isActive, true)),
    )
    .limit(1);
  if (!row) return null;
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;

  void dbPool
    .update(apiTokenTable)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiTokenTable.id, row.id))
    .catch(() => {});

  return {
    namespaceId: row.namespaceId,
    repositoryId: row.repositoryId,
    scope: row.scope as TokenScope,
  };
};

type OciOperation = "read" | "write";

type OciAuthDecision =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string; challenge: boolean };

/** Minimal resolved state the pure decision needs. */
interface OciNamespaceState {
  id: string;
}
interface OciRepoState {
  id: string;
  isPublic: boolean;
}

/**
 * Pure authorization decision given already-resolved state (no I/O). This is the
 * security-critical core, kept side-effect-free so it is unit-testable:
 *
 * - Public repositories are anonymously readable.
 * - Everything else requires a token whose namespace owns the target and whose
 *   scope (read < write < admin, plus optional repo-scoping) covers the op.
 * - A first push (repo undefined) is a write against the namespace; a
 *   namespace-scoped write/admin token may create the repo, a repo-scoped token
 *   may not (repositoryId won't match a null target repo).
 */
export const decideOciAccess = (
  operation: OciOperation,
  ns: OciNamespaceState | undefined,
  repo: OciRepoState | undefined,
  auth: OciTokenAuth | null,
): OciAuthDecision => {
  if (operation === "read" && repo?.isPublic) return { ok: true };

  if (!auth) {
    return {
      ok: false,
      status: 401,
      error: "authentication required",
      challenge: true,
    };
  }

  // Ownership: the token's namespace must be the target namespace.
  if (!ns || auth.namespaceId !== ns.id) {
    return {
      ok: false,
      status: 403,
      error: "not authorized for this namespace",
      challenge: false,
    };
  }

  const allowed = checkTokenPermission(
    {
      scope: auth.scope,
      namespaceId: auth.namespaceId,
      repositoryId: auth.repositoryId,
    },
    ns.id,
    repo?.id ?? null,
    operation,
  );
  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: `insufficient permissions: ${operation} scope required`,
      challenge: false,
    };
  }
  return { ok: true };
};

/**
 * Authorize an OCI `read`/`write` against `<namespace>/<repo>`. Resolves the
 * namespace + repo, short-circuits anonymous public reads (the hot path, no
 * token lookup), then applies {@link decideOciAccess}.
 */
export const authorizeOci = async (
  namespaceName: string,
  repoName: string,
  operation: OciOperation,
  authHeader: string | null,
): Promise<OciAuthDecision> => {
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespaceName))
    .limit(1);
  const repo = ns
    ? (
        await dbPool
          .select()
          .from(repositoryTable)
          .where(
            and(
              eq(repositoryTable.namespaceId, ns.id),
              eq(repositoryTable.name, repoName),
            ),
          )
          .limit(1)
      )[0]
    : undefined;

  if (operation === "read" && repo?.isPublic) return { ok: true };

  const auth = await authenticateOciToken(authHeader);
  return decideOciAccess(
    operation,
    ns ? { id: ns.id } : undefined,
    repo ? { id: repo.id, isPublic: repo.isPublic } : undefined,
    auth,
  );
};
