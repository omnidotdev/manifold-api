//! Custom REST API routes for Manifold

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};

use crate::core::{ArtifactSummary, ArtifactType, RegistryStats};

use crate::SharedState;

/// Health check
pub async fn health() -> &'static str {
    "OK"
}

/// Custom API router
pub fn api_router() -> Router<SharedState> {
    Router::new()
        // Stats
        .route("/stats", get(get_stats))
        // Namespaces
        .route("/namespaces", get(list_namespaces).post(create_namespace))
        .route("/namespaces/:namespace", get(get_namespace))
        // Repositories
        .route(
            "/namespaces/:namespace/repositories",
            get(list_repositories).post(create_repository),
        )
        .route(
            "/namespaces/:namespace/repositories/:repo",
            get(get_repository),
        )
        // Artifacts (schemas, WASM, etc.)
        .route(
            "/namespaces/:namespace/repositories/:repo/artifacts",
            get(list_artifacts).post(push_artifact),
        )
        .route(
            "/namespaces/:namespace/repositories/:repo/artifacts/:reference",
            get(get_artifact),
        )
        // Tags
        .route(
            "/namespaces/:namespace/repositories/:repo/tags",
            get(list_tags),
        )
        .route(
            "/namespaces/:namespace/repositories/:repo/tags/:tag",
            post(create_tag),
        )
}

// =============================================================================
// Request/Response types
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateNamespaceRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRepositoryRequest {
    pub name: String,
    pub artifact_type: ArtifactType,
    pub description: Option<String>,
    #[serde(default)]
    pub is_public: bool,
}

#[derive(Debug, Deserialize)]
pub struct PushArtifactRequest {
    pub content: String,
    pub media_type: Option<String>,
    pub tag: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTagRequest {
    pub digest: String,
}

#[derive(Debug, Serialize)]
pub struct NamespaceResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct RepositoryResponse {
    pub id: String,
    pub name: String,
    pub namespace: String,
    pub artifact_type: ArtifactType,
    pub description: Option<String>,
    pub is_public: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct ArtifactResponse {
    pub id: String,
    pub digest: String,
    pub size: i64,
    pub media_type: String,
    pub created_at: String,
    pub content: Option<String>,
}

// =============================================================================
// Handlers
// =============================================================================

async fn get_stats(State(state): State<SharedState>) -> Result<Json<RegistryStats>, StatusCode> {
    state
        .registry
        .get_stats()
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_namespaces(
    State(state): State<SharedState>,
) -> Result<Json<Vec<NamespaceResponse>>, StatusCode> {
    let namespaces = state
        .registry
        .list_namespaces()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(
        namespaces
            .into_iter()
            .map(|ns| NamespaceResponse {
                id: ns.id.to_string(),
                name: ns.name,
                description: ns.description,
                created_at: ns.created_at.to_rfc3339(),
            })
            .collect(),
    ))
}

async fn create_namespace(
    State(state): State<SharedState>,
    Json(req): Json<CreateNamespaceRequest>,
) -> Result<(StatusCode, Json<NamespaceResponse>), StatusCode> {
    let ns = state
        .registry
        .create_namespace(&req.name, req.description.as_deref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::CREATED,
        Json(NamespaceResponse {
            id: ns.id.to_string(),
            name: ns.name,
            description: ns.description,
            created_at: ns.created_at.to_rfc3339(),
        }),
    ))
}

async fn get_namespace(
    State(state): State<SharedState>,
    Path(namespace): Path<String>,
) -> Result<Json<NamespaceResponse>, StatusCode> {
    let ns = state
        .registry
        .get_namespace(&namespace)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(NamespaceResponse {
        id: ns.id.to_string(),
        name: ns.name,
        description: ns.description,
        created_at: ns.created_at.to_rfc3339(),
    }))
}

async fn list_repositories(
    State(_state): State<SharedState>,
    Path(_namespace): Path<String>,
) -> Result<Json<Vec<RepositoryResponse>>, StatusCode> {
    // TODO: Implement
    Ok(Json(vec![]))
}

async fn create_repository(
    State(state): State<SharedState>,
    Path(namespace): Path<String>,
    Json(req): Json<CreateRepositoryRequest>,
) -> Result<(StatusCode, Json<RepositoryResponse>), StatusCode> {
    let repo = state
        .registry
        .create_repository(
            &namespace,
            &req.name,
            req.artifact_type,
            req.description.as_deref(),
            req.is_public,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::CREATED,
        Json(RepositoryResponse {
            id: repo.id.to_string(),
            name: repo.name,
            namespace,
            artifact_type: repo.artifact_type,
            description: repo.description,
            is_public: repo.is_public,
            created_at: repo.created_at.to_rfc3339(),
        }),
    ))
}

async fn get_repository(
    State(state): State<SharedState>,
    Path((namespace, repo)): Path<(String, String)>,
) -> Result<Json<RepositoryResponse>, StatusCode> {
    let repository = state
        .registry
        .get_repository(&namespace, &repo)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(RepositoryResponse {
        id: repository.id.to_string(),
        name: repository.name,
        namespace,
        artifact_type: repository.artifact_type,
        description: repository.description,
        is_public: repository.is_public,
        created_at: repository.created_at.to_rfc3339(),
    }))
}

async fn list_artifacts(
    State(_state): State<SharedState>,
    Path((_namespace, _repo)): Path<(String, String)>,
) -> Result<Json<Vec<ArtifactSummary>>, StatusCode> {
    // TODO: Implement
    Ok(Json(vec![]))
}

async fn push_artifact(
    State(state): State<SharedState>,
    Path((namespace, repo)): Path<(String, String)>,
    Json(req): Json<PushArtifactRequest>,
) -> Result<(StatusCode, Json<ArtifactResponse>), StatusCode> {
    let content = req.content.into_bytes();
    let media_type = req
        .media_type
        .unwrap_or_else(|| "application/octet-stream".to_string());

    let artifact = state
        .registry
        .push_artifact(&namespace, &repo, content.into(), &media_type, req.tag.as_deref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::CREATED,
        Json(ArtifactResponse {
            id: artifact.id.to_string(),
            digest: artifact.digest,
            size: artifact.size,
            media_type: artifact.media_type,
            created_at: artifact.created_at.to_rfc3339(),
            content: artifact.content.map(|c| String::from_utf8_lossy(&c).to_string()),
        }),
    ))
}

async fn get_artifact(
    State(state): State<SharedState>,
    Path((namespace, repo, reference)): Path<(String, String, String)>,
) -> Result<Json<ArtifactResponse>, StatusCode> {
    let artifact = state
        .registry
        .get_artifact(&namespace, &repo, &reference)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(ArtifactResponse {
        id: artifact.id.to_string(),
        digest: artifact.digest,
        size: artifact.size,
        media_type: artifact.media_type,
        created_at: artifact.created_at.to_rfc3339(),
        content: artifact.content.map(|c| String::from_utf8_lossy(&c).to_string()),
    }))
}

async fn list_tags(
    State(state): State<SharedState>,
    Path((namespace, repo)): Path<(String, String)>,
) -> Result<Json<Vec<String>>, StatusCode> {
    state
        .registry
        .list_tags(&namespace, &repo)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_tag(
    State(state): State<SharedState>,
    Path((namespace, repo, tag)): Path<(String, String, String)>,
    Json(req): Json<CreateTagRequest>,
) -> Result<StatusCode, StatusCode> {
    state
        .registry
        .tag_artifact(&namespace, &repo, &req.digest, &tag)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::CREATED)
}
