//! OCI Distribution API v2 implementation
//!
//! Implements the OCI Distribution Specification for container image storage.
//! See: https://github.com/opencontainers/distribution-spec/blob/main/spec.md
//!
//! Endpoints:
//! - GET /v2/                                  - Check API version
//! - GET /v2/<name>/manifests/<reference>      - Pull manifest
//! - PUT /v2/<name>/manifests/<reference>      - Push manifest
//! - GET /v2/<name>/blobs/<digest>             - Pull blob
//! - HEAD /v2/<name>/blobs/<digest>            - Check blob exists
//! - POST /v2/<name>/blobs/uploads/            - Start upload
//! - PATCH /v2/<name>/blobs/uploads/<uuid>     - Upload chunk
//! - PUT /v2/<name>/blobs/uploads/<uuid>       - Complete upload
//! - GET /v2/<name>/tags/list                  - List tags

use axum::{
    body::Body,
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, head, patch, post, put},
    Router,
};
use bytes::Bytes;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::SharedState;

/// OCI Distribution API router
pub fn router() -> Router<SharedState> {
    Router::new()
        // Base endpoint - version check
        .route("/", get(version_check))
        // Manifests
        .route("/:name/manifests/:reference", get(get_manifest).put(put_manifest).head(head_manifest))
        // Blobs
        .route("/:name/blobs/:digest", get(get_blob).head(head_blob))
        // Blob uploads
        .route("/:name/blobs/uploads/", post(start_upload))
        .route("/:name/blobs/uploads/:uuid", patch(upload_chunk).put(complete_upload))
        // Tags
        .route("/:name/tags/list", get(list_tags))
}

// =============================================================================
// Types
// =============================================================================

#[derive(Debug, Serialize)]
struct OciError {
    errors: Vec<OciErrorDetail>,
}

#[derive(Debug, Serialize)]
struct OciErrorDetail {
    code: String,
    message: String,
    detail: Option<serde_json::Value>,
}

impl OciError {
    fn not_found(message: &str) -> Self {
        Self {
            errors: vec![OciErrorDetail {
                code: "NAME_UNKNOWN".to_string(),
                message: message.to_string(),
                detail: None,
            }],
        }
    }

    fn blob_unknown(digest: &str) -> Self {
        Self {
            errors: vec![OciErrorDetail {
                code: "BLOB_UNKNOWN".to_string(),
                message: format!("blob unknown: {}", digest),
                detail: None,
            }],
        }
    }
}

#[derive(Debug, Deserialize)]
struct ListTagsQuery {
    n: Option<usize>,
    last: Option<String>,
}

#[derive(Debug, Serialize)]
struct TagList {
    name: String,
    tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct CompleteUploadQuery {
    digest: String,
}

// =============================================================================
// Handlers
// =============================================================================

/// GET /v2/ - Check registry version/auth
async fn version_check() -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header("Docker-Distribution-API-Version", "registry/2.0")
        .body(Body::empty())
        .unwrap()
}

/// GET /v2/<name>/manifests/<reference>
async fn get_manifest(
    State(state): State<SharedState>,
    Path((name, reference)): Path<(String, String)>,
) -> Response {
    // Parse name as namespace/repo
    let (namespace, repo) = match name.split_once('/') {
        Some((ns, r)) => (ns, r),
        None => ("library", name.as_str()),
    };

    match state.registry.get_artifact(namespace, repo, &reference).await {
        Ok(artifact) => {
            let content = match state.registry.get_artifact_content(namespace, repo, &reference).await {
                Ok(c) => c,
                Err(_) => {
                    return Response::builder()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(Body::empty())
                        .unwrap();
                }
            };

            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, artifact.media_type)
                .header("Docker-Content-Digest", artifact.digest)
                .header(header::CONTENT_LENGTH, content.len())
                .body(Body::from(content))
                .unwrap()
        }
        Err(_) => {
            let error = OciError::not_found(&format!("{}/{}", namespace, repo));
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_string(&error).unwrap()))
                .unwrap()
        }
    }
}

/// HEAD /v2/<name>/manifests/<reference>
async fn head_manifest(
    State(state): State<SharedState>,
    Path((name, reference)): Path<(String, String)>,
) -> Response {
    let (namespace, repo) = match name.split_once('/') {
        Some((ns, r)) => (ns, r),
        None => ("library", name.as_str()),
    };

    match state.registry.get_artifact(namespace, repo, &reference).await {
        Ok(artifact) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, artifact.media_type)
            .header("Docker-Content-Digest", artifact.digest)
            .header(header::CONTENT_LENGTH, artifact.size)
            .body(Body::empty())
            .unwrap(),
        Err(_) => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Body::empty())
            .unwrap(),
    }
}

/// PUT /v2/<name>/manifests/<reference>
async fn put_manifest(
    State(state): State<SharedState>,
    Path((name, reference)): Path<(String, String)>,
    headers: HeaderMap,
    body: Bytes,
) -> Response {
    let (namespace, repo) = match name.split_once('/') {
        Some((ns, r)) => (ns, r),
        None => ("library", name.as_str()),
    };

    let content_type = headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/vnd.oci.image.manifest.v1+json");

    // Determine tag (if reference is not a digest)
    let tag = if reference.starts_with("sha256:") {
        None
    } else {
        Some(reference.as_str())
    };

    match state
        .registry
        .push_artifact(namespace, repo, body, content_type, tag)
        .await
    {
        Ok(artifact) => Response::builder()
            .status(StatusCode::CREATED)
            .header(header::LOCATION, format!("/v2/{}/manifests/{}", name, artifact.digest))
            .header("Docker-Content-Digest", artifact.digest)
            .body(Body::empty())
            .unwrap(),
        Err(e) => {
            tracing::error!("Failed to push manifest: {:?}", e);
            Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::empty())
                .unwrap()
        }
    }
}

