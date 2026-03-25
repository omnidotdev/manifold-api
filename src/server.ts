import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { useOpenTelemetry } from "@envelop/opentelemetry";
import { useParserCache } from "@envelop/parser-cache";
import { useValidationCache } from "@envelop/validation-cache";
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { schema } from "generated/graphql/schema.executable";
import { useGrafast } from "grafast/envelop";
import webhooks from "webhooks";

import { tokensApi } from "lib/api";
import cargoRouter from "lib/cargo/router";
import appConfig from "lib/config/app.config";
import {
  CORS_ALLOWED_ORIGINS,
  FEDERATION_ENABLED,
  PORT,
  isDevEnv,
  isProdEnv,
  maintenanceAllowedNamespaces,
} from "lib/config/env.config";
import { dbPool, pgPool } from "lib/db";
import ensureDatabase from "lib/db/ensureDatabase";
import federationRouter from "lib/federation/router";
import { startFederationSync } from "lib/federation/sync";
import createGraphqlContext from "lib/graphql/createGraphqlContext";
import {
  armorPlugin,
  createAuditLogPlugin,
  createAuthenticationPlugin,
  createBillingPlugin,
  createScopeEnforcementPlugin,
} from "lib/graphql/plugins";
import { startSessionCleanup } from "lib/jobs";
import { ociRouter } from "lib/oci";
import { flags } from "lib/providers";
import webRouter from "lib/web/router";

// ensure database exists before starting
await ensureDatabase();

// Start background cleanup of expired upload sessions
const cleanupTimer = startSessionCleanup();

// Start federation sync if enabled
const federationSyncTimer =
  FEDERATION_ENABLED === "true" ? startFederationSync() : null;

/**
 * Elysia server.
 */
const app = new Elysia({
  serve: {
    // Allow large OCI blob uploads (container image layers, up to 2 GiB)
    maxRequestBodySize: 2 * 1024 * 1024 * 1024,
    ...(isDevEnv && {
      // https://elysiajs.com/patterns/configuration#serve-tls
      // https://bun.sh/guides/http/tls
      // NB: Elysia (and Bun) trust the well-known CA list curated by Mozilla (https://wiki.mozilla.org/CA/Included_Certificates), but they can be customized here if needed (`tls.ca` option)
      tls: {
        certFile: "cert.pem",
        keyFile: "key.pem",
      },
    }),
  },
})
  // security headers
  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  })
  .use(
    cors({
      origin: CORS_ALLOWED_ORIGINS!.split(","),
      // OCI Distribution API requires PUT, PATCH, HEAD, DELETE
      methods: ["GET", "POST", "PUT", "PATCH", "HEAD", "DELETE"],
    }),
  )
  // rate limiting (high limit to support concurrent OCI blob uploads)
  .use(
    rateLimit({
      max: 300,
      duration: 60_000,
    }),
  )
  // health check endpoint
  .get("/health", () => ({
    status: "ok",
    timestamp: Date.now(),
    service: appConfig.name,
  }))
  // readiness endpoint
  .get("/ready", async ({ set }) => {
    try {
      await dbPool.execute(sql`SELECT 1`);

      return {
        status: "ready",
        database: "connected",
        timestamp: Date.now(),
      };
    } catch {
      set.status = 503;

      return {
        status: "not ready",
        database: "disconnected",
        timestamp: Date.now(),
      };
    }
  })
  .use(webhooks)
  // API tokens REST endpoints
  .use(tokensApi)
  // Federation admin routes
  .use(federationRouter)
  // Web content routes (/@namespace/repo/reference)
  .use(webRouter)
  // Cargo registry API
  .use(cargoRouter)
  // OCI Distribution API v2
  .use(ociRouter)
  .use(
    yoga({
      schema,
      context: createGraphqlContext,
      graphiql: isDevEnv,
      plugins: [
        ...armorPlugin,
        createAuthenticationPlugin(),
        createScopeEnforcementPlugin(),
        createBillingPlugin(),
        createAuditLogPlugin(),
        // disable GraphQL schema introspection in production to mitigate reverse engineering
        isProdEnv && useDisableIntrospection(),
        useOpenTelemetry({
          variables: true,
          result: true,
        }),
        // parser and validation caches recommended for Grafast (https://grafast.org/grafast/servers#envelop)
        useParserCache(),
        useValidationCache(),
        useGrafast(),
      ],
    }),
  )
  .listen(PORT);

// biome-ignore lint/suspicious/noConsole: root logging
console.log(
  `🦊 ${appConfig.name} Elysia server running at ${app.server?.url.toString().slice(0, -1)}`,
);

// biome-ignore lint/suspicious/noConsole: root logging
console.log(
  `📦 ${appConfig.name} OCI Distribution API running at ${app.server?.url}v2/`,
);

// biome-ignore lint/suspicious/noConsole: root logging
console.log(
  `🧘 ${appConfig.name} GraphQL Yoga API running at ${app.server?.url}graphql`,
);

// biome-ignore lint/suspicious/noConsole: root logging
console.log(
  `📦 ${appConfig.name} Cargo registry running at ${app.server?.url}cargo/`,
);

if (await flags.isEnabled("manifold-api-maintenance-mode")) {
  // biome-ignore lint/suspicious/noConsole: root logging
  console.log(
    `🔒 Maintenance mode active — OCI access restricted to: ${maintenanceAllowedNamespaces.join(", ")}`,
  );
}

/**
 * Graceful shutdown handler.
 */
const shutdown = async (signal: string) => {
  // biome-ignore lint/suspicious/noConsole: shutdown logging
  console.log(`[Server] Received ${signal}, shutting down gracefully...`);

  // Stop background timers
  clearInterval(cleanupTimer);
  if (federationSyncTimer) clearInterval(federationSyncTimer);

  // Stop accepting new connections
  app.stop();

  // Close database pool
  await pgPool.end();

  // biome-ignore lint/suspicious/noConsole: shutdown logging
  console.log("[Server] Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
