import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import { createResilientS3Client } from "lib/storage/s3Client";
import { parseDigest } from "lib/storage/util";

import type { S3Client } from "@aws-sdk/client-s3";
import type { BlobStorage } from "lib/storage/storage";

type S3StorageConfig = {
  bucket: string;
  region?: string;
  endpoint?: string;
  prefix?: string;
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

    this.client = createResilientS3Client({
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

  async putStream(
    digest: string,
    stream: ReadableStream,
    size?: number,
  ): Promise<string> {
    const key = this.resolveKey(digest);

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: "application/octet-stream",
        ...(size ? { ContentLength: size } : {}),
      },
    });

    await upload.done();

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

  async getStream(
    digest: string,
  ): Promise<{ stream: ReadableStream; size: number } | null> {
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

      return {
        stream: response.Body.transformToWebStream() as ReadableStream,
        size: response.ContentLength ?? 0,
      };
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
