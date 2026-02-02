# Manifold API - Local development

local_resource(
    'manifold-api',
    serve_cmd='cargo run',
    serve_dir='.',
    deps=['src', 'Cargo.toml', '../manifold-core/src'],
    resource_deps=['manifold-db'],
    env={
        'MANIFOLD_ADDRESS': '0.0.0.0:5000',
        'MANIFOLD_DATABASE_URL': 'postgres://postgres:postgres@localhost:5432/manifold',
        'MANIFOLD_STORAGE_PATH': '/tmp/manifold-blobs',
        'RUST_LOG': 'manifold=debug,tower_http=debug',
    },
)

# PostgreSQL for local development
docker_compose('../../../docker-compose.yaml', 'manifold-db')
