//! Script Phase Orchestrator
//!
//! Builds a `ScriptGeneratorInput` from the pipeline input + director plan,
//! calls `generate_commentary_script`, and emits progress events.

use tauri::{AppHandle, Emitter};

use crate::commands::commentary::pipeline::types::{
    PipelineProgressPayload, PipelineStage,
};
use crate::commands::commentary::script_generator::{
    generate_commentary_script, ScriptGeneratorInput,
};
use crate::commands::commentary::pipeline::types::parse_style_for_script;
use crate::commands::commentary::director::types::DirectorPlan;

const PIPELINE_PROGRESS_EVENT: &str = "pipeline-progress";

/// Helper: emit a progress event.
fn emit_progress(app: &AppHandle, stage: PipelineStage, progress: f64, message: Option<String>) {
    let _ = app.emit(
        PIPELINE_PROGRESS_EVENT,
        PipelineProgressPayload {
            stage: stage.to_string(),
            progress,
            message,
        },
    );
}

// NOTE: `emit_error` is intentionally omitted — errors are propagated via `Err`
// and emitted by the caller (`commands.rs`), keeping a single source of truth
// for event emission.

/// Run the Script phase of the commentary pipeline.
///
/// Constructs a `ScriptGeneratorInput` from:
/// - `input`: subtitles, style, target_duration_secs, LLM credentials
/// - `director_plan`: summary, angle (as highlights proxy), key_points
///
/// Calls `generate_commentary_script` directly (no Tauri IPC).
pub async fn run_script_phase(
    app: &AppHandle,
    input: &crate::commands::commentary::pipeline::types::CommentaryPipelineInput,
    director_plan: &DirectorPlan,
) -> Result<crate::commands::commentary::script_generator::types::ScriptGeneratorOutput, String> {
    emit_progress(
        app,
        PipelineStage::Script,
        0.0,
        Some("开始生成解说脚本".into()),
    );

    let script_style = parse_style_for_script(input.style.as_deref());

    let script_input = ScriptGeneratorInput {
        subtitles: input.subtitles.clone(),
        duration_secs: Some(director_plan.target_duration_secs),
        target_duration_secs: input.target_duration_secs,
        style: Some(script_style),
        summary: Some(director_plan.summary.clone()),
        highlights: Some(director_plan.key_points.clone()),
        angle: Some(director_plan.angle.clone()),
        provider: input.provider.clone(),
        model: input.model.clone(),
        api_key: Some(input.api_key.clone()),
        base_url: input.base_url.clone(),
        system_prompt_extra: None,
    };

    emit_progress(
        app,
        PipelineStage::Script,
        0.5,
        Some("LLM 正在生成解说词...".into()),
    );

    let output = generate_commentary_script(script_input)
        .await
        .map_err(|e| format!("[script] 生成脚本失败：{}", e))?;

    emit_progress(
        app,
        PipelineStage::Script,
        1.0,
        Some("脚本生成完成".into()),
    );

    Ok(output)
}
