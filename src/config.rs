//! Configuration for Manifold API

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Server address (host:port)
    #[serde(default = "default_address")]
    pub address: String,

    /// Database URL
    #[serde(default = "default_database_url")]
    pub database_url: String,

    /// Blob storage path
    #[serde(default = "default_storage_path")]
    pub storage_path: String,

    /// Maximum upload size in bytes (default 1GB)
    #[serde(default = "default_max_upload_size")]
    pub max_upload_size: usize,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            address: default_address(),
            database_url: default_database_url(),
            storage_path: default_storage_path(),
            max_upload_size: default_max_upload_size(),
        }
    }
}

fn default_address() -> String {
    "0.0.0.0:5000".to_string()
}

fn default_database_url() -> String {
    "postgres://localhost/manifold".to_string()
}

fn default_storage_path() -> String {
    "/data/manifold".to_string()
}

fn default_max_upload_size() -> usize {
    1024 * 1024 * 1024 // 1GB
}
