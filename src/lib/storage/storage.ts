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
   * Retrieve blob content.
   * @param digest - Content-addressed digest
   * @returns Binary content, or null if not found
   */
  get(digest: string): Promise<Uint8Array | null>;

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
