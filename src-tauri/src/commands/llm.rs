//! LLM 命令模块
//! 支持 GPT-5.5、Gemini 3.1、DeepSeek V4、Qwen3 等最新模型的 AI 脚本生成

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;
use std::time::Duration;

// Reusable HTTP client with connection pooling - avoids creating new client per request
static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

fn get_http_client() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| {
        Client::builder()
            .pool_max_idle_per_host(16)
            .tcp_keepalive(std::time::Duration::from_secs(60))
            // Prevent infinite hangs — LLM API calls need a sane timeout
            .timeout(Duration::from_secs(180))
            .build()
            .expect("Failed to create HTTP client")
    })
}

// ─── 类型定义 ────────────────────────────────────────────────────────────────

/// AI 提供商
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LLMProvider {
    OpenAi,
    Google,
    DeepSeek,
    Qwen,
    Anthropic,
}

impl std::fmt::Display for LLMProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LLMProvider::OpenAi => write!(f, "openai"),
            LLMProvider::Google => write!(f, "google"),
            LLMProvider::DeepSeek => write!(f, "deepseek"),
            LLMProvider::Qwen => write!(f, "qwen"),
            LLMProvider::Anthropic => write!(f, "anthropic"),
        }
    }
}

/// 脚本风格
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptStyle {
    Humorous,   // 搞笑吐槽
    Emotional,  // 煽情动人
    Suspense,   // 悬疑紧张
    Informative, // 干货分享
    Casual,     // 轻松随意
}

impl Default for ScriptStyle {
    fn default() -> Self {
        ScriptStyle::Casual
    }
}

/// 脚本生成输入
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateScriptInput {
    /// 视频字幕/SRT 内容
    pub subtitles: String,
    /// 视频时长（秒）
    pub duration_secs: Option<f64>,
    /// 目标解说时长（秒），None 则自动估算
    pub target_duration_secs: Option<f64>,
    /// 脚本风格
    pub style: Option<ScriptStyle>,
    /// AI 提供商：openai | google | deepseek | qwen
    pub provider: Option<String>,
    /// 模型名称，如 gpt-5.5-pro、gemini-3.1-pro
    pub model: Option<String>,
    /// API Key
    pub api_key: Option<String>,
    /// Base URL（可选，支持代理）
    pub base_url: Option<String>,
    /// 系统提示词补充
    pub system_prompt: Option<String>,
}

/// 单个解说片段
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptSegment {
    /// 片段时间戳（秒）
    pub start_time: f64,
    /// 片段结束时间（秒）
    pub end_time: f64,
    /// 解说文案
    pub text: String,
    /// 情绪标签：humorous, emotional, suspense, neutral
    pub emotion: Option<String>,
}

/// 脚本生成输出
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateScriptOutput {
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

/// 视频理解输入（多模态：抽帧 + 字幕）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeVideoForScriptInput {
    /// 关键帧图片的 Base64 列表（可选）
    pub keyframes_base64: Option<Vec<String>>,
    /// 字幕/SRT 内容
    pub subtitles: String,
    /// 视频时长（秒）
    pub duration_secs: Option<f64>,
    /// 目标时长（秒）
    pub target_duration_secs: Option<f64>,
    /// 脚本风格
    pub style: Option<ScriptStyle>,
    /// AI 提供商
    pub provider: Option<String>,
    /// 模型名称
    pub model: Option<String>,
    /// API Key
    pub api_key: Option<String>,
    /// Base URL
    pub base_url: Option<String>,
}