/// GET /v2/<name>/blobs/<digest>
async fn get_blob(
    State(state): State<SharedState>,
    Path((name, digest)): Path<(String, String)>,
) -> Response {
    let (namespace, repo) = match name.split_once('/') {
        Some((ns, r)) => (ns, r),
        None => ("library", name.as_str()),
    };

    match state.registry.get_artifact_content(namespace, repo, &digest).await {
        Ok(content) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/octet-stream")
            .header("Docker-Content-Digest", &digest)
            .header(header::CONTENT_LENGTH, content.len())
            .body(Body::from(content))
            .unwrap(),
        Err(_) => {
            let error = OciError::blob_unknown(&digest);
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_string(&error).unwrap()))
                .unwrap()
        }
    }
}

/// HEAD /v2/<name>/blobs/<digest>
async fn head_blob(
    State(state): State<SharedState>,
    Path((name, digest)): Path<(String, String)>,
) -> Response {
    let (namespace, repo) = match name.split_once('/') {
        Some((ns, r)) => (ns, r),
        None => ("library", name.as_str()),
    };

    match state.registry.get_artifact(namespace, repo, &digest).await {
        Ok(artifact) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/octet-stream")
            .header("Docker-Content-Digest", &digest)
            .header(header::CONTENT_LENGTH, artifact.size)
            .body(Body::empty())
            .unwrap(),
        Err(_) => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Body::empty())
            .unwrap(),
    }
}

/// POST /v2/<name>/blobs/uploads/ - Start chunked upload
async fn start_upload(
    State(_state): State<SharedState>,
    Path(name): Path<String>,
) -> Response {
    let uuid = Uuid::new_v4();

    Response::builder()
        .status(StatusCode::ACCEPTED)
        .header(header::LOCATION, format!("/v2/{}/blobs/uploads/{}", name, uuid))
        .header("Docker-Upload-UUID", uuid.to_string())
        .header("Range", "0-0")
        .body(Body::empty())
        .unwrap()
}

/// PATCH /v2/<name>/blobs/uploads/<uuid> - Upload chunk
async fn upload_chunk(
    State(_state): State<SharedState>,
    Path((name, uuid)): Path<(String, String)>,
    body: Bytes,
) -> Response {
    // TODO: Store chunk in upload session
    let end = body.len();

    Response::builder()
        .status(StatusCode::ACCEPTED)
        .header(header::LOCATION, format!("/v2/{}/blobs/uploads/{}", name, uuid))
        .header("Docker-Upload-UUID", uuid)
        .header("Range", format!("0-{}", end))
        .body(Body::empty())
        .unwrap()
}

/// PUT /v2/<name>/blobs/uploads/<uuid>?digest=<digest> - Complete upload
async fn complete_upload(
    State(state): State<SharedState>,
    Path((name, _uuid)): Path<(String, String)>,
    Query(query): Query<CompleteUploadQuery>,
    body: Bytes,
) -> Response {
    let (namespace, repo) = match name.split_once('/') {
        Some((ns, r)) => (ns, r),
        None => ("library", name.as_str()),
    };

    // For monolithic upload (whole blob in final PUT)
    match state
        .registry
        .push_artifact(namespace, repo, body, "application/octet-stream", None)
        .await
    {
        Ok(artifact) => {
            if artifact.digest != query.digest {
                let error = OciError {
                    errors: vec![OciErrorDetail {
                        code: "DIGEST_INVALID".to_string(),
                        message: format!(
                            "digest mismatch: expected {}, got {}",
                            query.digest, artifact.digest
                        ),
                        detail: None,
                    }],
                };
                return Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_string(&error).unwrap()))
                    .unwrap();
            }

            Response::builder()
                .status(StatusCode::CREATED)
                .header(header::LOCATION, format!("/v2/{}/blobs/{}", name, artifact.digest))
                .header("Docker-Content-Digest", artifact.digest)
                .body(Body::empty())
                .unwrap()
        }
        Err(_) => Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::empty())
            .unwrap(),
    }
}

/// GET /v2/<name>/tags/list
async fn list_tags(
    State(state): State<SharedState>,
    Path(name): Path<String>,
    Query(query): Query<ListTagsQuery>,
) -> Response {
    let (namespace, repo) = match name.split_once('/') {
        Some((ns, r)) => (ns, r),
        None => ("library", name.as_str()),
    };

    match state.registry.list_tags(namespace, repo).await {
        Ok(mut tags) => {
            // Apply pagination
            if let Some(last) = &query.last {
                if let Some(pos) = tags.iter().position(|t| t == last) {
                    tags = tags.into_iter().skip(pos + 1).collect();
                }
            }
            if let Some(n) = query.n {
                tags.truncate(n);
            }

            let list = TagList {
                name: name.clone(),
                tags,
            };

            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_string(&list).unwrap()))
                .unwrap()
        }
        Err(_) => {
            let error = OciError::not_found(&name);
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_string(&error).unwrap()))
                .unwrap()
        }
    }
}
