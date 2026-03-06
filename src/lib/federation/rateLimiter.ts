/**
 * In-memory token bucket rate limiter.
 * Configured per-source with RPM (requests per minute).
 */

type TokenBucket = {
  tokens: number;
  maxTokens: number;
  refillRate: number;
  lastRefill: number;
};

const buckets = new Map<string, TokenBucket>();

/**
 * Try to consume a token for the given source.
 * @param sourceId - Federated source ID
 * @param rpm - Requests per minute limit
 * @returns Whether the request is allowed
 */
const tryConsume = (sourceId: string, rpm: number): boolean => {
  const now = Date.now();
  let bucket = buckets.get(sourceId);

  if (!bucket) {
    bucket = {
      tokens: rpm,
      maxTokens: rpm,
      refillRate: rpm / 60_000,
      lastRefill: now,
    };
    buckets.set(sourceId, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(
    bucket.maxTokens,
    bucket.tokens + elapsed * bucket.refillRate,
  );
  bucket.lastRefill = now;

  if (bucket.tokens < 1) return false;

  bucket.tokens -= 1;
  return true;
};

/**
 * Wait until a token is available, then consume it.
 * @param sourceId - Federated source ID
 * @param rpm - Requests per minute limit
 * @param timeoutMs - Max wait time (default 10s)
 */
const waitForToken = async (
  sourceId: string,
  rpm: number,
  timeoutMs = 10_000,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (tryConsume(sourceId, rpm)) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
};

export { waitForToken };
