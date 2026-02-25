/**
 * Shared provider instances for Manifold.
 *
 * Instantiates authorization and billing providers from @omnidotdev/providers
 * with Manifold-specific configuration from environment variables.
 */

import {
  createAuthzProvider,
  createBillingProvider,
  createEventsProvider,
  createFlagProvider,
} from "@omnidotdev/providers";

import {
  AUTHZ_API_URL,
  BILLING_BASE_URL,
  BILLING_SERVICE_API_KEY,
  FLAGS_API_HOST,
  FLAGS_CLIENT_KEY,
  VORTEX_API_KEY,
  VORTEX_API_URL,
} from "lib/config/env.config";

export const authz = AUTHZ_API_URL
  ? createAuthzProvider({ apiUrl: AUTHZ_API_URL, source: "manifold" })
  : undefined;

export const billing = BILLING_BASE_URL
  ? createBillingProvider({
      baseUrl: BILLING_BASE_URL,
      serviceApiKey: BILLING_SERVICE_API_KEY,
      appId: "manifold",
    })
  : undefined;

export const events = createEventsProvider(
  VORTEX_API_URL
    ? {
        provider: "http",
        baseUrl: VORTEX_API_URL,
        apiKey: VORTEX_API_KEY,
        source: "omni.manifold",
      }
    : {},
);

export const flags = createFlagProvider(
  FLAGS_API_HOST
    ? {
        provider: "unleash",
        url: FLAGS_API_HOST,
        apiKey: FLAGS_CLIENT_KEY!,
        appName: "manifold-api",
      }
    : {},
);
