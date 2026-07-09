//! Commentary Pipeline — Tauri Command Entry Point
//!
//! `run_commentary_pipeline` is the single orchestrating command that chains
//! the Director → Script → Synthesize phases and emits progress / complete /
//! error events back to the frontend.

use tauri::{AppHandle, Emitter};

use crate::commands::commentary::pipeline::types::{
    CommentaryPipelineInput, CommentaryPipelineOutput, PipelineStage,
};

const PIPELINE_PROGRESS_EVENT: &str = "pipeline-progress";
const PIPELINE_COMPLETE_EVENT: &str = "pipeline-complete";
const PIPELINE_ERROR_EVENT: &str = "pipeline-error";

/// Emit a `pipeline-progress` event.
fn emit_progress(
    app: &AppHandle,
    stage: PipelineStage,
    progress: f64,
    message: Option<String>,
) {
    let payload = crate::commands::commentary::pipeline::types::PipelineProgressPayload {
        stage: stage.to_string(),
        progress,
        message,
    };
    let _ = app.emit(PIPELINE_PROGRESS_EVENT, payload);
}

/// Emit a `pipeline-error` event.
fn emit_error(app: &AppHandle, stage: PipelineStage, error: String) {
    let payload = crate::commands::commentary::pipeline::types::PipelineErrorPayload {
        stage: stage.to_string(),
        error,
    };
    let _ = app.emit(PIPELINE_ERROR_EVENT, payload);
}

// ─── Public Tauri Command ────────────────────────────────────────────────────

/// Run the full AI commentary pipeline (Director → Script → Synthesize) in a
/// single backend command call.
///
/// # Parameters
/// - `app`: Tauri `AppHandle`, injected automatically by the Tauri runtime.
/// - `input`: Pipeline input containing video path, subtitles, LLM/TTS config, etc.
///
/// # Returns
/// `Ok(CommentaryPipelineOutput)` with the director plan, generated script,
/// and per-segment audio results, **or** `Err(String)` if any phase fails.
///
/// # Events Emitted
/// - `pipeline-progress` — at each sub-stage transition
/// - `pipeline-complete` — on full success (payload = `CommentaryPipelineOutput`)
/// - `pipeline-error` — on any phase failure
#[tauri::command]
pub async fn run_commentary_pipeline(
    app: AppHandle,
    input: CommentaryPipelineInput,
) -> Result<CommentaryPipelineOutput, String> {
    // ── Phase 1: Director ───────────────────────────────────────────────────
    emit_progress(
        &app,
        PipelineStage::Director,
        0.0,
        Some("开始 Director 阶段".into()),
    );

    let director_plan = match crate::commands::commentary::pipeline::director::run_director_phase(&app, &input).await {
        Ok(plan) => plan,
        Err(e) => {
            emit_error(&app, PipelineStage::Director, e.clone());
            return Err(e);
        }
    };

    // ── Phase 2: Script ─────────────────────────────────────────────────────
    emit_progress(
        &app,
        PipelineStage::Script,
        0.0,
        Some("开始 Script 阶段".into()),
    );

    let script_output = match crate::commands::commentary::pipeline::script::run_script_phase(&app, &input, &director_plan).await {
        Ok(script) => script,
        Err(e) => {
            emit_error(&app, PipelineStage::Script, e.clone());
            return Err(e);
        }
    };

    // ── Phase 3: Synthesize ─────────────────────────────────────────────────
    emit_progress(
        &app,
        PipelineStage::Synthesize,
        0.0,
        Some("开始 Synthesize 阶段".into()),
    );

    let (audio_segments, total_duration) =
        match crate::commands::commentary::pipeline::synthesize::run_synthesize_phase(&app, &input, &script_output, &director_plan).await {
            Ok(result) => result,
            Err(e) => {
                emit_error(&app, PipelineStage::Synthesize, e.clone());
                return Err(e);
            }
        };

    // ── Aggregate output ─────────────────────────────────────────────────────
    let output = CommentaryPipelineOutput {
        director_plan,
        script: script_output,
        audio_segments,
        total_audio_duration_secs: total_duration,
    };

    emit_progress(&app, PipelineStage::Synthesize, 1.0, Some("流水线完成".into()));

    // Emit pipeline-complete event so the frontend can react even before the
    // IPC return resolves.
    let _ = app.emit(PIPELINE_COMPLETE_EVENT, &output);

    Ok(output)
}
