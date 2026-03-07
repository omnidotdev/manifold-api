/**
 * Compute the sparse index prefix path for a crate name.
 *
 * @see https://doc.rust-lang.org/cargo/reference/registry-index.html
 *
 * - 1-char names: `1/`
 * - 2-char names: `2/`
 * - 3-char names: `3/{first-char}/`
 * - 4+ char names: `{first-two}/{next-two}/`
 */
export const cratePrefix = (name: string): string => {
  const lower = name.toLowerCase();

  switch (lower.length) {
    case 1:
      return "1";
    case 2:
      return "2";
    case 3:
      return `3/${lower[0]}`;
    default:
      return `${lower.slice(0, 2)}/${lower.slice(2, 4)}`;
  }
};

/**
 * Validate a crate name follows Cargo naming rules.
 *
 * - Alphanumeric, `-`, or `_`
 * - Starts with a letter
 * - 1-64 characters
 */
export const isValidCrateName = (name: string): boolean =>
  /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(name);
