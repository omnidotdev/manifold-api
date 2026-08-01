/**
 * Split a crate's features for the Cargo index's `features` / `features2` fields.
 *
 * Cargo's index format v2 requires features that use the modern syntax -
 * namespaced dependencies (`dep:foo`) and weak dependency features (`foo?/bar`) -
 * to be placed in `features2` rather than `features`. Older Cargo, which does
 * not understand the syntax, reads only `features` and ignores `features2`;
 * newer Cargo merges the two. A feature belongs in `features2` if ANY of its
 * values uses the new syntax; otherwise it stays in `features`.
 *
 * Emitting such a value in `features` (as this registry previously did) makes
 * Cargo reject the whole index entry as invalid, so a published crate cannot be
 * used as a dependency.
 *
 * @see https://doc.rust-lang.org/cargo/reference/registry-index.html#json-schema
 */
export const splitCargoFeatures = (
  features: Record<string, string[]> | null | undefined,
): {
  features: Record<string, string[]>;
  features2: Record<string, string[]>;
} => {
  const plain: Record<string, string[]> = {};
  const extended: Record<string, string[]> = {};

  for (const [name, values] of Object.entries(features ?? {})) {
    const usesNewSyntax = values.some(
      (value) => value.startsWith("dep:") || value.includes("?/"),
    );
    (usesNewSyntax ? extended : plain)[name] = values;
  }

  return { features: plain, features2: extended };
};
