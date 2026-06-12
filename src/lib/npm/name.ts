const SEGMENT = /^[a-z0-9][a-z0-9._-]*$/;

/** Validate a scoped npm package name like `@scope/pkg`. */
export const isValidNpmName = (name: string): boolean => {
  if (name.length > 214) return false;
  const m = /^@([^/]+)\/([^/]+)$/.exec(name);
  if (!m) return false;
  const [, scope, pkg] = m;
  return SEGMENT.test(scope) && SEGMENT.test(pkg);
};

interface ParsedPackage {
  scope: string;
  pkg: string;
  full: string;
  unscoped: string;
}

/** Build the parsed package identity from URL scope + package segments. */
export const parsePackagePath = (
  scope: string,
  pkg: string,
): ParsedPackage => ({
  scope,
  pkg,
  full: `@${scope}/${pkg}`,
  unscoped: pkg,
});
