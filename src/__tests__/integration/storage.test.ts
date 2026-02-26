import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { FsStorage } from "lib/storage/fs.storage";

import type { BlobStorage } from "lib/storage/storage";

describe("FsStorage", () => {
  let tempDir: string;
  let storage: BlobStorage;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "manifold-blob-test-"));
    storage = new FsStorage(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("stores and retrieves a blob by digest", async () => {
    const content = new TextEncoder().encode("hello blob storage");
    const digest = "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    const path = await storage.put(digest, content);
    expect(path).toBeTruthy();

    const retrieved = await storage.get(digest);
    expect(retrieved).not.toBeNull();
    expect(retrieved).toEqual(content);
  });

  test("returns null for a missing blob", async () => {
    const digest = "sha256:0000000000000000000000000000000000000000000000000000000000000000";

    const result = await storage.get(digest);
    expect(result).toBeNull();
  });

  test("checks existence of a stored blob", async () => {
    const content = new TextEncoder().encode("existence check");
    const digest = "sha256:1111111111111111111111111111111111111111111111111111111111111111";

    expect(await storage.exists(digest)).toBe(false);

    await storage.put(digest, content);
    expect(await storage.exists(digest)).toBe(true);
  });

  test("deletes a stored blob", async () => {
    const content = new TextEncoder().encode("delete me");
    const digest = "sha256:2222222222222222222222222222222222222222222222222222222222222222";

    await storage.put(digest, content);
    expect(await storage.exists(digest)).toBe(true);

    await storage.delete(digest);
    expect(await storage.exists(digest)).toBe(false);

    const result = await storage.get(digest);
    expect(result).toBeNull();
  });

  test("handles delete of non-existent blob without error", async () => {
    const digest = "sha256:3333333333333333333333333333333333333333333333333333333333333333";

    // Should not throw
    await storage.delete(digest);
  });

  test("stores blob in content-addressed path structure", async () => {
    const content = new TextEncoder().encode("path structure test");
    const digest = "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    const path = await storage.put(digest, content);

    // Path should follow {baseDir}/{algo}/{first2chars}/{hash} pattern
    expect(path).toContain("sha256");
    expect(path).toContain("ab");
  });

  test("overwrites existing blob content", async () => {
    const digest = "sha256:4444444444444444444444444444444444444444444444444444444444444444";

    const original = new TextEncoder().encode("original");
    await storage.put(digest, original);

    const updated = new TextEncoder().encode("updated");
    await storage.put(digest, updated);

    const retrieved = await storage.get(digest);
    expect(retrieved).toEqual(updated);
  });
});