/// 视频分析输出
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeVideoForScriptOutput {
    /// 视频内容摘要
    pub summary: String,
    /// 核心看点列表
    pub highlights: Vec<String>,
    /// 推荐解说角度
    pub angle: String,
    /// 目标受众
    pub target_audience: Option<String>,
    /// 脚本（如果同时要求生成）
    pub script: Option<GenerateScriptOutput>,
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

/// 默认模型映射
const DEFAULT_MODELS: &[(&str, &str)] = &[
    ("openai", "gpt-5.5-pro"),
    ("google", "gemini-3.1-pro"),
    ("deepseek", "deepseek-v4-pro"),
    ("qwen", "qwen3.5-plus"),
    ("anthropic", "claude-opus-4-7"),
];

/// 模型最大上下文
const CONTEXT_LIMITS: &[(&str, usize)] = &[
    ("gpt-5.5-pro", 128_000),
    ("gpt-5.5-instant", 128_000),
    ("gemini-3.1-pro", 1_000_000),
    ("gemini-3-flash-preview", 1_000_000),
    ("deepseek-v4-pro", 1_000_000),
    ("deepseek-v4-flash", 1_000_000),
    ("qwen3.5-plus", 32_000),
    ("qwen3-max", 32_000),
    ("claude-opus-4-7", 200_000),
    ("claude-sonnet-4-6", 200_000),
];

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/// Provider 别名映射（前端 provider 名称 → Rust 内部 provider 名称）
fn normalize_provider(provider: &str) -> &str {
    match provider {
        // 前端 alibaba (Qwen系列) → Rust qwen
        "alibaba" => "qwen",
        // 保持其他 provider 不变
        "openai" | "google" | "deepseek" | "anthropic" | "qwen" => provider,
        _ => provider,
    }
}

fn get_default_model(provider: &str) -> &'static str {
    let normalized = normalize_provider(provider);
    DEFAULT_MODELS
        .iter()
        .find(|(p, _)| *p == normalized)
        .map(|(_, m)| *m)
        .unwrap_or("gpt-5.5-pro")
}

fn estimate_script_duration(full_script: &str) -> f64 {
    // 中文平均语速：400字/分钟 ≈ 6.7字/秒
    // 考虑停顿和情绪，实际约 5字/秒
    let char_count = full_script.chars().count();
    (char_count as f64 / 5.0).max(1.0)
}

fn build_system_prompt(style: &ScriptStyle, target_duration: Option<f64>) -> String {
    let style_desc = match style {
        ScriptStyle::Humorous => "幽默搞笑、吐槽风格，语言生动有趣，善于制造笑点和梗",
        ScriptStyle::Emotional => "煽情动人，注重情感渲染，能够打动人心，引发共鸣",
        ScriptStyle::Suspense => "悬疑紧张，节奏紧凑，善于设置悬念，吊足观众胃口",
        ScriptStyle::Informative => "干货满满，逻辑清晰，信息密度高，有实用价值",
        ScriptStyle::Casual => "轻松随意，像和朋友聊天一样，自然亲切",
    };

    let duration_hint = match target_duration {
        Some(secs) => format!("目标时长约 {} 秒", secs as i32),
        None => "根据内容自由把握时长".to_string(),
    };

    format!(
        "你是一位专业的影视解说博主，擅长用生动的语言解说电影/电视剧/短视频。\n\
         风格要求：{}\n\
         {}\n\
         请根据提供的字幕内容，生成一段精彩的影视解说文案。\n\
         要求：\n\
         1. 语言生动有趣，有感染力\n\
         2. 适当加入场景描述和情感渲染\n\
         3. 不要照搬原字幕，要有自己的解读和评论\n\
         4. 控制节奏，不要太长或太短\n\
         5. 用中文输出",
        style_desc, duration_hint
    )
}

fn build_user_prompt(subtitles: &str, duration_secs: Option<f64>, target: Option<f64>) -> String {
    let duration_info = match (duration_secs, target) {
        (Some(d), Some(t)) => format!(
            "原视频时长 {:.1} 秒，目标解说时长约 {} 秒",
            d, t as i32
        ),
        (Some(d), None) => format!("原视频时长 {:.1} 秒", d),
        _ => "视频时长未知".to_string(),
    };

    format!(
        "请为以下影视内容生成解说文案：\n\
         {}\n\n\
         字幕内容：\n{}",
        duration_info, subtitles
    )
}

