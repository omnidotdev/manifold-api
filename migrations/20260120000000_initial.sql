-- Manifold initial schema

-- Namespaces (organizations/users)
CREATE TABLE IF NOT EXISTS namespaces (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_namespaces_name ON namespaces(name);

-- Repositories within namespaces
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY,
    namespace_id UUID NOT NULL REFERENCES namespaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    artifact_type VARCHAR(50) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(namespace_id, name)
);

CREATE INDEX idx_repositories_namespace ON repositories(namespace_id);
CREATE INDEX idx_repositories_type ON repositories(artifact_type);

-- Artifacts (blobs, manifests, schemas, etc.)
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    digest VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    media_type VARCHAR(255) NOT NULL,
    content BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(repository_id, digest)
);

CREATE INDEX idx_artifacts_repository ON artifacts(repository_id);
CREATE INDEX idx_artifacts_digest ON artifacts(digest);

-- Tags pointing to artifacts
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

CREATE INDEX idx_tags_repository ON tags(repository_id);
CREATE INDEX idx_tags_artifact ON tags(artifact_id);

-- Upload sessions for chunked uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    offset BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_upload_sessions_repository ON upload_sessions(repository_id);
CREATE INDEX idx_upload_sessions_expires ON upload_sessions(expires_at);

-- Schema metadata (for OpenAPI, GraphQL, JSON Schema)
CREATE TABLE IF NOT EXISTS schema_metadata (
    artifact_id UUID PRIMARY KEY REFERENCES artifacts(id) ON DELETE CASCADE,
    version VARCHAR(50),
    title VARCHAR(255),
    is_valid BOOLEAN NOT NULL DEFAULT true,
    validation_errors JSONB
);

-- Container metadata (for OCI images)
CREATE TABLE IF NOT EXISTS container_metadata (
    artifact_id UUID PRIMARY KEY REFERENCES artifacts(id) ON DELETE CASCADE,
    schema_version INTEGER NOT NULL,
    architecture VARCHAR(50),
    os VARCHAR(50),
    config_digest VARCHAR(255),
    layer_digests JSONB NOT NULL DEFAULT '[]'
);

-- WASM metadata
CREATE TABLE IF NOT EXISTS wasm_metadata (
    artifact_id UUID PRIMARY KEY REFERENCES artifacts(id) ON DELETE CASCADE,
    runtime VARCHAR(50),
    exports JSONB NOT NULL DEFAULT '[]',
    imports JSONB NOT NULL DEFAULT '[]'
);

-- Create default 'library' namespace for Docker-style pulls
INSERT INTO namespaces (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'library', 'Default namespace for single-name images')
ON CONFLICT (name) DO NOTHING;
