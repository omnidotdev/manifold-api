import { describe, expect, test } from "bun:test";

import { extractTokenFromBasic } from "lib/pypi/auth";

const basic = (user: string, pass: string) =>
  `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

describe("extractTokenFromBasic", () => {
  test("extracts the password as the token (twine __token__ convention)", () => {
    expect(extractTokenFromBasic(basic("__token__", "mf_abc123"))).toBe(
      "mf_abc123",
    );
  });

  test("works with any username", () => {
    expect(extractTokenFromBasic(basic("anyone", "mf_xyz"))).toBe("mf_xyz");
  });

  test("keeps a password containing a colon intact", () => {
    expect(extractTokenFromBasic(basic("__token__", "a:b:c"))).toBe("a:b:c");
  });

  test("returns null for a non-Basic header", () => {
    expect(extractTokenFromBasic("Bearer mf_abc")).toBeNull();
  });

  test("returns null for null/empty", () => {
    expect(extractTokenFromBasic(null)).toBeNull();
    expect(extractTokenFromBasic("")).toBeNull();
  });

  test("returns null when there is no colon in the decoded value", () => {
    expect(
      extractTokenFromBasic(`Basic ${Buffer.from("nocolon").toString("base64")}`),
    ).toBeNull();
  });
});
