/**
 * @file Adapt pip/Twine HTTP Basic auth to Manifold registry tokens.
 *
 * pip and twine send the API token as HTTP Basic auth, conventionally with the
 * username `__token__` and the token as the password. This extracts the token;
 * validation is delegated to the shared registry-token logic by the callers.
 */

/**
 * Extract the token from a `Basic` Authorization header. The password component
 * is treated as the token (any username is accepted). Returns null if the
 * header is missing, not Basic, or has no `username:password` form.
 */
export const extractTokenFromBasic = (
  authHeader: string | null,
): string | null => {
  if (!authHeader) return null;

  const match = /^Basic\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(match[1], "base64").toString("utf8");
  } catch {
    return null;
  }

  const sep = decoded.indexOf(":");
  if (sep === -1) return null;

  const password = decoded.slice(sep + 1);
  return password.length > 0 ? password : null;
};
