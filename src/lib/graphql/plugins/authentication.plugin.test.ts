import { describe, expect, test } from "bun:test";

import { orgIdsFromClaims } from "lib/graphql/plugins/authentication.plugin";

/**
 * Gatekeeper emits organization membership under a namespaced OIDC claim
 * (`${CLAIMS_NAMESPACE}/organizations`), never a bare `organizations` key.
 * The read-scope filter depends on this extraction returning the caller's org
 * ids; reading the wrong key yields an empty list and hides every private
 * namespace the caller owns.
 */
describe("orgIdsFromClaims", () => {
  const ORG_ID = "33880602-cf32-4d8d-8db3-a4a9994c5d45";
  const NAMESPACED_KEY = "https://manifold.omni.dev/@omni/claims/organizations";

  test("reads org ids from the namespaced Gatekeeper claim", () => {
    const claims = {
      sub: "user-1",
      [NAMESPACED_KEY]: [
        { id: ORG_ID, slug: "omni", name: "Omni", roles: ["owner"] },
      ],
    };

    expect(orgIdsFromClaims(claims)).toEqual([ORG_ID]);
  });

  test("falls back to a bare organizations claim (self-host / legacy)", () => {
    const claims = {
      sub: "user-1",
      organizations: [{ id: ORG_ID, slug: "omni" }],
    };

    expect(orgIdsFromClaims(claims)).toEqual([ORG_ID]);
  });

  test("tolerates bare id strings", () => {
    const claims = { sub: "user-1", [NAMESPACED_KEY]: [ORG_ID] };

    expect(orgIdsFromClaims(claims)).toEqual([ORG_ID]);
  });

  test("returns an empty list when no org claim is present", () => {
    expect(orgIdsFromClaims({ sub: "user-1" })).toEqual([]);
  });
});
