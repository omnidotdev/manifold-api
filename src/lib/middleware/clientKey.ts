/** The bit of Bun's `Server` we use to read the socket address. */
type IpResolvable = {
  requestIP: (request: Request) => { address?: string } | null;
} | null;

/**
 * Resolve the real client IP for rate-limiting.
 *
 * Behind Cloudflare + the gateway, the socket IP the app sees is the proxy's, so
 * a naive per-IP limiter collapses to a single global bucket (every external
 * request shares the proxy key). Prefer the forwarded client IP:
 * `CF-Connecting-IP` (Cloudflare), then the first `X-Forwarded-For` hop, then the
 * direct connection. Returns `"unknown"` when none resolve (all such callers
 * then share one bucket, which is the safe/conservative direction).
 */
export const clientRateLimitKey = (
  request: Request,
  server: IpResolvable,
): string => {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();

  const xff = request.headers.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  if (first) return first;

  return server?.requestIP(request)?.address ?? "unknown";
};
