import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { checkStorageStatus } from "lib/storage/health";
import { FsStorage } from "lib/storage/fs.storage";

import type { BlobStorage } from "lib/storage/storage";

describe("checkStorageStatus", () => {
  let baseDir: string;
  let storage: FsStorage;

  beforeAll(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "manifold-health-"));
    storage = new FsStorage(baseDir);
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  test("reports connected for a reachable backend (probe object absent)", async () => {
    // Regression: the probe digest must be a VALID digest. A malformed digest
    // throws in parseDigest before any backend call, so a perfectly reachable
    // store is misreported as unreachable (the real /health bug)
    expect(await checkStorageStatus(storage)).toBe("connected");
  });

  test("reports unreachable when the backend throws", async () => {
    const failing: Pick<BlobStorage, "exists"> = {
      exists: async () => {
        throw new Error("connection refused");
      },
    };

    expect(await checkStorageStatus(failing)).toBe("unreachable");
  });
});
