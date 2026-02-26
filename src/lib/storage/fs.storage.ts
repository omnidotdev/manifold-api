import { mkdir, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { BlobStorage } from "lib/storage/storage";

/**
 * Parse a digest string into algorithm and hash components.
 * @param digest - Digest in "algo:hash" format
 * @returns Parsed algorithm and hash
 */
const parseDigest = (digest: string): { algorithm: string; hash: string } => {
  const colonIdx = digest.indexOf(":");

  if (colonIdx === -1) {
    throw new Error(`Invalid digest format: ${digest}`);
  }

  return {
    algorithm: digest.slice(0, colonIdx),
    hash: digest.slice(colonIdx + 1),
  };
};

/**
 * Filesystem-backed blob storage.
 *
 * Stores blobs in a content-addressed directory structure:
 * `{baseDir}/{algorithm}/{first2chars}/{hash}`
 */
class FsStorage implements BlobStorage {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Resolve the filesystem path for a digest.
   */
  private resolvePath(digest: string): string {
    const { algorithm, hash } = parseDigest(digest);
    const prefix = hash.slice(0, 2);

    return join(this.baseDir, algorithm, prefix, hash);
  }

  async put(digest: string, content: Uint8Array): Promise<string> {
    const filePath = this.resolvePath(digest);

    await mkdir(dirname(filePath), { recursive: true });
    await Bun.write(filePath, content);

    return filePath;
  }

  async get(digest: string): Promise<Uint8Array | null> {
    const filePath = this.resolvePath(digest);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return null;
    }

    const buffer = await file.arrayBuffer();

    return new Uint8Array(buffer);
  }

  async exists(digest: string): Promise<boolean> {
    const filePath = this.resolvePath(digest);

    return Bun.file(filePath).exists();
  }

  async delete(digest: string): Promise<void> {
    const filePath = this.resolvePath(digest);

    try {
      await unlink(filePath);
    } catch (err) {
      // Ignore ENOENT (file already deleted)
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }
}

export { FsStorage };
