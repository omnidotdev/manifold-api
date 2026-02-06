import type { TokenScope } from "lib/db/schema";

type Permission = "read" | "write" | "admin";

const SCOPE_HIERARCHY: Record<Permission, number> = {
  read: 1,
  write: 2,
  admin: 3,
};

/**
 * Token observer context from authentication.
 */
export interface TokenContext {
  scope: TokenScope;
  namespaceId: string;
  repositoryId: string | null;
}

/**
 * Check if a token has the required permission for a resource.
 *
 * @param token - Token context from authentication
 * @param namespaceId - Target namespace ID
 * @param repositoryId - Target repository ID (optional)
 * @param requiredPermission - Permission needed for the operation
 * @returns true if authorized
 */
export const checkTokenPermission = (
  token: TokenContext,
  namespaceId: string,
  repositoryId: string | null,
  requiredPermission: Permission,
): boolean => {
  // check namespace scope matches
  if (token.namespaceId !== namespaceId) return false;

  // if token is scoped to specific repo, check it matches
  if (token.repositoryId !== null && token.repositoryId !== repositoryId) {
    return false;
  }

  // check permission level (hierarchy: read < write < admin)
  return SCOPE_HIERARCHY[token.scope] >= SCOPE_HIERARCHY[requiredPermission];
};
