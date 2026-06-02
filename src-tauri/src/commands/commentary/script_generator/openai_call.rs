//! OpenAI-compatible API call (OpenAI / DeepSeek / Qwen / any OpenAI-compatible endpoint)

use reqwest::Client;

pub async fn call_openai_compatible(
    client: &Client,
    base_url: &str,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    #[derive(serde::Serialize)]
    struct Message { role: &'static str, content: String }
    #[derive(serde::Serialize)]
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

    #[derive(serde::Deserialize)]
    struct Response { choices: Vec<Choice> }
    #[derive(serde::Deserialize)]
    struct Choice { message: MessageContent }
    #[derive(serde::Deserialize)]
    struct MessageContent { content: String }

    let resp: Response = resp.json().await.map_err(|e| format!("解析响应失败: {}", e))?;
    resp.choices.into_iter().next()
        .map(|c| c.message.content)
        .ok_or_else(|| "响应为空".to_string())
}
