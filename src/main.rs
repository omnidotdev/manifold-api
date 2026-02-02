//! Manifold API Server
//!
//! Universal artifact registry supporting:
//! - OCI Distribution API (for container images)
//! - Custom API for schemas (OpenAPI, GraphQL, JSON Schema)
//! - Custom API for WASM modules
//!
//! Endpoints:
//! - /v2/* - OCI Distribution API
//! - /api/* - Custom REST API
//! - / - Web UI (served from manifold-app)

mod config;
mod core;
mod oci;
mod routes;

use axum::{routing::get, Router};
use figment::{providers::Env, Figment};
use sqlx::postgres::PgPoolOptions;
use std::{net::SocketAddr, path::PathBuf, sync::Arc};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::core::{storage::FileStorage, Registry};

pub struct AppState<B: crate::core::storage::BlobStorage> {
    pub registry: Registry<B>,
    pub config: Config,
}

pub type SharedState = Arc<AppState<FileStorage>>;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "manifold=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config: Config = Figment::new()
        .merge(Env::prefixed("MANIFOLD_"))
        .extract()
        .unwrap_or_default();

    tracing::info!("Starting Manifold on {}", config.address);

    // Initialize database
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    // Initialize blob storage
    let storage_path = PathBuf::from(&config.storage_path);
    let blobs = FileStorage::new(storage_path).await?;

    // Create registry
    let registry = Registry::new(pool, blobs);

    let state: SharedState = Arc::new(AppState {
        registry,
        config: config.clone(),
    });

    // Build router
    let app = Router::new()
        // Health check
        .route("/health", get(routes::health))
        // OCI Distribution API v2
        .nest("/v2", oci::router())
        // Custom API
        .nest("/api", routes::api_router())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start server
    let addr: SocketAddr = config.address.parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("Manifold listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
