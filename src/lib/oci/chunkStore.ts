/**
 * Temporary chunk storage for OCI resumable blob uploads.
 *
 * Stores binary chunk data on disk during multi-part uploads,
 * then assembles the full blob when the upload completes.
 */

import { mkdir, rm, stat } from "node:fs/promises";
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
 * @param sessionId - Unique upload session identifier
 * @param data - Binary chunk to append
 */
const appendChunk = async (
  sessionId: string,
  data: Uint8Array | ArrayBuffer,
) => {
  const path = sessionPath(sessionId);
  const file = Bun.file(path);
  const existing = new Uint8Array(await file.arrayBuffer());
  const chunk = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

  const merged = new Uint8Array(existing.length + chunk.length);
  merged.set(existing);
  merged.set(chunk, existing.length);

  await Bun.write(path, merged);
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
  cleanupSession,
  initSession,
  sessionExists,
};
