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
import { dispatchWebhooks } from "lib/webhooks/dispatch";

export const authz = AUTHZ_API_URL
  ? createAuthzProvider({ apiUrl: AUTHZ_API_URL, source: "manifold" })
  : undefined;

export const billing = BILLING_BASE_URL
  ? createBillingProvider({
      provider: "aether",
      baseUrl: BILLING_BASE_URL,
      serviceApiKey: BILLING_SERVICE_API_KEY,
      appId: "manifold",
    })
  : undefined;

const eventsProvider = createEventsProvider(
  VORTEX_API_URL && VORTEX_API_KEY
    ? {
        provider: "http",
        baseUrl: VORTEX_API_URL,
        apiKey: VORTEX_API_KEY,
        source: "omni.manifold",
      }
    : {},
);

/**
 * Events provider wrapped so every emit also fans out to the organization's
 * registered outbound webhooks (best-effort, non-blocking). Only `emit` is used
 * across the codebase, so exposing just it is sufficient.
 */
export const events = {
  emit: async (evt: Parameters<typeof eventsProvider.emit>[0]) => {
    const result = await eventsProvider.emit(evt);
    if (evt.organizationId && evt.organizationId !== "system") {
      void dispatchWebhooks(
        evt.organizationId,
        evt.type,
        (evt.data ?? {}) as Record<string, unknown>,
      );
    }
    return result;
  },
};

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
