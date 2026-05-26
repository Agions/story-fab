//! Script Generator — LLM 文案生成模块
//!
//! 负责根据视频内容生成解说词，支持：
//! - 多提供商：OpenAI / Google Gemini / DeepSeek / Qwen / Anthropic Claude
//! - 多风格预设：幽默 / 严肃 / 接地气 / 悬疑 / 温情
//! - Coherence 机制：保证多段解说风格和情节连贯

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

// Reusable HTTP client
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

// ─── 类型定义 ────────────────────────────────────────────────────────────

/// 脚本风格
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptStyle {
    /// 幽默风趣
    Humorous,
    /// 严肃正式
    Serious,
    /// 接地气
    Conversational,
    /// 悬疑紧张
    Suspense,
    /// 温情治愈
    Warm,
}

impl Default for ScriptStyle {
    fn default() -> Self {
        ScriptStyle::Conversational
    }
}

impl std::fmt::Display for ScriptStyle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ScriptStyle::Humorous => write!(f, "humorous"),
            ScriptStyle::Serious => write!(f, "serious"),
            ScriptStyle::Conversational => write!(f, "conversational"),
            ScriptStyle::Suspense => write!(f, "suspense"),
            ScriptStyle::Warm => write!(f, "warm"),
        }
    }
}

/// 脚本生成输入
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptGeneratorInput {
    /// 视频字幕/SRT 内容
    pub subtitles: String,
    /// 视频时长（秒）
    pub duration_secs: Option<f64>,
    /// 目标解说时长（秒）
    pub target_duration_secs: Option<f64>,
    /// 脚本风格
    pub style: Option<ScriptStyle>,
    /// 视频内容摘要（可选，用于 Coherence）
    pub summary: Option<String>,
    /// 核心看点列表（可选）
    pub highlights: Option<Vec<String>>,
    /// 推荐解说角度
    pub angle: Option<String>,
    /// AI 提供商
    pub provider: Option<String>,
    /// 模型名称
    pub model: Option<String>,
    /// API Key
    pub api_key: Option<String>,
    /// Base URL（可选）
    pub base_url: Option<String>,
    /// 系统提示词补充
    pub system_prompt_extra: Option<String>,
}

/// 脚本片段
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptSegment {
    /// 起始时间（秒）
    pub start_time: f64,
    /// 结束时间（秒）
    pub end_time: f64,
    /// 解说文案
    pub text: String,
    /// 情绪标签
    pub emotion: Option<String>,
}

/// 脚本生成输出
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptGeneratorOutput {
    /// 完整解说文案
    pub full_script: String,
    /// 分段解说
    pub segments: Vec<ScriptSegment>,
    /// 总时长估算（秒）
    pub estimated_duration_secs: f64,
    /// 使用的模型
    pub model_used: String,
    /// 提供商
    pub provider: String,
}

// ─── 常量 ────────────────────────────────────────────────────────────────

const DEFAULT_MODELS: &[(&str, &str)] = &[
    ("openai", "gpt-5.5-pro"),
    ("google", "gemini-3.1-pro"),
    ("deepseek", "deepseek-v4-pro"),
    ("qwen", "qwen3.5-plus"),
    ("anthropic", "claude-opus-4-7"),
];

// ─── Prompt 构建 ─────────────────────────────────────────────────────────

fn build_system_prompt(style: ScriptStyle, summary: Option<&str>, angle: Option<&str>) -> String {
    let style_desc = match style {
        ScriptStyle::Humorous => "幽默搞笑、吐槽风格，语言生动有趣，善于制造笑点和梗",
        ScriptStyle::Serious => "严肃正式，注重逻辑和深度，分析到位，观点鲜明",
        ScriptStyle::Conversational => "轻松随意，像和朋友聊天一样，自然亲切，接地气",
        ScriptStyle::Suspense => "悬疑紧张，节奏紧凑，善于设置悬念，吊足观众胃口",
        ScriptStyle::Warm => "温情治愈，注重情感渲染，能够打动人心，引发共鸣",
    };

    let context = match (summary, angle) {
        (Some(s), Some(a)) => format!("视频内容：{}\n解说角度：{}", s, a),
        (Some(s), None) => format!("视频内容：{}", s),
        _ => String::new(),
    };

    format!(
        "你是一位专业的影视解说博主，擅长用生动的语言解说电影/电视剧/短视频。\n\
         风格要求：{}\n\n\
         {}\
         请根据提供的字幕内容，生成精彩的影视解说文案。\n\
         要求：\n\
         1. 语言生动有趣，有感染力\n\
         2. 适当加入场景描述和情感渲染\n\
         3. 不要照搬原字幕，要有自己的解读和评论\n\
         4. 控制节奏，不要太长或太短\n\
         5. 用中文输出",
        style_desc, context
    )
}

