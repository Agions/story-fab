//! Script Generator Providers — re-exports + dispatcher

mod client;
mod openai_call;
mod gemini_call;
mod anthropic_call;

pub use client::{get_default_model, get_http_client};
pub use openai_call::call_openai_compatible;
pub use gemini_call::call_gemini;
pub use anthropic_call::call_anthropic;

/// Dispatch LLM call to the appropriate provider
pub async fn call_llm(
    provider: &str,
    model: &str,
    api_key: &str,
    base_url: Option<&str>,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let client = get_http_client();
    match provider {
        "google" => {
            call_gemini(client, model, api_key, system_prompt, user_prompt).await
        }
        "anthropic" => {
            call_anthropic(client, model, api_key, system_prompt, user_prompt).await
        }
        _ => {
            let base_url = base_url.unwrap_or("https://api.openai.com/v1");
            call_openai_compatible(client, base_url, model, api_key, system_prompt, user_prompt).await
        }
    }
}
