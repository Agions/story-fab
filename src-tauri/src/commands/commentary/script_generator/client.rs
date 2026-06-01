//! Script Generator HTTP client — shared reqwest client singleton

use reqwest::Client;
use std::sync::OnceLock;

static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

pub fn get_http_client() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| {
        Client::builder()
            .pool_max_idle_per_host(16)
            .tcp_keepalive(std::time::Duration::from_secs(60))
            .timeout(std::time::Duration::from_secs(180))
            .build()
            .expect("Failed to create HTTP client")
    })
}

pub const DEFAULT_MODELS: &[(&str, &str)] = &[
    ("openai", "gpt-5.5-pro"),
    ("google", "gemini-3.1-pro"),
    ("deepseek", "deepseek-v4-pro"),
    ("qwen", "qwen3.5-plus"),
    ("anthropic", "claude-opus-4-7"),
];

pub fn get_default_model(provider: &str) -> &'static str {
    DEFAULT_MODELS
        .iter()
        .find(|(p, _)| *p == provider)
        .map(|(_, m)| *m)
        .unwrap_or("gpt-5.5-pro")
}
