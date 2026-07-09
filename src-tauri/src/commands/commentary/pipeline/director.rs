//! Director Phase Orchestrator
//!
//! Wraps the four Director state-machine calls (`create → start → generate →
//! approve`) into a single async function that emits `pipeline-progress` events
//! at each transition and cleans up on error.

use tauri::{AppHandle, Emitter};

use crate::commands::commentary::pipeline::types::{
    PipelineProgressPayload, PipelineStage,
};
use crate::commands::commentary::{
    approve_director_plan, create_director_session, destroy_director_session,
    generate_director_plan, start_director_analysis,
};
use crate::commands::commentary::director::types::DirectorPlan;

const PIPELINE_PROGRESS_EVENT: &str = "pipeline-progress";

/// Helper: emit a progress event. Silently drops if no listeners are present.
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

/// Run the Director phase of the commentary pipeline.
///
/// # Steps
/// 1. `create_director_session`
/// 2. `start_director_analysis`
/// 3. `generate_director_plan`
/// 4. `approve_director_plan` (auto-approve; P0 always approves)
///
/// On any failure the Director session is destroyed and a `pipeline-error`
/// event is emitted before returning `Err`.
pub async fn run_director_phase(
    app: &AppHandle,
    input: &crate::commands::commentary::pipeline::types::CommentaryPipelineInput,
) -> Result<DirectorPlan, String> {
    use crate::commands::commentary::pipeline::types::parse_style_for_director;

    // ── Step 1: Create session ──────────────────────────────────────────────
    emit_progress(
        app,
        PipelineStage::Director,
        0.0,
        Some("创建 Director 会话".into()),
    );

    let _style_preset = parse_style_for_director(input.style.as_deref());
    let session_id = create_director_session(input.session_id.clone(), input.style.clone())
        .map_err(|e| format!("[director] 创建会话失败：{}", e))?;

    // ── Step 2: Start analysis ──────────────────────────────────────────────
    emit_progress(
        app,
        PipelineStage::Director,
        0.25,
        Some("开始视频分析".into()),
    );

    start_director_analysis(
        session_id.clone(),
        input.video_path.clone(),
        input.subtitles.clone(),
        input.target_duration_secs,
    )
    .map_err(|e| {
        let _ = destroy_director_session(session_id.clone());
        format!("[director] 启动分析失败：{}", e)
    })?;

    // ── Step 3: Generate plan ───────────────────────────────────────────────
    emit_progress(
        app,
        PipelineStage::Director,
        0.5,
        Some("正在生成解说 Plan...".into()),
    );

    let plan = generate_director_plan(
        session_id.clone(),
        input.style.clone(),
        input.target_duration_secs,
    )
    .map_err(|e| {
        let _ = destroy_director_session(session_id.clone());
        format!("[director] 生成 Plan 失败：{}", e)
    })?;

    // ── Step 4: Auto-approve (P0 always approves) ───────────────────────────
    emit_progress(
        app,
        PipelineStage::Director,
        0.75,
        Some("确认 Plan".into()),
    );

    approve_director_plan(session_id.clone())
        .map_err(|e| format!("[director] 确认 Plan 失败：{}", e))?;

    // ── Complete ────────────────────────────────────────────────────────────
    emit_progress(
        app,
        PipelineStage::Director,
        1.0,
        Some("Director 阶段完成".into()),
    );

    Ok(plan)
}
