//! Synthesize Phase Orchestrator
//!
//! Iterates over `script.segments`, calls `synthesize_commentary_audio` for
//! each one, collects `AudioSegmentResult` structs, and emits per-segment
//! progress events.

use tauri::{AppHandle, Emitter};

use crate::commands::commentary::pipeline::types::{
    AudioSegmentResult, PipelineErrorPayload, PipelineProgressPayload, PipelineStage,
};
use crate::commands::commentary::synthesizer::commands::synthesize_commentary_audio;
use crate::commands::commentary::script_generator::types::ScriptGeneratorOutput;
use crate::commands::commentary::director::types::DirectorPlan;

const PIPELINE_PROGRESS_EVENT: &str = "pipeline-progress";
const PIPELINE_ERROR_EVENT: &str = "pipeline-error";

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

/// Helper: emit an error event.
fn emit_error(app: &AppHandle, stage: PipelineStage, error: String) {
    let _ = app.emit(
        PIPELINE_ERROR_EVENT,
        PipelineErrorPayload {
            stage: stage.to_string(),
            error,
        },
    );
}

/// Resolve the voice to use: explicit `input.voice` takes priority over
/// `director_plan.recommended_voice`.
fn resolve_voice(input: &crate::commands::commentary::pipeline::types::CommentaryPipelineInput, director_plan: &DirectorPlan) -> String {
    input.voice.clone().unwrap_or_else(|| director_plan.recommended_voice.clone())
}

/// Generate a unique output path for a segment's audio file inside the
/// system temp directory. Falls back to the current directory if the temp
/// dir cannot be determined.
fn segment_output_path(session_id: &str, segment_index: usize) -> String {
    let base = std::env::temp_dir().join("storyfab").join(session_id);
    let _ = std::fs::create_dir_all(&base);
    base.join(format!("segment_{:03}.mp3", segment_index))
        .to_string_lossy()
        .into_owned()
}

/// Run the Synthesize phase of the commentary pipeline.
///
/// For each segment in `script_output.segments`:
/// - calls `synthesize_commentary_audio(text, voice, speed, Some("mp3"), output_path)`
/// - collects the result as `AudioSegmentResult`
///
/// Uses a **lenient** error strategy: a single failed segment is recorded in
/// the result list (with `audio_path` set to an error marker) but does not
/// abort the entire phase. If *all* segments fail, returns `Err`.
pub async fn run_synthesize_phase(
    app: &AppHandle,
    input: &crate::commands::commentary::pipeline::types::CommentaryPipelineInput,
    script_output: &ScriptGeneratorOutput,
    director_plan: &DirectorPlan,
) -> Result<(Vec<AudioSegmentResult>, f64), String> {
    let voice = resolve_voice(input, director_plan);
    let speed = input.speed.unwrap_or(1.0);
    let total = script_output.segments.len();
    let mut results = Vec::with_capacity(total);
    let mut total_duration: f64 = 0.0;
    let mut failure_count: usize = 0;

    emit_progress(
        app,
        PipelineStage::Synthesize,
        0.0,
        Some(format!("开始音频合成 ({} 段)", total)),
    );

    for (idx, segment) in script_output.segments.iter().enumerate() {
        let progress = (idx as f64) / (total as f64);

        if idx > 0 && idx % 5 == 0 {
            emit_progress(
                app,
                PipelineStage::Synthesize,
                progress,
                Some(format!("音频合成 {}/{}", idx, total)),
            );
        }

        let output_path = segment_output_path(&input.session_id, idx);

        match synthesize_commentary_audio(
            segment.text.clone(),
            voice.clone(),
            speed,
            Some("mp3".to_string()),
            Some(output_path.clone()),
        )
        .await
        {
            Ok(synth_result) => {
                results.push(AudioSegmentResult {
                    text: segment.text.clone(),
                    audio_path: synth_result.audio_path,
                    duration_secs: synth_result.duration_secs,
                    segment_index: idx,
                });
                total_duration += synth_result.duration_secs;
            }
            Err(e) => {
                failure_count += 1;
                tracing::warn!(
                    "[pipeline:synthesize] 段 {} 合成失败：{} (共 {} 段, 已失败 {} 段)",
                    idx, e, total, failure_count
                );
                // Record a placeholder result so the frontend knows which
                // segment failed.
                results.push(AudioSegmentResult {
                    text: segment.text.clone(),
                    audio_path: format!("__ERROR__: {}", e),
                    duration_secs: 0.0,
                    segment_index: idx,
                });
            }
        }
    }

    // Final progress notification
    emit_progress(
        app,
        PipelineStage::Synthesize,
        1.0,
        Some(format!("音频合成完成 ({} 段)", total - failure_count)),
    );

    if failure_count == total && total > 0 {
        let err_msg = format!("[synthesize] 全部 {} 段音频合成失败", total);
        emit_error(app, PipelineStage::Synthesize, err_msg.clone());
        return Err(err_msg);
    }

    if failure_count > 0 {
        let warn_msg = format!(
            "[synthesize] {} / {} 段音频合成失败，其余段正常",
            failure_count, total
        );
        tracing::warn!("{}", warn_msg);
        // We still return the partial results — the frontend can decide whether
        // to accept them or surface the partial-failure warning.
    }

    Ok((results, total_duration))
}
