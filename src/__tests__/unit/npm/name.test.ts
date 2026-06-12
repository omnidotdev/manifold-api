import { describe, expect, test } from "bun:test";

import { isValidNpmName, parsePackagePath } from "lib/npm/name";

describe("npm name", () => {
  test("accepts a valid scoped name", () => {
    expect(isValidNpmName("@coopbri/astro")).toBe(true);
  });
  test("rejects unscoped, uppercase, leading dot, and overlong names", () => {
    expect(isValidNpmName("astro")).toBe(false);
    expect(isValidNpmName("@Coopbri/Astro")).toBe(false);
    expect(isValidNpmName("@coopbri/.hidden")).toBe(false);
    expect(isValidNpmName(`@coopbri/${"a".repeat(215)}`)).toBe(false);
  });
  test("parsePackagePath splits scope and package", () => {
    expect(parsePackagePath("coopbri", "astro")).toEqual({
      scope: "coopbri",
      pkg: "astro",
      full: "@coopbri/astro",
      unscoped: "astro",
    });
  });
});
