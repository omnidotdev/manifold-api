import type { BlobStorage } from "lib/storage/storage";

type StorageStatus = "connected" | "unreachable";

/**
 * Probe digest for the health check: the sha256 of empty input. It is a
 * well-formed digest (64 lowercase hex chars, so it passes parseDigest) that is
 * effectively never a stored blob, so a reachable backend returns false. A
 * malformed digest here would throw in parseDigest before any backend call and
 * misreport a healthy store as unreachable.
 */
const PROBE_DIGEST =
  "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

/**
 * Probe the blob backend for the /health check. Reads a digest that is never
 * stored, so a reachable backend returns false (connected) and only a genuine
 * connection/auth failure throws (unreachable).
 */
export const checkStorageStatus = async (
  storage: Pick<BlobStorage, "exists">,
): Promise<StorageStatus> => {
  try {
    await storage.exists(PROBE_DIGEST);
    return "connected";
  } catch {
    return "unreachable";
  }
};
