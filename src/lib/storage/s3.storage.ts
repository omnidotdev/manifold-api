import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import type { BlobStorage } from "lib/storage/storage";

type S3StorageConfig = {
  bucket: string;
  region?: string;
  endpoint?: string;
  prefix?: string;
};

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
 * S3-compatible blob storage.
 *
 * Works with AWS S3, MinIO, and Cloudflare R2.
 * Keys follow the pattern: `{prefix}/{algorithm}/{first2chars}/{hash}`
 */
class S3Storage implements BlobStorage {
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.prefix = config.prefix ?? "";

    this.client = new S3Client({
      region: config.region ?? "us-east-1",
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      // Enable path-style for MinIO / local S3
      forcePathStyle: !!config.endpoint,
    });
  }

  /**
   * Resolve the S3 key for a digest.
   */
  private resolveKey(digest: string): string {
    const { algorithm, hash } = parseDigest(digest);
    const shard = hash.slice(0, 2);
    const parts = [algorithm, shard, hash];

    if (this.prefix) {
      parts.unshift(this.prefix);
    }

    return parts.join("/");
  }

  async put(digest: string, content: Uint8Array): Promise<string> {
    const key = this.resolveKey(digest);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: "application/octet-stream",
      }),
    );

    return key;
  }

  async get(digest: string): Promise<Uint8Array | null> {
    const key = this.resolveKey(digest);

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      if (!response.Body) {
        return null;
      }

      const bytes = await response.Body.transformToByteArray();

      return new Uint8Array(bytes);
    } catch (err) {
      if ((err as { name?: string }).name === "NoSuchKey") {
        return null;
      }

      throw err;
    }
  }

  async exists(digest: string): Promise<boolean> {
    const key = this.resolveKey(digest);

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return true;
    } catch (err) {
      if ((err as { name?: string }).name === "NotFound") {
        return false;
      }

      throw err;
    }
  }

  async delete(digest: string): Promise<void> {
    const key = this.resolveKey(digest);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}

export { S3Storage };
