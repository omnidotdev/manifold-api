import { describe, expect, test } from "bun:test";

import { isRegistryAuthorized } from "lib/oci/registryAuth";

const TOKEN = "s3cr3t-registry-token";

/** Build a Basic-auth header for a username/password pair. */
const basic = (user: string, pass: string) =>
  `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

describe("isRegistryAuthorized", () => {
  test("accepts correct token with any username", () => {
    expect(isRegistryAuthorized(basic("anyuser", TOKEN), TOKEN)).toBe(true);
    expect(isRegistryAuthorized(basic("", TOKEN), TOKEN)).toBe(true);
    expect(isRegistryAuthorized(basic("kubelet", TOKEN), TOKEN)).toBe(true);
  });

  test("rejects wrong password", () => {
    expect(isRegistryAuthorized(basic("user", "wrong"), TOKEN)).toBe(false);
  });

  test("rejects when no token is configured (fail closed)", () => {
    expect(isRegistryAuthorized(basic("user", TOKEN), undefined)).toBe(false);
    expect(isRegistryAuthorized(basic("user", ""), "")).toBe(false);
  });

  test("rejects missing header", () => {
    expect(isRegistryAuthorized(null, TOKEN)).toBe(false);
    expect(isRegistryAuthorized(undefined, TOKEN)).toBe(false);
    expect(isRegistryAuthorized("", TOKEN)).toBe(false);
  });

  test("rejects non-Basic schemes", () => {
    expect(isRegistryAuthorized(`Bearer ${TOKEN}`, TOKEN)).toBe(false);
    expect(
      isRegistryAuthorized(
        `Digest ${Buffer.from(`u:${TOKEN}`).toString("base64")}`,
        TOKEN,
      ),
    ).toBe(false);
  });

  test("is case-insensitive on the scheme keyword", () => {
    const encoded = Buffer.from(`user:${TOKEN}`).toString("base64");
    expect(isRegistryAuthorized(`basic ${encoded}`, TOKEN)).toBe(true);
    expect(isRegistryAuthorized(`BASIC ${encoded}`, TOKEN)).toBe(true);
  });

  test("rejects malformed base64 / missing separator", () => {
    expect(isRegistryAuthorized("Basic", TOKEN)).toBe(false);
    expect(isRegistryAuthorized("Basic !!!notbase64!!!", TOKEN)).toBe(false);
    // no colon in decoded value
    expect(
      isRegistryAuthorized(
        `Basic ${Buffer.from("nocolonhere").toString("base64")}`,
        TOKEN,
      ),
    ).toBe(false);
  });

  test("accepts a password that itself contains colons", () => {
    const weird = "a:b:c:token";
    expect(isRegistryAuthorized(basic("user", weird), weird)).toBe(true);
  });

  test("rejects a password that is a prefix of the token (length guard)", () => {
    expect(isRegistryAuthorized(basic("user", TOKEN.slice(0, -1)), TOKEN)).toBe(
      false,
    );
    expect(isRegistryAuthorized(basic("user", `${TOKEN}x`), TOKEN)).toBe(false);
  });
});
