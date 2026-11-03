# Manifold API

Universal artifact registry for containers, Cargo crates, schemas, and WASM modules.

## Architecture

- **Runtime**: [Bun](https://bun.sh) + [Elysia](https://elysiajs.com)
- **Database**: PostgreSQL via [Drizzle ORM](https://orm.drizzle.team)
- **GraphQL**: [Grafast](https://grafast.org) + [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)
- **Storage**: Pluggable blob storage (filesystem or S3-compatible)

## API Surface

| Protocol | Base Path | Purpose |
|----------|-----------|---------|
| GraphQL | `/graphql` | Schema management, namespace/repo CRUD, tokens |
| OCI Distribution v2 | `/v2/` | Container image push/pull |
| Cargo Registry | `/cargo/:namespace/` | `cargo publish`, `cargo install` |
| REST | `/api/` | API token management |

## Quick Start

```bash
cp .env.local.template .env.local
# Edit .env.local with your database URL and settings
bun install
bun db:migrate
bun dev
```

## Environment Variables

See `.env.local.template` for all available configuration options with descriptions.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `AUTH_BASE_URL` | `https://localhost:8000` | Gatekeeper auth service URL |
| `PROTECT_ROUTES` | `false` | Require authentication for GraphQL |
| `BLOB_STORAGE_BACKEND` | `fs` | Storage backend (`fs` or `s3`) |
| `BLOB_STORAGE_DIR` | `.blobs` | Filesystem storage directory |
| `FEDERATION_ENABLED` | `false` | Enable federation proxy |

## Development

```bash
bun dev          # Start dev server with hot reload
bun test         # Run test suite
bun lint         # Lint with Biome
bun knip         # Check for unused code/deps
bun db:generate  # Generate new migration
bun db:migrate   # Apply pending migrations
```

## Deployment

```bash
docker build -t manifold-api .
docker run -p 4000:4000 --env-file .env.production manifold-api
```

Runs migrations automatically on startup via `bun run start`.

## Cargo Registry

Configure Cargo to use Manifold:

```toml
# .cargo/config.toml
[registries.manifold]
index = "sparse+https://manifold.omni.dev/cargo/<namespace>/index/"
token = "mf_..."
```

```bash
cargo publish --registry manifold
cargo add --registry manifold <crate>
```

## License

The code in this repository is licensed under Apache 2.0, &copy; [Omni LLC](https://omni.dev). See [LICENSE.md](LICENSE.md) for more information.
