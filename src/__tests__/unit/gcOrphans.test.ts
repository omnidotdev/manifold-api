import { describe, expect, test } from "bun:test";

import { selectOrphans } from "lib/jobs/gcOrphanedBlobs";

const OLD = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const FRESH = new Date(Date.now() - 60 * 1000).toISOString();
const cutoff = Date.now() - 6 * 60 * 60 * 1000; // 6h grace

const art = (digest: string, createdAt: string | null) => ({
  digest,
  createdAt,
});

describe("selectOrphans (GC grace)", () => {
  test("an old, unreferenced artifact is an orphan", () => {
    const out = selectOrphans([art("sha256:a", OLD)], new Set(), cutoff);
    expect(out.map((o) => o.digest)).toEqual(["sha256:a"]);
  });

  test("a referenced (live) digest is never an orphan", () => {
    const out = selectOrphans(
      [art("sha256:a", OLD)],
      new Set(["sha256:a"]),
      cutoff,
    );
    expect(out).toEqual([]);
  });

  test("a freshly-uploaded blob (mid-push, before its manifest) is protected", () => {
    // The data-loss race: layer uploaded, manifest not yet PUT -> not live, but
    // younger than the grace window -> must NOT be collected.
    const out = selectOrphans([art("sha256:layer", FRESH)], new Set(), cutoff);
    expect(out).toEqual([]);
  });

  test("an artifact with unknown (null) age is protected", () => {
    const out = selectOrphans([art("sha256:x", null)], new Set(), cutoff);
    expect(out).toEqual([]);
  });

  test("mixes: collects only old + unreferenced", () => {
    const out = selectOrphans(
      [
        art("sha256:old-orphan", OLD),
        art("sha256:old-live", OLD),
        art("sha256:fresh-orphan", FRESH),
      ],
      new Set(["sha256:old-live"]),
      cutoff,
    );
    expect(out.map((o) => o.digest)).toEqual(["sha256:old-orphan"]);
  });
});
