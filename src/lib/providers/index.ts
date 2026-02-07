/**
 * Shared provider instances for Manifold.
 *
 * Instantiates authorization and billing providers from @omnidotdev/providers
 * with Manifold-specific configuration from environment variables.
 */

import {
  createAuthzProvider,
  createBillingProvider,
  resolveProvider,
} from "@omnidotdev/providers";

import {
  AUTHZ_API_URL,
  BILLING_BASE_URL,
  BILLING_SERVICE_API_KEY,
} from "lib/config/env.config";

const authzProviderName = resolveProvider(process.env.AUTHZ_PROVIDER, "warden");

const billingProviderName = resolveProvider(
  process.env.BILLING_PROVIDER,
  "aether",
);

export const authz = createAuthzProvider(
  authzProviderName,
  AUTHZ_API_URL ? { apiUrl: AUTHZ_API_URL, source: "manifold" } : undefined,
);

export const billing = createBillingProvider(
  billingProviderName,
  BILLING_BASE_URL
    ? {
        baseUrl: BILLING_BASE_URL,
        serviceApiKey: BILLING_SERVICE_API_KEY,
        appId: "manifold",
      }
    : undefined,
);
