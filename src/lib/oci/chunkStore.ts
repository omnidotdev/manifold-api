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
 * Wrap a byte stream so its SHA256 digest and total size are computed inline as
 * bytes flow through, without buffering the content.
 *
 * The returned `stream` yields the same bytes unchanged and must be piped to a
 * single consumer (e.g. `storage.putStream`); `result` resolves once that
 * consumer has drained the stream to completion. This is deliberately a
 * single-pass transform rather than `stream.tee()` + a separate digest reader:
 * Bun's `tee()` applies no cross-branch backpressure, so a fast hashing reader
 * races ahead and buffers the entire (multi-GB) blob in memory for the slower
 * storage reader. Hashing inline keeps the whole path O(1) in memory.
 * @param source - Readable stream of the blob bytes
 * @returns The pass-through stream and a promise of its digest + byte size
 */
const createHashingStream = (
  source: ReadableStream<Uint8Array>,
): {
  stream: ReadableStream<Uint8Array>;
  result: Promise<{ digest: string; size: number }>;
} => {
  const hasher = new Bun.CryptoHasher("sha256");
  let size = 0;
  let resolveResult!: (value: { digest: string; size: number }) => void;
  const result = new Promise<{ digest: string; size: number }>((resolve) => {
    resolveResult = resolve;
  });

  const stream = source.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        hasher.update(chunk);
        size += chunk.byteLength;
        controller.enqueue(chunk);
      },
      flush() {
        resolveResult({ digest: `sha256:${hasher.digest("hex")}`, size });
      },
    }),
  );

  return { stream, result };
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
  createHashingStream,
  initSession,
  sessionExists,
};