// ─── OpenAI / 兼容接口调用 ───────────────────────────────────────────────────

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
            Message {
                role: "system",
                content: system_prompt.to_string(),
            },
            Message {
                role: "user",
                content: user_prompt.to_string(),
            },
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
    struct Response {
        choices: Vec<Choice>,
    }

    #[derive(Deserialize)]
    struct Choice {
        message: ResponseMessage,
    }

    #[derive(Deserialize)]
    struct ResponseMessage {
        content: String,
    }

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
    struct Content {
        parts: Vec<Part>,
    }

    #[derive(Serialize, Deserialize)]
    struct Part {
        text: String,
    }

    #[derive(Serialize)]
    struct Request {
        contents: Vec<Content>,
        system_instruction: Option<Content>,
        generation_config: GenerationConfig,
    }

    #[derive(Serialize)]
    struct GenerationConfig {
        temperature: f32,
        max_output_tokens: usize,
    }

    let request = Request {
        contents: vec![Content {
            parts: vec![Part {
                text: user_prompt.to_string(),
            }],
        }],
        system_instruction: Some(Content {
            parts: vec![Part {
                text: system_prompt.to_string(),
            }],
        }),
        generation_config: GenerationConfig {
            temperature: 0.7,
            max_output_tokens: 8192,
        },
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
    struct Response {
        candidates: Option<Vec<Candidate>>,
    }

    #[derive(Deserialize)]
    struct Candidate {
        content: Option<Content>,
    }

    let resp: Response = response
        .json()
        .await
        .map_err(|e| format!("解析 Gemini 响应失败: {}", e))?;

    resp.candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .map(|content| {
            content
                .parts
                .into_iter()
                .map(|p| p.text)
                .collect::<Vec<_>>()
                .join("")
        })
        .ok_or_else(|| "Gemini 响应为空".to_string())
}

// ─── DeepSeek 调用 ────────────────────────────────────────────────────────────

async fn call_deepseek(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    // DeepSeek 使用 OpenAI 兼容接口
    call_openai_compatible(
        client,
        "https://api.deepseek.com/v1",
        model,
        api_key,
        system_prompt,
        user_prompt,
    )
    .await
}

// ─── Qwen 调用 ────────────────────────────────────────────────────────────────

