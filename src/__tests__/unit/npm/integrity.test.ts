import { describe, expect, test } from "bun:test";

import { computeIntegrity } from "lib/npm/integrity";

describe("npm integrity", () => {
  test("computes sha1 shasum and sha512 SRI for empty bytes", () => {
    const { shasum, integrity } = computeIntegrity(new Uint8Array(0));
    expect(shasum).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
    expect(integrity).toBe(
      "sha512-z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==",
    );
  });
});
