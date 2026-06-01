//! LLM Provider dispatcher — routes to the right API implementation

use crate::llm::constants::{get_default_model, normalize_provider};
use super::{call_anthropic, call_deepseek, call_gemini, call_openai_compatible, call_qwen};
use reqwest::Client;

pub async fn call_llm_provider(
    provider: &str,
    model: Option<&str>,
    api_key: &str,
    base_url: Option<&str>,
    system_prompt: &str,
    user_prompt: &str,
    client: &Client,
) -> Result<String, String> {
    let normalized = normalize_provider(provider);
    let model = model.unwrap_or_else(|| get_default_model(normalized));

    match normalized {
        "openai" => {
            let base = base_url.unwrap_or("https://api.openai.com/v1");
            call_openai_compatible(client, base, model, api_key, system_prompt, user_prompt).await
        }
        "google" => {
            call_gemini(client, model, api_key, system_prompt, user_prompt).await
        }
        "deepseek" => {
            call_deepseek(client, model, api_key, system_prompt, user_prompt).await
        }
        "qwen" => {
            call_qwen(client, model, api_key, system_prompt, user_prompt).await
        }
        "anthropic" => {
            call_anthropic(client, model, api_key, system_prompt, user_prompt).await
        }
        _ => Err(format!("不支持的 provider: {}", provider)),
    }
}