async fn call_qwen(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    // Qwen 使用 OpenAI 兼容接口（阿里云 DashScope）
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

/// Anthropic Claude 使用 Messages API，认证头和响应格式均不同于 OpenAI
async fn call_anthropic(
    client: &Client,
    model: &str,
    api_key: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = "https://api.anthropic.com/v1/messages";

    #[derive(Serialize)]
    struct Message {
        role: &'static str,
        content: String,
    }

    #[derive(Serialize)]
    struct Request {
        model: String,
        messages: Vec<Message>,
        max_tokens: usize,
        system: String,
    }

    let request = Request {
        model: model.to_string(),
        messages: vec![
            Message {
                role: "user",
                content: format!("{}\n\n用户请求：{}", system_prompt, user_prompt),
            },
        ],
        max_tokens: 8000,
        system: system_prompt.to_string(),
    };

    let response = client
        .post(url)
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
    struct Response {
        content: Vec<ContentBlock>,
    }

    #[derive(Deserialize)]
    #[serde(rename_all = "lowercase")]
    struct ContentBlock {
        text: Option<String>,
    }

    let resp_body: Response = response
        .json()
        .await
        .map_err(|e| format!("解析 Anthropic 响应失败: {}", e))?;

    resp_body
        .content
        .into_iter()
        .find_map(|block| block.text)
        .ok_or_else(|| "Anthropic 响应中未找到文本内容".to_string())
}

// ─── 解析脚本 ────────────────────────────────────────────────────────────────

fn parse_script_output(output: &str, style: &ScriptStyle) -> Vec<ScriptSegment> {
    // 简单按段落分割，估算时间戳
    let paragraphs: Vec<&str> = output
        .lines()
        .filter(|l| !l.trim().is_empty())
        .collect();

    if paragraphs.is_empty() {
        return vec![];
    }

    // 总时长估算：按每段平均分配
    let total_chars: usize = paragraphs.iter().map(|p| p.chars().count()).sum();
    if total_chars == 0 {
        return vec![];
    }

    let avg_chars_per_segment = total_chars as f64 / paragraphs.len() as f64;
    let estimated_total = avg_chars_per_segment / 5.0; // 5字/秒

    let mut segments = Vec::new();
    let mut current_time = 0.0;

    for (_i, para) in paragraphs.iter().enumerate() {
        let text = (*para).to_string();
        let char_count = text.chars().count() as f64;
        let duration = (char_count / 5.0).max(1.0); // 至少1秒
        let end_time = current_time + duration;

        let emotion = match style {
            ScriptStyle::Humorous => Some("humorous".to_string()),
            ScriptStyle::Emotional => Some("emotional".to_string()),
            ScriptStyle::Suspense => Some("suspense".to_string()),
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
        if last.end_time < estimated_total {
            last.end_time = estimated_total;
        }
    }

    segments
}

// ─── Tauri 命令实现 ─────────────────────────────────────────────────────────

/// 生成解说脚本（纯字幕模式）
#[tauri::command]
pub async fn generate_narration_script(
    input: GenerateScriptInput,
) -> Result<GenerateScriptOutput, String> {
    if input.subtitles.trim().is_empty() {
        return Err("字幕内容不能为空".to_string());
    }

    let provider = input.provider.as_deref().unwrap_or("openai");
    let model = input.model.clone().unwrap_or_else(|| get_default_model(provider).to_string());
    let api_key = input.api_key.clone().ok_or_else(|| "API Key 未提供".to_string())?;
    let style = input.style.clone().unwrap_or_default();
    let system_prompt = input.system_prompt.clone().unwrap_or_else(|| build_system_prompt(&style, input.target_duration_secs));

    let user_prompt = build_user_prompt(&input.subtitles, input.duration_secs, input.target_duration_secs);

    let client = get_http_client();
    let full_script = match provider {
        "google" => {
            call_gemini(client, &model, &api_key, &system_prompt, &user_prompt).await?
        }
        "deepseek" => {
            call_deepseek(client, &model, &api_key, &system_prompt, &user_prompt).await?
        }
        "qwen" => {
            call_qwen(client, &model, &api_key, &system_prompt, &user_prompt).await?
        }
        "anthropic" => {
            call_anthropic(client, &model, &api_key, &system_prompt, &user_prompt).await?
        }
        _ => {
            // OpenAI 及兼容接口
            let base_url = input.base_url.clone().unwrap_or_else(|| "https://api.openai.com/v1".to_string());
            call_openai_compatible(client, &base_url, &model, &api_key, &system_prompt, &user_prompt).await?
        }
    };

    let segments = parse_script_output(&full_script, &style);
    let estimated_duration_secs = estimate_script_duration(&full_script);

    Ok(GenerateScriptOutput {
        full_script,
        segments,
        estimated_duration_secs,
        model_used: model,
        provider: provider.to_string(),
    })
}

/// 视频理解 + 脚本生成（多模态模式）
#[tauri::command]
pub async fn analyze_video_for_narration(
    input: AnalyzeVideoForScriptInput,
) -> Result<AnalyzeVideoForScriptOutput, String> {
    let provider = input.provider.as_deref().unwrap_or("google");
    let model = input.model.clone().unwrap_or_else(|| get_default_model(provider).to_string());
    let api_key = input.api_key.clone().ok_or_else(|| "API Key 未提供".to_string())?;
    let style = input.style.clone().unwrap_or_default();

    let client = get_http_client();

    // 1. 先做视频内容理解
    let analysis_prompt = format!(
        "你是一位专业的影视解说博主。请分析以下内容：\n\n\
         字幕内容：\n{}\n\n\
         请提供：\n\
         1. 视频内容摘要（100字以内）\n\
         2. 3-5个核心看点/亮点\n\
         3. 推荐解说角度（如：剧情分析、人物解读、情感共鸣、吐槽搞笑等）\n\
         4. 目标受众（可选）",
        input.subtitles
    );

    let analysis_system = "你是一位专业的影视内容分析师，擅长发现视频的亮点和价值。";

    let summary = match provider {
        "google" => {
            call_gemini(&client, &model, &api_key, analysis_system, &analysis_prompt).await?
        }
        "deepseek" => {
            call_deepseek(&client, &model, &api_key, analysis_system, &analysis_prompt).await?
        }
        "qwen" => {
            call_qwen(&client, &model, &api_key, analysis_system, &analysis_prompt).await?
        }
        "anthropic" => {
            call_anthropic(&client, &model, &api_key, analysis_system, &analysis_prompt).await?
        }
        _ => {
            call_gemini(&client, &model, &api_key, analysis_system, &analysis_prompt).await?
        }
    };

    // 解析分析结果（简单按行分割）
    let lines: Vec<&str> = summary.lines().filter(|l| !l.trim().is_empty()).collect();
    let last_line = lines.last();
    let mut highlights = Vec::new();
    let mut angle = String::new();
    let mut current_section = String::new();

    for line in &lines {
        let lower = line.to_lowercase();
        if lower.contains("看点") || lower.contains("亮点") || lower.contains("精彩") {
            current_section = "highlights".to_string();
        } else if lower.contains("角度") || lower.contains("解说") {
            current_section = "angle".to_string();
        } else if !current_section.is_empty() && !line.starts_with(|c: char| c.is_ascii_digit() || c == '：' || c == ':' || c == '.') {
            let cleaned = line.trim().trim_start_matches(|c: char| c == '-' || c == '•' || c == '*' || c == '·');
            if !cleaned.is_empty() {
                if current_section == "highlights" {
                    highlights.push(cleaned.to_string());
                } else if current_section == "angle" && angle.is_empty() {
                    angle = cleaned.to_string();
                }
            }
        }
    }

    if angle.is_empty() {
        if let Some(l) = last_line {
            angle = l.to_string();
        }
    }

    // 2. 生成脚本
    let script = generate_narration_script(GenerateScriptInput {
        subtitles: input.subtitles.clone(),
        duration_secs: input.duration_secs,
        target_duration_secs: input.target_duration_secs,
        style: Some(style.clone()),
        provider: input.provider.clone(),
        model: input.model.clone(),
        api_key: input.api_key.clone(),
        base_url: input.base_url.clone(),
        system_prompt: None,
    })
    .await
    .ok();

    Ok(AnalyzeVideoForScriptOutput {
        summary,
        highlights,
        angle,
        target_audience: None,
        script,
    })
}

/// 获取支持的模型列表
#[tauri::command]
pub fn list_available_models() -> Vec<ModelInfo> {
    vec![
        // OpenAI
        ModelInfo {
            provider: "openai".to_string(),
            name: "GPT-5.5 Pro".to_string(),
            model_id: "gpt-5.5-pro".to_string(),
            context_window: 128_000,
            description: "最新旗舰模型，原生 omnimodal，文/图/音/视频统一架构".to_string(),
            strengths: vec!["视频理解".to_string(), "脚本生成".to_string(), "Agent能力".to_string()],
            price_input: 10.0,
            price_output: 30.0,
            recommended: true,
        },
        ModelInfo {
            provider: "openai".to_string(),
            name: "GPT-5.5 Instant".to_string(),
            model_id: "gpt-5.5-instant".to_string(),
            context_window: 128_000,
            description: "快速版本，性价比高，适合日常使用".to_string(),
            strengths: vec!["脚本生成".to_string(), "速度".to_string()],
            price_input: 2.5,
            price_output: 10.0,
            recommended: false,
        },
        // Google
        ModelInfo {
            provider: "google".to_string(),
            name: "Gemini 3.1 Pro".to_string(),
            model_id: "gemini-3.1-pro".to_string(),
            context_window: 1_000_000,
            description: "100万上下文，多模态能力强，视频+音频原生支持".to_string(),
            strengths: vec!["视频理解".to_string(), "长上下文".to_string(), "性价比".to_string()],
            price_input: 2.0,
            price_output: 12.0,
            recommended: true,
        },
        ModelInfo {
            provider: "google".to_string(),
            name: "Gemini 3 Flash".to_string(),
            model_id: "gemini-3-flash-preview".to_string(),
            context_window: 1_000_000,
            description: "速度最快，适合高频调用".to_string(),
            strengths: vec!["速度".to_string(), "成本低".to_string()],
            price_input: 0.3,
            price_output: 1.25,
            recommended: false,
        },
        // DeepSeek
        ModelInfo {
            provider: "deepseek".to_string(),
            name: "DeepSeek V4-Pro".to_string(),
            model_id: "deepseek-v4-pro".to_string(),
            context_window: 1_000_000,
            description: "支持思考模式，Agent能力强，1M上下文".to_string(),
            strengths: vec!["Agent".to_string(), "长上下文".to_string(), "推理".to_string()],
            price_input: 1.0,
            price_output: 5.0,
            recommended: true,
        },
        ModelInfo {
            provider: "deepseek".to_string(),
            name: "DeepSeek V4-Flash".to_string(),
            model_id: "deepseek-v4-flash".to_string(),
            context_window: 1_000_000,
            description: "经济实惠之选，速度快".to_string(),
            strengths: vec!["速度".to_string(), "成本".to_string()],
            price_input: 0.1,
            price_output: 0.5,
            recommended: false,
        },
        // Qwen
        ModelInfo {
            provider: "qwen".to_string(),
            name: "Qwen3.5-Plus".to_string(),
            model_id: "qwen3.5-plus".to_string(),
            context_window: 32_000,
            description: "阿里最新旗舰模型，中文理解优秀".to_string(),
            strengths: vec!["中文".to_string(), "性价比".to_string()],
            price_input: 0.5,
            price_output: 2.0,
            recommended: true,
        },
        ModelInfo {
            provider: "qwen".to_string(),
            name: "Qwen3-Max".to_string(),
            model_id: "qwen3-max".to_string(),
            context_window: 32_000,
            description: "Qwen系列旗舰文本模型".to_string(),
            strengths: vec!["文本生成".to_string(), "中文".to_string()],
            price_input: 1.0,
            price_output: 4.0,
            recommended: false,
        },
        ModelInfo {
            provider: "qwen".to_string(),
            name: "Qwen3.5-Omni".to_string(),
            model_id: "qwen3.5-omni".to_string(),
            context_window: 32_000,
            description: "全模态模型，音视频文字一体化".to_string(),
            strengths: vec!["全模态".to_string(), "音视频".to_string()],
            price_input: 0.5,
            price_output: 2.0,
            recommended: false,
        },
        // Anthropic
        ModelInfo {
            provider: "anthropic".to_string(),
            name: "Claude Opus 4.7".to_string(),
            model_id: "claude-opus-4-7".to_string(),
            context_window: 200_000,
            description: "创意写作最强，长文档分析首选".to_string(),
            strengths: vec!["创意写作".to_string(), "长文档".to_string(), "分析".to_string()],
            price_input: 5.0,
            price_output: 25.0,
            recommended: true,
        },
        ModelInfo {
            provider: "anthropic".to_string(),
            name: "Claude Sonnet 4.6".to_string(),
            model_id: "claude-sonnet-4-6".to_string(),
            context_window: 200_000,
            description: "均衡之选，性价比高".to_string(),
            strengths: vec!["均衡".to_string(), "编程".to_string()],
            price_input: 3.0,
            price_output: 15.0,
            recommended: false,
        },
    ]
}

/// 模型信息
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub provider: String,
    pub name: String,
    pub model_id: String,
    pub context_window: usize,
    pub description: String,
    pub strengths: Vec<String>,
    pub price_input: f64,
    pub price_output: f64,
    pub recommended: bool,
}
