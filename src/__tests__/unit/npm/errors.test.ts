import { describe, expect, test } from "bun:test";

import { npmError } from "lib/npm/errors";

describe("npm error", () => {
  test("wraps a reason in npm's { error } shape", () => {
    expect(npmError("not found")).toEqual({ error: "not found" });
  });
});
