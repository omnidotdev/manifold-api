/**
 * Temporary chunk storage for OCI resumable blob uploads.
 *
 * Stores binary chunk data on disk during multi-part uploads,
 * then assembles the full blob when the upload completes.
 */

import { appendFile, mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const CHUNK_DIR = process.env.CHUNK_STORAGE_DIR ?? "/tmp/manifold-chunks";

/** Resolve the filesystem path for a session's blob file */
const sessionPath = (sessionId: string) => join(CHUNK_DIR, `${sessionId}.blob`);

/**
 * Create an empty blob file for a new upload session.
 * @param sessionId - Unique upload session identifier
 */
const initSession = async (sessionId: string) => {
  await mkdir(CHUNK_DIR, { recursive: true });
  await Bun.write(sessionPath(sessionId), new Uint8Array(0));
};

/**
 * Append binary data to a session's blob file.
 * Uses append-only writes (O(1) per chunk, not O(n)).
 * @param sessionId - Unique upload session identifier
 * @param data - Binary chunk to append
 */
const appendChunk = async (
  sessionId: string,
  data: Uint8Array | ArrayBuffer,
) => {
  const path = sessionPath(sessionId);
  const chunk = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  await appendFile(path, chunk);
};

/**
 * Read the fully assembled blob as an ArrayBuffer.
 * @param sessionId - Unique upload session identifier
 * @returns Assembled blob content
 */
const assembleBlob = async (sessionId: string): Promise<ArrayBuffer> => {
  const file = Bun.file(sessionPath(sessionId));
  return file.arrayBuffer();
};

/**
 * Get a readable stream of the assembled blob.
 * @param sessionId - Unique upload session identifier
 * @returns Readable stream of blob content and its size
 */
const assembleBlobStream = (
  sessionId: string,
): { stream: ReadableStream; size: number } => {
  const file = Bun.file(sessionPath(sessionId));
  return { stream: file.stream(), size: file.size };
};

/**
 * Compute SHA256 digest by streaming through a hasher.
 * @param stream - Readable stream to hash
 * @returns Digest in format "sha256:<hex>"
 */
const computeStreamDigest = async (
  stream: ReadableStream<Uint8Array>,
): Promise<string> => {
  const hasher = new Bun.CryptoHasher("sha256");
  for await (const chunk of stream) {
    hasher.update(chunk);
  }
  return `sha256:${hasher.digest("hex")}`;
};

/**
 * Remove the temporary chunk file for a session.
 * @param sessionId - Unique upload session identifier
 */
const cleanupSession = async (sessionId: string) => {
  try {
    await rm(sessionPath(sessionId));
  } catch {
    // File may already be cleaned up
  }
};

/**
 * Check if a session has chunk data on disk.
 * @param sessionId - Unique upload session identifier
 * @returns Whether the session's blob file exists
 */
const sessionExists = async (sessionId: string): Promise<boolean> => {
  try {
    await stat(sessionPath(sessionId));
    return true;
  } catch {
    return false;
  }
};

export {
  appendChunk,
  assembleBlob,
  assembleBlobStream,
  cleanupSession,
  computeStreamDigest,
  initSession,
  sessionExists,
};
