import { describe, expect, test } from "bun:test";

import { buildPackument } from "lib/npm/packument";

describe("npm packument", () => {
  const versions = [
    {
      version: "1.0.0",
      manifest: { description: "astro engine" },
      shasum: "abc123",
      integrity: "sha512-xyz",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  test("assembles a packument with absolute tarball URLs", () => {
    const p = buildPackument(
      "@coopbri/astro",
      versions,
      { latest: "1.0.0" },
      "https://manifold.omni.dev",
    );

    expect(p._id).toBe("@coopbri/astro");
    expect(p.name).toBe("@coopbri/astro");
    expect(p["dist-tags"]).toEqual({ latest: "1.0.0" });

    const v = p.versions["1.0.0"] as {
      dist: { tarball: string; integrity: string };
    };
    expect(v.dist.tarball).toBe(
      "https://manifold.omni.dev/npm/@coopbri/astro/-/astro-1.0.0.tgz",
    );
    expect(v.dist.integrity).toBe("sha512-xyz");
  });
});
