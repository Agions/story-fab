//! Script Generator — LLM 文案生成模块
//!
//! 负责根据视频内容生成解说词，支持：
//! - 多提供商：OpenAI / Google Gemini / DeepSeek / Qwen / Anthropic Claude
//! - 多风格预设：幽默 / 严肃 / 接地气 / 悬疑 / 温情
//! - Coherence 机制：保证多段解说风格和情节连贯

pub mod anthropic_call;
pub mod client;
pub mod gemini_call;
pub mod openai_call;
pub mod parsing;
pub mod prompts;
pub mod providers;
pub mod types;

pub use types::*;

// ─── Tauri 命令 ─────────────────────────────────────────────────────────────

/// 生成解说脚本
#[tauri::command]
pub async fn generate_commentary_script(
    input: ScriptGeneratorInput,
) -> Result<ScriptGeneratorOutput, String> {
    if input.subtitles.trim().is_empty() {
        return Err("字幕内容不能为空".to_string());
    }

    let provider = input.provider.as_deref().unwrap_or("openai");
    let model = input.model.clone().unwrap_or_else(|| providers::get_default_model(provider).to_string());
    let api_key = input.api_key.clone().ok_or_else(|| "API Key 未提供".to_string())?;
    let style = input.style.unwrap_or_default();
    let summary = input.summary.as_deref();
    let angle = input.angle.as_deref();

    let system_prompt = prompts::build_system_prompt(style, summary, angle);
    let user_prompt = prompts::build_user_prompt(
        &input.subtitles,
        input.duration_secs,
        input.target_duration_secs,
        input.highlights.as_deref(),
        style,
    );

    let base_url = input.base_url.as_deref();
    let full_script = providers::call_llm(
        provider,
        &model,
        &api_key,
        base_url,
        &system_prompt,
        &user_prompt,
    ).await?;

    let estimated = input.target_duration_secs
        .unwrap_or_else(|| parsing::estimate_duration(&full_script));

    let segments = parsing::parse_script_output(&full_script, style, estimated);

    Ok(ScriptGeneratorOutput {
        full_script,
        segments,
        estimated_duration_secs: estimated,
        model_used: model,
        provider: provider.to_string(),
    })
}