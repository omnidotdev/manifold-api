/**
 * @file PEP 503 project-name normalization and PEP 508 name validation.
 */

/**
 * Normalize a Python project name per PEP 503: lowercase and collapse any run
 * of `.`, `-`, or `_` into a single `-`.
 */
export const normalizeProjectName = (name: string): string =>
  name.replace(/[-_.]+/g, "-").toLowerCase();

// PEP 508 name grammar: alphanumeric, with single . _ - separators between
const PROJECT_NAME_PATTERN = /^([A-Z0-9]|[A-Z0-9][A-Z0-9._-]*[A-Z0-9])$/i;

/** Whether a name is a valid PEP 508 project name (pre-normalization). */
export const isValidProjectName = (name: string): boolean =>
  PROJECT_NAME_PATTERN.test(name);
