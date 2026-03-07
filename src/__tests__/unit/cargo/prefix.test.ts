import { describe, expect, test } from "bun:test";

import { cratePrefix, isValidCrateName } from "lib/cargo/prefix";

describe("cratePrefix", () => {
  test("1-char crate", () => {
    expect(cratePrefix("a")).toBe("1");
  });

  test("2-char crate", () => {
    expect(cratePrefix("ab")).toBe("2");
  });

  test("3-char crate", () => {
    expect(cratePrefix("abc")).toBe("3/a");
  });

  test("4+ char crate", () => {
    expect(cratePrefix("abcd")).toBe("ab/cd");
    expect(cratePrefix("beacon-gateway")).toBe("be/ac");
    expect(cratePrefix("agent-core")).toBe("ag/en");
  });

  test("case insensitive", () => {
    expect(cratePrefix("MyLib")).toBe("my/li");
  });
});

describe("isValidCrateName", () => {
  test("valid names", () => {
    expect(isValidCrateName("beacon-gateway")).toBe(true);
    expect(isValidCrateName("agent_core")).toBe(true);
    expect(isValidCrateName("a")).toBe(true);
  });

  test("invalid names", () => {
    expect(isValidCrateName("")).toBe(false);
    expect(isValidCrateName("123abc")).toBe(false);
    expect(isValidCrateName("-foo")).toBe(false);
    expect(isValidCrateName("foo bar")).toBe(false);
  });
});
