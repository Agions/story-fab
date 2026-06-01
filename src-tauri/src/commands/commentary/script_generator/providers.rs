//! Script Generator Providers — LLM 调用层

use reqwest::Client;
use std::sync::OnceLock;
use super::types::ScriptStyle;

static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

fn get_http_client() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| {
        Client::builder()
            .pool_max_idle_per_host(16)
            .tcp_keepalive(std::time::Duration::from_secs(60))
            .timeout(std::time::Duration::from_secs(180))
            .build()
            .expect("Failed to create HTTP client")
    })
}

const DEFAULT_MODELS: &[(&str, &str)] = &[
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

// ─── OpenAI Compatible ───────────────────────────────────────────────────────

async fn call_openai_compatible(
    client: &Client,
    base_url: &str,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    #[derive(Serialize)]
    struct Message { role: &'static str, content: String }
    #[derive(Serialize)]
    struct Request { model: String, messages: [Message; 2], temperature: f32, max_tokens: usize }

    let request = Request {
        model: model.to_string(),
        messages: [
            Message { role: "system", content: system_prompt.to_string() },
            Message { role: "user", content: user_prompt.to_string() },
        ],
        temperature: 0.7,
        max_tokens: 8000,
    };

    let resp = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("API 错误 [{}]: {}", status, body));
    }

    #[derive(Deserialize)]
    struct Response { choices: Vec<Choice> }
    #[derive(Deserialize)]
    struct Choice { message: MessageContent }
    #[derive(Deserialize)]
    struct MessageContent { content: String }

    let resp: Response = resp.json().await.map_err(|e| format!("解析响应失败: {}", e))?;
    resp.choices.into_iter().next()
        .map(|c| c.message.content)
        .ok_or_else(|| "响应为空".to_string())
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

async fn call_gemini(
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

    let resp = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Gemini 请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Gemini API 错误 [{}]: {}", status, body));
    }

    #[derive(Deserialize)]
    struct Response { candidates: Option<Vec<Candidate>> }
    #[derive(Deserialize)]
    struct Candidate { content: Option<Content> }

    let resp: Response = resp.json().await.map_err(|e| format!("解析响应失败: {}", e))?;
    resp.candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .map(|content| content.parts.into_iter().map(|p| p.text).collect::<Vec<_>>().join(""))
        .ok_or_else(|| "Gemini 响应为空".to_string())
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async fn call_anthropic(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = "https://api.anthropic.com/v1/messages";

    #[derive(Serialize)]
    struct Message { role: &'static str, content: String }
    #[derive(Serialize)]
    struct Request { model: String, messages: Vec<Message>, max_tokens: usize, system: String }

    let request = Request {
        model: model.to_string(),
        messages: vec![Message { role: "user", content: format!("{}\n\n用户请求：{}", system_prompt, user_prompt) }],
        max_tokens: 8000,
        system: system_prompt.to_string(),
    };

    let resp = client
        .post(url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Anthropic 请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Anthropic API 错误 [{}]: {}", status, body));
    }

    #[derive(Deserialize)]
    struct Response { content: Vec<ContentBlock> }
    #[derive(Deserialize)]
    struct ContentBlock { text: Option<String> }

    let resp: Response = resp.json().await.map_err(|e| format!("解析响应失败: {}", e))?;
    resp.content.into_iter().find_map(|b| b.text).ok_or_else(|| "Anthropic 响应中未找到文本".to_string())
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

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