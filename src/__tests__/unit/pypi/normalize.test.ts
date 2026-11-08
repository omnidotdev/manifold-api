import { describe, expect, test } from "bun:test";

import { isValidProjectName, normalizeProjectName } from "lib/pypi/normalize";

describe("normalizeProjectName (PEP 503)", () => {
  test("lowercases", () => {
    expect(normalizeProjectName("ODK")).toBe("odk");
  });

  test("collapses runs of . _ - into a single -", () => {
    expect(normalizeProjectName("odk_pdk")).toBe("odk-pdk");
    expect(normalizeProjectName("Foo..__Bar")).toBe("foo-bar");
    expect(normalizeProjectName("a---b")).toBe("a-b");
  });

  test("is idempotent", () => {
    const once = normalizeProjectName("Django.REST_framework");
    expect(normalizeProjectName(once)).toBe(once);
    expect(once).toBe("django-rest-framework");
  });
});

describe("isValidProjectName (PEP 508)", () => {
  test("accepts valid names", () => {
    expect(isValidProjectName("odk-pdk")).toBe(true);
    expect(isValidProjectName("Flask")).toBe(true);
    expect(isValidProjectName("a")).toBe(true);
    expect(isValidProjectName("zope.interface")).toBe(true);
  });

  test("rejects empty, separator-edged, and illegal names", () => {
    expect(isValidProjectName("")).toBe(false);
    expect(isValidProjectName("-foo")).toBe(false);
    expect(isValidProjectName("foo-")).toBe(false);
    expect(isValidProjectName("foo/bar")).toBe(false);
    expect(isValidProjectName("foo bar")).toBe(false);
  });
});
