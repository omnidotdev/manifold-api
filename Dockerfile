# syntax=docker/dockerfile:1

FROM oven/bun:1.3.6 AS base
WORKDIR /app

# Trivy vulnerability scanner (static binary copied from the official image).
# Inert unless SCAN_ENABLED=true; the scan worker no-ops when trivy is absent,
# so this only makes the runtime scan-capable, it does not turn scanning on.
FROM aquasec/trivy:0.72.0 AS trivy

# Build
FROM base AS builder
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG GIT_SHA
RUN echo "$GIT_SHA" > /app/.git-sha
RUN bun run build
# Guard: bun's bundler can emit an undefined __promiseAll helper for concurrent
# async-module init, crash-looping the server on boot (the 2026-06 aether
# incident). Fail the build before a broken bundle can deploy.
RUN if grep -q '__promiseAll' build/server.js && \
      ! grep -qE '(function|var|let|const) +__promiseAll' build/server.js; then \
      echo 'FATAL: bundle references undefined __promiseAll (bun bundler bug); aborting build'; exit 1; \
    fi
RUN bun run src/scripts/cacheSchemaHash.ts

# Run
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/.cache ./.cache
COPY --from=builder /app/.git-sha ./.git-sha
COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy

EXPOSE 4000
CMD ["bun", "run", "start"]
