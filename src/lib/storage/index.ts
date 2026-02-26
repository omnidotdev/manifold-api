import {
  BLOB_S3_BUCKET,
  BLOB_S3_ENDPOINT,
  BLOB_S3_PREFIX,
  BLOB_S3_REGION,
  BLOB_STORAGE_BACKEND,
  BLOB_STORAGE_DIR,
} from "lib/config/env.config";
import { FsStorage } from "lib/storage/fs.storage";
import { S3Storage } from "lib/storage/s3.storage";

import type { BlobStorage } from "lib/storage/storage";

const DEFAULT_BLOB_DIR = "/data/manifold/blobs";

/**
 * Create a blob storage backend based on configuration.
 *
 * Reads `BLOB_STORAGE_BACKEND` env var to select the implementation:
 * - "fs" (default): filesystem storage
 * - "s3": S3-compatible storage (AWS, MinIO, R2)
 */
const createStorage = (): BlobStorage => {
  const backend = BLOB_STORAGE_BACKEND ?? "fs";

  switch (backend) {
    case "s3": {
      if (!BLOB_S3_BUCKET) {
        throw new Error("BLOB_S3_BUCKET is required for S3 storage backend");
      }

      return new S3Storage({
        bucket: BLOB_S3_BUCKET,
        region: BLOB_S3_REGION,
        endpoint: BLOB_S3_ENDPOINT,
        prefix: BLOB_S3_PREFIX,
      });
    }

    case "fs":
      return new FsStorage(
        BLOB_STORAGE_DIR ?? process.env.BLOB_STORAGE_DIR ?? DEFAULT_BLOB_DIR,
      );

    default:
      throw new Error(`Unknown blob storage backend: ${backend}`);
  }
};

let _storage: BlobStorage | null = null;

/**
 * Lazy singleton blob storage instance.
 * Deferred to allow test environments to set env vars before first use.
 */
const storage: BlobStorage = new Proxy({} as BlobStorage, {
  get(_target, prop) {
    if (!_storage) {
      _storage = createStorage();
    }

    const value = _storage[prop as keyof BlobStorage];

    if (typeof value === "function") {
      return value.bind(_storage);
    }

    return value;
  },
});

export { storage };
