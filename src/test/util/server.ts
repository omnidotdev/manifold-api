import { useParserCache } from "@envelop/parser-cache";
import { useValidationCache } from "@envelop/validation-cache";
import { Elysia } from "elysia";
import { useGrafast } from "grafast/envelop";
import { createYoga } from "graphql-yoga";
import { createWithPgClient } from "postgraphile/adaptors/pg";

import appConfig from "lib/config/app.config";
import createAuthenticationPlugin from "lib/graphql/plugins/authentication.plugin";
import { storage } from "lib/storage";
import { checkStorageStatus } from "lib/storage/health";

export const makeElysiaApp = () => {
  const app = new Elysia();

  // Mirror the real /health handler (src/server.ts) so this probe is exercised
  // in tests; a hardcoded "ok" previously hid a broken storage probe
  app.get("/health", async () => {
    const storageStatus = await checkStorageStatus(storage);

    return {
      status: storageStatus === "connected" ? "ok" : "degraded",
      timestamp: Date.now(),
      service: appConfig.name,
      storage: storageStatus,
    };
  });

  return {
    handle: (input: Request | URL | string, init?: RequestInit) =>
      app.handle(toRequest(input, init)),
  };
};

const toRequest = (input: Request | URL | string, init?: RequestInit) =>
  input instanceof Request
    ? input
    : new Request(typeof input === "string" ? input : input.toString(), init);

export const makeYogaServer = (opts?: { headers?: Record<string, string> }) => {
  const { pool, db } = globalThis.__TEST_DATABASE__;
  const withPgClient = createWithPgClient({ pool });

  const yoga = createYoga({
    schema: globalThis.__TEST_SCHEMA__,
    // useGrafast is required for the Postgraphile plans to execute; without it
    // every connection silently resolves to null
    plugins: [
      createAuthenticationPlugin(),
      useParserCache(),
      useValidationCache(),
      useGrafast(),
    ],
    context: async ({ request }) => ({
      request,
      db,
      withPgClient,
      pgSettings: null,
      pgSubscriber: null,
    }),
  });

  return {
    fetch: (input: Request | URL | string, init?: RequestInit) => {
      const req = toRequest(input, init);

      if (opts?.headers) {
        const merged = new Headers(req.headers);
        for (const [k, v] of Object.entries(opts.headers)) merged.set(k, v);
        return yoga.fetch(new Request(req, { headers: merged }));
      }

      return yoga.fetch(req);
    },
  };
};
