# Manifold API - Local development

local_resource(
    'manifold-api',
    serve_cmd='bun run dev',
    serve_dir='.',
    deps=['src', 'package.json'],
    resource_deps=['manifold-db'],
)

# PostgreSQL for local development
docker_compose('../../../docker-compose.yaml', 'manifold-db')
