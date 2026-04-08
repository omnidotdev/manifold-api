/**
 * Pluggable blob storage interface for artifact content.
 *
 * Implementations store binary content addressed by digest,
 * keeping large blobs out of the database.
 */
interface BlobStorage {
  /**
   * Store blob content.
   * @param digest - Content-addressed digest (e.g. "sha256:abc...")
   * @param content - Binary content to store
   * @returns Storage path/key for the blob
   */
  put(digest: string, content: Uint8Array): Promise<string>;

  /**
   * Store blob content from a stream (multipart upload).
   * @param digest - Content-addressed digest
   * @param stream - Readable stream of binary content
   * @param size - Optional content length hint
   * @returns Storage path/key for the blob
   */
  putStream(
    digest: string,
    stream: ReadableStream,
    size?: number,
  ): Promise<string>;

  /**
   * Retrieve blob content.
   * @param digest - Content-addressed digest
   * @returns Binary content, or null if not found
   */
  get(digest: string): Promise<Uint8Array | null>;

  /**
   * Retrieve blob content as a stream.
   * @param digest - Content-addressed digest
   * @returns Readable stream and size, or null if not found
   */
  getStream(
    digest: string,
  ): Promise<{ stream: ReadableStream; size: number } | null>;

  /**
   * Check whether a blob exists.
   * @param digest - Content-addressed digest
   * @returns True if the blob exists in storage
   */
  exists(digest: string): Promise<boolean>;

  /**
   * Delete a blob from storage.
   * @param digest - Content-addressed digest
   */
  delete(digest: string): Promise<void>;
}

export type { BlobStorage };
