import { describe, expect, it, mock } from "bun:test";

import {
  enforceApiTokenLimit,
  enforceStorageLimit,
  enforceWebhookLimit,
  isBillingExempt,
} from "./enforce";

const PLATFORM_ORG = "33880602-cf32-4d8d-8db3-a4a9994c5d45";

describe("isBillingExempt", () => {
  it("matches only listed organizations", () => {
    expect(isBillingExempt(PLATFORM_ORG, [PLATFORM_ORG])).toBe(true);
    expect(isBillingExempt("some-customer-org", [PLATFORM_ORG])).toBe(false);
    expect(isBillingExempt(PLATFORM_ORG, [])).toBe(false);
  });
});

describe("plan-limit enforcement for an exempt organization", () => {
  // Any resolve or db access means the exemption was not honored
  const resolve = mock(async () => {
    throw new Error("entitlements must not be read for an exempt org");
  });
  // biome-ignore lint/suspicious/noExplicitAny: never touched when exempt
  const db = {} as any;
  const exempt = [PLATFORM_ORG];

  it("never blocks storage, API tokens, or webhooks", async () => {
    expect(
      await enforceStorageLimit(PLATFORM_ORG, 10, { db, resolve, exempt }),
    ).toBeNull();
    expect(
      await enforceApiTokenLimit(PLATFORM_ORG, { db, resolve, exempt }),
    ).toBeNull();
    expect(
      await enforceWebhookLimit(PLATFORM_ORG, { db, resolve, exempt }),
    ).toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });
});
