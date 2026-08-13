import { describe, expect, test } from "bun:test";

import { scopeCovers, selectTrustedPublisher } from "lib/oidc/match";

import type { SelectTrustedPublisher } from "lib/db/schema";

/** Build a trusted-publisher binding with sensible defaults for a test. */
const binding = (
  over: Partial<SelectTrustedPublisher> = {},
): SelectTrustedPublisher =>
  ({
    id: "00000000-0000-0000-0000-000000000001",
    namespaceId: "ns-1",
    repositoryId: null,
    issuerId: "iss-1",
    subject: "system:serviceaccount:herald-ci:herald-sdk-publisher",
    claimConstraints: {},
    scope: "write",
    isActive: true,
    createdBy: "oidc:admin",
    lastUsedAt: null,
    createdAt: "2026-08-12T00:00:00Z",
    updatedAt: "2026-08-12T00:00:00Z",
    ...over,
  }) as SelectTrustedPublisher;

const claims = (over: Record<string, unknown> = {}) => ({
  sub: "system:serviceaccount:herald-ci:herald-sdk-publisher",
  ...over,
});

describe("scopeCovers", () => {
  test("a scope covers itself and everything below it", () => {
    expect(scopeCovers("admin", "write")).toBe(true);
    expect(scopeCovers("write", "write")).toBe(true);
    expect(scopeCovers("write", "read")).toBe(true);
    expect(scopeCovers("read", "read")).toBe(true);
  });

  test("a scope never covers a higher one", () => {
    expect(scopeCovers("write", "admin")).toBe(false);
    expect(scopeCovers("read", "write")).toBe(false);
  });
});

describe("selectTrustedPublisher", () => {
  test("matches on exact subject with no extra constraints", () => {
    const b = binding();
    expect(selectTrustedPublisher([b], claims(), "write")).toBe(b);
  });

  test("rejects a subject mismatch", () => {
    const b = binding({ subject: "system:serviceaccount:other:sa" });
    expect(selectTrustedPublisher([b], claims(), "write")).toBeNull();
  });

  test("requires every claim constraint to match", () => {
    const b = binding({ claimConstraints: { ref: "refs/tags/v1.0.0" } });
    expect(
      selectTrustedPublisher([b], claims({ ref: "refs/heads/master" }), "write"),
    ).toBeNull();
    expect(
      selectTrustedPublisher([b], claims({ ref: "refs/tags/v1.0.0" }), "write"),
    ).toBe(b);
  });

  test("rejects when a required claim is absent from the token", () => {
    const b = binding({ claimConstraints: { ref: "refs/tags/v1.0.0" } });
    expect(selectTrustedPublisher([b], claims(), "write")).toBeNull();
  });

  test("rejects when the requested scope exceeds the binding", () => {
    const b = binding({ scope: "write" });
    expect(selectTrustedPublisher([b], claims(), "admin")).toBeNull();
  });

  test("grants a lower requested scope than the binding allows", () => {
    const b = binding({ scope: "admin" });
    expect(selectTrustedPublisher([b], claims(), "read")).toBe(b);
  });

  test("skips inactive bindings", () => {
    const b = binding({ isActive: false });
    expect(selectTrustedPublisher([b], claims(), "write")).toBeNull();
  });

  test("returns the first matching binding among several", () => {
    const miss = binding({ subject: "nope" });
    const hit = binding({ id: "00000000-0000-0000-0000-000000000002" });
    expect(selectTrustedPublisher([miss, hit], claims(), "write")).toBe(hit);
  });
});
