import { describe, expect, test } from "bun:test";

import {
  decideOciAccess,
  type OciTokenAuth,
} from "lib/oci/auth";

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
