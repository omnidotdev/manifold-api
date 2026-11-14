import { describe, expect, it } from "bun:test";

import { parseUsageCheck } from "./usageClient";

describe("parseUsageCheck", () => {
  it("maps Aether's check verdict (allowed/current) onto the client shape", () => {
    // The exact body Aether's GET /usage/:appId/.../:meterKey/check returns
    expect(
      parseUsageCheck({
        allowed: true,
        current: 0,
        limit: 2_199_023_255_552,
        remaining: 2_199_023_255_552,
      }),
    ).toEqual({
      withinLimit: true,
      value: 0,
      limit: 2_199_023_255_552,
      remaining: 2_199_023_255_552,
    });
  });

  it("reports an over-limit verdict", () => {
    expect(
      parseUsageCheck({ allowed: false, current: 12, limit: 10, remaining: 0 }),
    ).toEqual({ withinLimit: false, value: 12, limit: 10, remaining: 0 });
  });

  it("passes through an unlimited meter (null limit)", () => {
    expect(
      parseUsageCheck({
        allowed: true,
        current: 5,
        limit: null,
        remaining: null,
      }),
    ).toEqual({ withinLimit: true, value: 5, limit: null, remaining: null });
  });

  it("returns null for a body without a boolean verdict so callers fail open", () => {
    expect(parseUsageCheck({ error: "No billing account" })).toBeNull();
    expect(parseUsageCheck(null)).toBeNull();
    expect(parseUsageCheck("nope")).toBeNull();
  });
});
