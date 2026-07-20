import { describe, expect, test } from "bun:test";

import { clientRateLimitKey } from "lib/middleware/clientKey";

const req = (headers: Record<string, string> = {}) =>
  new Request("https://api.manifold.omni.dev/v2/", { headers });

const serverWithIp = (address: string) => ({
  requestIP: () => ({ address }),
});

describe("clientRateLimitKey", () => {
  test("prefers CF-Connecting-IP", () => {
    expect(
      clientRateLimitKey(
        req({ "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" }),
        serverWithIp("10.0.0.1"),
      ),
    ).toBe("9.9.9.9");
  });

  test("falls back to the first X-Forwarded-For hop", () => {
    expect(
      clientRateLimitKey(
        req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }),
        serverWithIp("10.0.0.1"),
      ),
    ).toBe("1.2.3.4");
  });

  test("falls back to the socket IP", () => {
    expect(clientRateLimitKey(req(), serverWithIp("10.0.0.9"))).toBe("10.0.0.9");
  });

  test('returns "unknown" when nothing resolves', () => {
    expect(clientRateLimitKey(req(), null)).toBe("unknown");
  });
});
