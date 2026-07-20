import { describe, expect, test } from "bun:test";

import { countTrivySeverities, emptyCounts } from "lib/scan/severity";

describe("countTrivySeverities", () => {
  test("empty / malformed input yields zero counts (no throw)", () => {
    expect(countTrivySeverities(null)).toEqual(emptyCounts());
    expect(countTrivySeverities({})).toEqual(emptyCounts());
    expect(countTrivySeverities({ Results: "nope" })).toEqual(emptyCounts());
    expect(countTrivySeverities({ Results: [{}] })).toEqual(emptyCounts());
  });

  test("counts by severity across results", () => {
    const report = {
      Results: [
        {
          Vulnerabilities: [
            { Severity: "CRITICAL" },
            { Severity: "high" },
            { Severity: "HIGH" },
            { Severity: "MEDIUM" },
          ],
        },
        {
          Vulnerabilities: [
            { Severity: "LOW" },
            { Severity: "UNKNOWN" },
            { Severity: "weird" },
            {},
          ],
        },
      ],
    };
    expect(countTrivySeverities(report)).toEqual({
      critical: 1,
      high: 2,
      medium: 1,
      low: 1,
      unknown: 3,
    });
  });
});
