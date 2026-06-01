//! Anthropic Claude API call

use reqwest::Client;

pub async fn call_anthropic(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = "https://api.anthropic.com/v1/messages";

    #[derive(serde::Serialize)]
    struct Message { role: &'static str, content: String }
    #[derive(serde::Serialize)]
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

    #[derive(serde::Deserialize)]
    struct Response { content: Vec<ContentBlock> }
    #[derive(serde::Deserialize)]
    struct ContentBlock { text: Option<String> }

    let resp: Response = resp.json().await.map_err(|e| format!("解析响应失败: {}", e))?;
    resp.content.into_iter().find_map(|b| b.text)
        .ok_or_else(|| "Anthropic 响应中未找到文本".to_string())
}
