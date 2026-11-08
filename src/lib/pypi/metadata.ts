/**
 * @file Parse PyPI distribution filenames (wheel and sdist).
 */

import { normalizeProjectName } from "lib/pypi/normalize";

interface ParsedFilename {
  filetype: "sdist" | "bdist_wheel";
  /** PEP 503 normalized project name */
  name: string;
  version: string;
}

const SDIST_EXTENSIONS = [".tar.gz", ".zip", ".tar.bz2"];

/** Reject anything that could escape the storage namespace */
const assertSafe = (filename: string): void => {
  if (
    !filename ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..")
  ) {
    throw new Error(`unsafe distribution filename: ${filename}`);
  }
};

/**
 * Parse a distribution filename into its name, version, and type.
 *
 * Wheel (PEP 427): `{distribution}-{version}(-{build})?-{py}-{abi}-{plat}.whl`
 * sdist (PEP 625): `{distribution}-{version}.tar.gz` (or .zip/.tar.bz2)
 *
 * The distribution component is normalized to its PEP 503 form.
 */
export const parseFilename = (filename: string): ParsedFilename => {
  assertSafe(filename);

  if (filename.endsWith(".whl")) {
    const parts = filename.slice(0, -4).split("-");
    if (parts.length < 5 || !parts[0] || !parts[1]) {
      throw new Error(`malformed wheel filename: ${filename}`);
    }
    return {
      filetype: "bdist_wheel",
      name: normalizeProjectName(parts[0]),
      version: parts[1],
    };
  }

  const ext = SDIST_EXTENSIONS.find((e) => filename.endsWith(e));
  if (ext) {
    const base = filename.slice(0, -ext.length);
    const sep = base.lastIndexOf("-");
    if (sep <= 0 || sep === base.length - 1) {
      throw new Error(`malformed sdist filename: ${filename}`);
    }
    return {
      filetype: "sdist",
      name: normalizeProjectName(base.slice(0, sep)),
      version: base.slice(sep + 1),
    };
  }

  throw new Error(`unsupported distribution extension: ${filename}`);
};
