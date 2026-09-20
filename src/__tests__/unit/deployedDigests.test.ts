import { describe, expect, test } from "bun:test";

import { digestFromImageRef } from "lib/jobs/deployedDigests";

describe("digestFromImageRef", () => {
  test("extracts the sha256 digest from a digest-pinned ref", () => {
    expect(
      digestFromImageRef("10.0.1.10:30501/omni/vortex-worker@sha256:abc123"),
    ).toBe("sha256:abc123");
  });

  test("returns null for a bare tag ref (host port must not confuse it)", () => {
    expect(
      digestFromImageRef("10.0.1.10:30501/omni/vortex-worker:1607d13"),
    ).toBeNull();
  });

  test("returns null for a non-string or non-sha256 reference", () => {
    expect(digestFromImageRef(undefined)).toBeNull();
    expect(digestFromImageRef(123)).toBeNull();
    expect(digestFromImageRef("repo@md5:xyz")).toBeNull();
  });
});