fn build_user_prompt(
    subtitles: &str,
    duration_secs: Option<f64>,
    target_duration: Option<f64>,
    highlights: Option<&[String]>,
    style: ScriptStyle,
) -> String {
    let duration_info = match (duration_secs, target_duration) {
        (Some(d), Some(t)) => format!("原视频时长 {:.1} 秒，目标解说时长约 {} 秒", d, t as i32),
        (Some(d), None) => format!("原视频时长 {:.1} 秒", d),
        _ => "视频时长未知".to_string(),
    };

    let highlights_info = highlights
        .map(|h| {
            if h.is_empty() {
                String::new()
            } else {
                format!("\n\n核心看点：\n{}\n", h.iter().enumerate().map(|(i, p)| format!("{}. {}", i + 1, p)).collect::<Vec<_>>().join("\n"))
            }
        })
        .unwrap_or_default();

    // 悬疑风格要求分段叙事
    let structure_hint = match style {
        ScriptStyle::Suspense => "\n\n请按叙事节奏分段，每段设置一个小悬念，引导观众继续看下去。",
        _ => "",
    };

    format!(
        "请为以下影视内容生成解说文案：\n\
         {}{}\n\n\
         字幕内容：\n{}{}",
        duration_info, highlights_info, subtitles, structure_hint
    )
}

// ─── LLM 调用 ───────────────────────────────────────────────────────────

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

fn get_default_model(provider: &str) -> &'static str {
    DEFAULT_MODELS
        .iter()
        .find(|(p, _)| *p == provider)
        .map(|(_, m)| *m)
        .unwrap_or("gpt-5.5-pro")
}

// ─── 脚本解析 ───────────────────────────────────────────────────────────

fn parse_script_output(output: &str, style: ScriptStyle, estimated_duration: f64) -> Vec<ScriptSegment> {
    let paragraphs: Vec<&str> = output
        .lines()
        .filter(|l| !l.trim().is_empty())
        .collect();

    if paragraphs.is_empty() {
        return vec![];
    }

    let total_chars: usize = paragraphs.iter().map(|p| p.chars().count()).sum();
    if total_chars == 0 {
        return vec![];
    }

    // 按总时长分配时间戳
    let mut segments = Vec::new();
    let mut current_time = 0.0;

    for para in paragraphs {
        let text = para.to_string();
        let char_count = text.chars().count() as f64;
        let duration = (char_count / 5.0).max(1.0);
        let end_time = (current_time + duration).min(estimated_duration);

        let emotion = match style {
            ScriptStyle::Humorous => Some("humorous".to_string()),
            ScriptStyle::Suspense => Some("suspense".to_string()),
            ScriptStyle::Warm => Some("warm".to_string()),
            _ => None,
        };

        segments.push(ScriptSegment {
            start_time: current_time,
            end_time,
            text,
            emotion,
        });

        current_time = end_time;
    }

    // 最后一段延伸到估算总时长
    if let Some(last) = segments.last_mut() {
        if last.end_time < estimated_duration {
            last.end_time = estimated_duration;
        }
    }

    segments
}

fn estimate_duration(full_script: &str) -> f64 {
    (full_script.chars().count() as f64 / 5.0).max(1.0)
}

// ─── Tauri 命令 ──────────────────────────────────────────────────────────

/// 生成解说脚本
#[tauri::command]
pub async fn generate_commentary_script(
    input: ScriptGeneratorInput,
) -> Result<ScriptGeneratorOutput, String> {
    if input.subtitles.trim().is_empty() {
        return Err("字幕内容不能为空".to_string());
    }

    let provider = input.provider.as_deref().unwrap_or("openai");
    let model = input.model.clone().unwrap_or_else(|| get_default_model(provider).to_string());
    let api_key = input.api_key.clone().ok_or_else(|| "API Key 未提供".to_string())?;
    let style = input.style.unwrap_or_default();
    let summary = input.summary.as_deref();
    let angle = input.angle.as_deref();

    let system_prompt = build_system_prompt(style, summary, angle);
    let user_prompt = build_user_prompt(
        &input.subtitles,
        input.duration_secs,
        input.target_duration_secs,
        input.highlights.as_deref(),
        style,
    );

    let client = get_http_client();
    let full_script = match provider {
        "google" => {
            call_gemini(client, &model, &api_key, &system_prompt, &user_prompt).await?
        }
        "anthropic" => {
            call_anthropic(client, &model, &api_key, &system_prompt, &user_prompt).await?
        }
        _ => {
            let base_url = input.base_url.clone()
                .unwrap_or_else(|| "https://api.openai.com/v1".to_string());
            call_openai_compatible(client, &base_url, &model, &api_key, &system_prompt, &user_prompt).await?
        }
    };

    let estimated = input.target_duration_secs
        .unwrap_or_else(|| estimate_duration(&full_script));

    let segments = parse_script_output(&full_script, style, estimated);

    Ok(ScriptGeneratorOutput {
        full_script,
        segments,
        estimated_duration_secs: estimated,
        model_used: model,
        provider: provider.to_string(),
    })
}