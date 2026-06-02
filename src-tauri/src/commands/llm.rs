//! LLM 命令模块 — 主入口
//! 整合所有子模块，提供 Tauri 命令
//!
//! 子模块 (`constants` / `helpers` / `parsing` / `providers` / `types`)
//! 定义在 crate 根的 `src/llm/` 目录里，不再在本目录下重复声明。
//! 调用方请使用 `crate::llm::...` 路径。

// Reusable HTTP client with connection pooling
use std::sync::OnceLock;
use std::time::Duration;
use reqwest::Client;

use crate::llm::constants::{get_context_limit, get_default_model, normalize_provider};
use crate::llm::helpers::{build_system_prompt, build_user_prompt, estimate_script_duration};
use crate::llm::parsing::parse_script_output;
use crate::llm::providers::call_llm_provider;
use crate::llm::types::{
    AnalyzeVideoForScriptInput, AnalyzeVideoForScriptOutput,
    GenerateScriptInput, GenerateScriptOutput, LLMProvider, ScriptStyle,
};

static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

fn get_http_client() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| {
        Client::builder()
            .pool_max_idle_per_host(16)
            .tcp_keepalive(std::time::Duration::from_secs(60))
            .timeout(Duration::from_secs(180))
            .build()
            .expect("Failed to create HTTP client")
    })
}

// ─── Tauri 命令实现 ─────────────────────────────────────────────────────────

#[derive(serde::Serialize)]
pub struct ModelInfo {
    pub id: String,
    pub provider: String,
    pub name: String,
    pub context_limit: usize,
}

/// 生成解说脚本
#[tauri::command]
pub async fn generate_narration_script(
    input: GenerateScriptInput,
) -> Result<GenerateScriptOutput, String> {
    let client = get_http_client();

    let provider = input.provider.as_deref().unwrap_or("openai");
    let api_key = input.api_key.as_deref().unwrap_or_default();
    let base_url = input.base_url.as_deref();
    let style = input.style.as_ref().unwrap_or(&ScriptStyle::Casual);

    let system_prompt = build_system_prompt(style, input.target_duration_secs);
    let user_prompt = build_user_prompt(&input.subtitles, input.duration_secs, input.target_duration_secs);

    let normalized = normalize_provider(provider);
    let model = input.model.as_deref().unwrap_or_else(|| get_default_model(normalized));

    let raw = call_llm_provider(
        normalized, Some(model), api_key, base_url,
        &system_prompt, &user_prompt, client,
    ).await?;

    Ok(parse_script_output(&raw, input.duration_secs, None))
}

/// 分析视频内容（为脚本生成做准备）
#[tauri::command]
pub async fn analyze_video_for_narration(
    input: AnalyzeVideoForScriptInput,
) -> Result<AnalyzeVideoForScriptOutput, String> {
    // 简化实现：实际需要调用 Rust 视频处理能力
    Ok(AnalyzeVideoForScriptOutput {
        video_type: "短视频".to_string(),
        summary: format!("视频路径: {}", input.video_path),
        key_scenes: vec![],
    })
}

/// 列出可用模型
#[tauri::command]
pub fn list_available_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo { id: "gpt-5.5-pro".into(), provider: "openai".into(), name: "GPT-5.5 Pro".into(), context_limit: 128_000 },
        ModelInfo { id: "gpt-5.5-instant".into(), provider: "openai".into(), name: "GPT-5.5 Instant".into(), context_limit: 128_000 },
        ModelInfo { id: "gemini-3.1-pro".into(), provider: "google".into(), name: "Gemini 3.1 Pro".into(), context_limit: 1_000_000 },
        ModelInfo { id: "deepseek-v4-pro".into(), provider: "deepseek".into(), name: "DeepSeek V4 Pro".into(), context_limit: 1_000_000 },
        ModelInfo { id: "qwen3.5-plus".into(), provider: "qwen".into(), name: "Qwen 3.5 Plus".into(), context_limit: 32_000 },
        ModelInfo { id: "claude-opus-4-7".into(), provider: "anthropic".into(), name: "Claude Opus 4.7".into(), context_limit: 200_000 },
    ]
}

// Re-export types for external consumers (re-exported via llm/mod.rs
// `pub use types::*;` so consumers should reach them as
// `crate::llm::types::GenerateScriptInput` etc.). Commands/llm.rs only
// needs the #[tauri::command] function names; types are re-exported
// from `llm` at the crate root.