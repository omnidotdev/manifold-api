import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { makeAuthedFetch } from "lib/oidc/verify";

describe("makeAuthedFetch", () => {
  test("adds a Bearer header read fresh from the token file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "oidc-"));
    const tokenPath = join(dir, "token");
    writeFileSync(tokenPath, "  first-token\n");

    const calls: Array<{ url: unknown; auth: string | null }> = [];
    const fakeFetch = (async (input: unknown, init?: RequestInit) => {
      calls.push({
        url: input,
        auth: new Headers(init?.headers).get("authorization"),
      });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const authed = makeAuthedFetch(tokenPath, fakeFetch);
    await authed("https://apiserver/openid/v1/jwks");

    expect(calls[0]?.auth).toBe("Bearer first-token");

    // rotation: a new token on disk is picked up on the next call
    writeFileSync(tokenPath, "second-token");
    await authed("https://apiserver/openid/v1/jwks");
    expect(calls[1]?.auth).toBe("Bearer second-token");
  });

  test("preserves any existing headers", async () => {
    const dir = mkdtempSync(join(tmpdir(), "oidc-"));
    const tokenPath = join(dir, "token");
    writeFileSync(tokenPath, "tok");

    const seen: Array<string | null> = [];
    const fakeFetch = (async (_input: unknown, init?: RequestInit) => {
      seen.push(new Headers(init?.headers).get("accept"));
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    await makeAuthedFetch(tokenPath, fakeFetch)("https://x", {
      headers: { accept: "application/json" },
    });
    expect(seen[0]).toBe("application/json");
  });
});
