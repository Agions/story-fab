//! LLM API 调用 — OpenAI/Gemini/DeepSeek/Qwen/Anthropic
//! 每个 provider 一个函数

use crate::llm::constants::{get_context_limit, get_default_model, normalize_provider};
use crate::llm::helpers::{build_system_prompt, build_user_prompt};
use crate::llm::types::ScriptStyle;
use reqwest::Client;

// ─── OpenAI / 兼容接口调用 ────────────────────────────────────────────────────

pub async fn call_openai_compatible(
    client: &Client,
    base_url: &str,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    #[derive(Serialize)]
    struct Message {
        role: &'static str,
        content: String,
    }

    #[derive(Serialize)]
    struct Request {
        model: String,
        messages: [Message; 2],
        temperature: f32,
        max_tokens: usize,
    }

    let request = Request {
        model: model.to_string(),
        messages: [
            Message { role: "system", content: system_prompt.to_string() },
            Message { role: "user", content: user_prompt.to_string() },
        ],
        temperature: 0.7,
        max_tokens: 8000,
    };

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API 错误 [{}]: {}", status, body));
    }

    #[derive(Deserialize)]
    struct Response { choices: Vec<Choice> }

    #[derive(Deserialize)]
    struct Choice { message: ResponseMessage }

    #[derive(Deserialize)]
    struct ResponseMessage { content: String }

    let resp: Response = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    resp.choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .ok_or_else(|| "响应为空".to_string())
}

// ─── Gemini 调用 ─────────────────────────────────────────────────────────────

pub async fn call_gemini(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    #[derive(Serialize, Deserialize)]
    struct Content { parts: Vec<Part> }
    #[derive(Serialize, Deserialize)]
    struct Part { text: String }
    #[derive(Serialize)]
    struct Request {
        contents: Vec<Content>,
        system_instruction: Option<Content>,
        generation_config: GenerationConfig,
    }
    #[derive(Serialize)]
    struct GenerationConfig { temperature: f32, max_output_tokens: usize }

    let request = Request {
        contents: vec![Content { parts: vec![Part { text: user_prompt.to_string() }] }],
        system_instruction: Some(Content { parts: vec![Part { text: system_prompt.to_string() }] }),
        generation_config: GenerationConfig { temperature: 0.7, max_output_tokens: 8192 },
    };

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Gemini 请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Gemini API 错误 [{}]: {}", status, body));
    }

    #[derive(Deserialize)]
    struct Response { candidates: Option<Vec<Candidate>> }
    #[derive(Deserialize)]
    struct Candidate { content: Option<Content> }

    let resp: Response = response
        .json()
        .await
        .map_err(|e| format!("解析 Gemini 响应失败: {}", e))?;

    resp.candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .map(|content| {
            content.parts.into_iter().map(|p| p.text).collect::<Vec<_>>().join("")
        })
        .ok_or_else(|| "Gemini 响应为空".to_string())
}

// ─── DeepSeek 调用 ────────────────────────────────────────────────────────────

pub async fn call_deepseek(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    call_openai_compatible(
        client,
        "https://api.deepseek.com",
        model,
        api_key,
        system_prompt,
        user_prompt,
    )
    .await
}

// ─── Qwen 调用 ────────────────────────────────────────────────────────────────

pub async fn call_qwen(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    call_openai_compatible(
        client,
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model,
        api_key,
        system_prompt,
        user_prompt,
    )
    .await
}

// ─── Anthropic Claude 调用 ────────────────────────────────────────────────────

pub async fn call_anthropic(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = "https://api.anthropic.com/v1/messages";

    #[derive(Serialize)]
    struct Request {
        model: String,
        max_tokens: usize,
        system: String,
        messages: Vec<Message>,
    }

    #[derive(Serialize)]
    struct Message { role: String, content: String }

    let request = Request {
        model: model.to_string(),
        max_tokens: 8000,
        system: system_prompt.to_string(),
        messages: vec![Message { role: "user".to_string(), content: user_prompt.to_string() }],
    };

    let response = client
        .post(&url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Anthropic 请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Anthropic API 错误 [{}]: {}", status, body));
    }

    #[derive(Deserialize)]
    struct Response { content: Vec<ContentBlock> }
    #[derive(Deserialize)]
    struct ContentBlock { text: String }

    let resp: Response = response
        .json()
        .await
        .map_err(|e| format!("解析 Anthropic 响应失败: {}", e))?;

    resp.content
        .into_iter()
        .next()
        .map(|c| c.text)
        .ok_or_else(|| "Anthropic 响应为空".to_string())
}

/// 调用对应 provider 的 API
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