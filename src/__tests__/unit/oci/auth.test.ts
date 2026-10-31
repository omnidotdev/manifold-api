import { describe, expect, test } from "bun:test";

import {
  decideOciAccess,
  isPublicRegistryHost,
  isPublicRegistryWrite,
  type OciTokenAuth,
} from "lib/oci/auth";

const PUBLIC = "api.manifold.omni.dev";
const INTERNAL = "10.0.1.10:30501";

describe("isPublicRegistryHost — public-host match", () => {
  test("the public host matches", () => {
    expect(isPublicRegistryHost(PUBLIC, PUBLIC)).toBe(true);
  });
  test("the in-cluster host does not match (fleet pulls stay open)", () => {
    expect(isPublicRegistryHost(INTERNAL, PUBLIC)).toBe(false);
  });
  test("an explicit :port still matches", () => {
    expect(isPublicRegistryHost(`${PUBLIC}:443`, PUBLIC)).toBe(true);
  });
  test("the match is case-insensitive", () => {
    expect(isPublicRegistryHost(PUBLIC.toUpperCase(), PUBLIC)).toBe(true);
  });
  test("disabled when no public host is configured", () => {
    expect(isPublicRegistryHost(PUBLIC, null)).toBe(false);
  });
  test("a null Host is not matched", () => {
    expect(isPublicRegistryHost(null, PUBLIC)).toBe(false);
  });
});

describe("isPublicRegistryWrite — public /v2 write guard", () => {
  for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
    test(`${m} via the public host is blocked`, () => {
      expect(isPublicRegistryWrite(m, PUBLIC, PUBLIC)).toBe(true);
    });
    test(`${m} via the in-cluster host is allowed`, () => {
      expect(isPublicRegistryWrite(m, INTERNAL, PUBLIC)).toBe(false);
    });
  }

  for (const m of ["GET", "HEAD"]) {
    test(`${m} (read) via the public host is not blocked`, () => {
      expect(isPublicRegistryWrite(m, PUBLIC, PUBLIC)).toBe(false);
    });
  }

  test("public host with an explicit :port still matches", () => {
    expect(isPublicRegistryWrite("PUT", `${PUBLIC}:443`, PUBLIC)).toBe(true);
  });

  test("host match is case-insensitive", () => {
    expect(isPublicRegistryWrite("PUT", PUBLIC.toUpperCase(), PUBLIC)).toBe(
      true,
    );
  });

  test("guard is disabled when no public host is configured", () => {
    expect(isPublicRegistryWrite("PUT", PUBLIC, null)).toBe(false);
  });

  test("a null/missing Host is not matched", () => {
    expect(isPublicRegistryWrite("PUT", null, PUBLIC)).toBe(false);
  });
});

const NS = "11111111-1111-1111-1111-111111111111";
const OTHER_NS = "22222222-2222-2222-2222-222222222222";
const REPO = "33333333-3333-3333-3333-333333333333";
const OTHER_REPO = "44444444-4444-4444-4444-444444444444";

const token = (over: Partial<OciTokenAuth> = {}): OciTokenAuth => ({
  namespaceId: NS,
  repositoryId: null,
  scope: "write",
  ...over,
});

describe("decideOciAccess — reads", () => {
  test("public repo is anonymously readable", () => {
    const d = decideOciAccess("read", { id: NS }, { id: REPO, isPublic: true }, null);
    expect(d.ok).toBe(true);
  });

  test("private repo read without a token → 401 challenge", () => {
    const d = decideOciAccess("read", { id: NS }, { id: REPO, isPublic: false }, null);
    expect(d).toMatchObject({ ok: false, status: 401, challenge: true });
  });

  test("private repo read with a token for a DIFFERENT namespace → 403", () => {
    const d = decideOciAccess(
      "read",
      { id: NS },
      { id: REPO, isPublic: false },
      token({ namespaceId: OTHER_NS, scope: "read" }),
    );
    expect(d).toMatchObject({ ok: false, status: 403 });
  });

  test("private repo read with a read token for the owning namespace → ok", () => {
    const d = decideOciAccess(
      "read",
      { id: NS },
      { id: REPO, isPublic: false },
      token({ scope: "read" }),
    );
    expect(d.ok).toBe(true);
  });
});

describe("decideOciAccess — writes", () => {
  test("write without a token → 401 challenge", () => {
    const d = decideOciAccess("write", { id: NS }, { id: REPO, isPublic: true }, null);
    expect(d).toMatchObject({ ok: false, status: 401, challenge: true });
  });

  test("write with only read scope → 403 insufficient", () => {
    const d = decideOciAccess(
      "write",
      { id: NS },
      { id: REPO, isPublic: false },
      token({ scope: "read" }),
    );
    expect(d).toMatchObject({ ok: false, status: 403 });
  });

  test("write with a write token for a DIFFERENT namespace → 403", () => {
    const d = decideOciAccess(
      "write",
      { id: NS },
      { id: REPO, isPublic: false },
      token({ namespaceId: OTHER_NS }),
    );
    expect(d).toMatchObject({ ok: false, status: 403 });
  });

  test("first push (repo undefined) with a namespace-scoped write token → ok", () => {
    const d = decideOciAccess("write", { id: NS }, undefined, token());
    expect(d.ok).toBe(true);
  });

  test("first push with a REPO-scoped token cannot create a new repo → 403", () => {
    const d = decideOciAccess(
      "write",
      { id: NS },
      undefined,
      token({ repositoryId: OTHER_REPO }),
    );
    expect(d).toMatchObject({ ok: false, status: 403 });
  });

  test("repo-scoped token may write its own repo", () => {
    const d = decideOciAccess(
      "write",
      { id: NS },
      { id: REPO, isPublic: false },
      token({ repositoryId: REPO }),
    );
    expect(d.ok).toBe(true);
  });

  test("repo-scoped token may NOT write a different repo in the namespace", () => {
    const d = decideOciAccess(
      "write",
      { id: NS },
      { id: OTHER_REPO, isPublic: false },
      token({ repositoryId: REPO }),
    );
    expect(d).toMatchObject({ ok: false, status: 403 });
  });

  test("admin scope covers write", () => {
    const d = decideOciAccess(
      "write",
      { id: NS },
      { id: REPO, isPublic: false },
      token({ scope: "admin" }),
    );
    expect(d.ok).toBe(true);
  });
});
