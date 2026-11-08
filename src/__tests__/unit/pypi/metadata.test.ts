import { describe, expect, test } from "bun:test";

import { parseFilename } from "lib/pypi/metadata";

describe("parseFilename", () => {
  test("parses a wheel", () => {
    expect(parseFilename("odk_pdk-0.1.0-py3-none-any.whl")).toEqual({
      filetype: "bdist_wheel",
      name: "odk-pdk",
      version: "0.1.0",
    });
  });

  test("parses a wheel with a build tag", () => {
    expect(parseFilename("pkg-1.0-1-py3-none-any.whl")).toEqual({
      filetype: "bdist_wheel",
      name: "pkg",
      version: "1.0",
    });
  });

  test("parses an sdist (.tar.gz)", () => {
    expect(parseFilename("odk_pdk-0.1.0.tar.gz")).toEqual({
      filetype: "sdist",
      name: "odk-pdk",
      version: "0.1.0",
    });
  });

  test("parses an sdist (.zip)", () => {
    expect(parseFilename("Flask-2.3.0.zip")).toEqual({
      filetype: "sdist",
      name: "flask",
      version: "2.3.0",
    });
  });

  test("throws on an unknown extension", () => {
    expect(() => parseFilename("odk_pdk-0.1.0.exe")).toThrow();
  });

  test("throws on a path-traversal filename", () => {
    expect(() => parseFilename("../etc-1.0.tar.gz")).toThrow();
  });
});
