//! AI Director Agent — 导演 Agent 核心模块
//!
//! 负责 Commentary Mode 的任务规划、状态机管理、用户介入决策
//!
//! ## 状态机（FSM）
//!
//! ```text
//! ┌──────────┐  start   ┌───────────┐  plan_done  ┌──────────┐
//! │  IDLE   │─────────▶│ ANALYZING │───────────▶│ PLANNING │
//! └──────────┘          └───────────┘            └──────────┘
//!                                                     │
//!                          user_revise ◀─────────────┤
//!                                                     │
//!                          plan_approved ▼            ▼
//! ┌──────────┐  render_done  ┌──────────┐  ┌───────────┐
//! │  DONE   │◀──────────────│ RENDERING│◀─│  READY    │
//! └──────────┘               └──────────┘  └───────────┘
//! ```

mod states;
mod types;

pub use types::*;
pub use states::*;

// ─── Tauri 命令 ────────────────────────────────────────────────────────────

/// 创建新的 Director 会话
#[tauri::command]
pub fn create_director_session(
    session_id: String,
    style: Option<String>,
) -> Result<String, String> {
    let style = style
        .and_then(|s| match s.as_str() {
            "humorous" => Some(ScriptStylePreset::Humorous),
            "serious" => Some(ScriptStylePreset::Serious),
            "conversational" => Some(ScriptStylePreset::Conversational),
            "suspense" => Some(ScriptStylePreset::Suspense),
            "warm" => Some(ScriptStylePreset::Warm),
            _ => None,
        })
        .unwrap_or_default();

    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    let machine = states.entry(session_id.clone()).or_insert_with(|| DirectorStateMachine {
        session_id: session_id.clone(),
        state: DirectorState::Idle,
        plan: None,
        script: None,
        analysis: None,
        style,
        error: None,
        created_at: unix_timestamp(),
        updated_at: unix_timestamp(),
    });
    machine.state = DirectorState::Idle;
    machine.error = None;
    machine.updated_at = unix_timestamp();

    tracing::info!("[Director] 创建会话: session_id={}, style={:?}", session_id, style);
    Ok(session_id)
}

/// 获取 Director 状态
#[tauri::command]
pub fn get_director_status(session_id: String) -> Result<DirectorStatusResponse, String> {
    let machine = get_or_create_state(&session_id);
    let progress_pct = match machine.state {
        DirectorState::Idle => 0.0,
        DirectorState::Analyzing => 0.2,
        DirectorState::Planning => 0.4,
        DirectorState::Ready => 0.6,
        DirectorState::Rendering => 0.8,
        DirectorState::Done => 1.0,
    };

    Ok(DirectorStatusResponse {
        session_id: machine.session_id.clone(),
        state: machine.state.to_string(),
        plan: machine.plan.clone(),
        error: machine.error.clone(),
        progress_pct,
    })
}

/// 开始分析视频（切换到 Analyzing 状态）
#[tauri::command]
pub fn start_director_analysis(
    session_id: String,
    video_path: String,
    subtitles: String,
    target_duration_secs: Option<f64>,
) -> Result<(), String> {
    let mut machine = get_or_create_state(&session_id);
    machine.state = DirectorState::Analyzing;
    machine.error = None;
    machine.updated_at = unix_timestamp();

    tracing::info!(
        "[Director] 开始分析: session_id={}, video={}, duration={:?}",
        session_id,
        video_path,
        target_duration_secs
    );

    Ok(())
}

/// 生成 Director Plan（切换到 Planning 状态）
#[tauri::command]
pub fn generate_director_plan(
    session_id: String,
    style: Option<String>,
    target_duration_secs: Option<f64>,
) -> Result<DirectorPlan, String> {
    let mut machine = get_or_create_state(&session_id);
    machine.state = DirectorState::Planning;
    machine.updated_at = unix_timestamp();

    let style = style
        .and_then(|s| match s.as_str() {
            "humorous" => Some(ScriptStylePreset::Humorous),
            "serious" => Some(ScriptStylePreset::Serious),
            "conversational" => Some(ScriptStylePreset::Conversational),
            "suspense" => Some(ScriptStylePreset::Suspense),
            "warm" => Some(ScriptStylePreset::Warm),
            _ => None,
        })
        .unwrap_or(machine.style);

    let analysis = machine.analysis.clone();
    let summary = analysis
        .as_ref()
        .map(|a| a.summary.clone())
        .unwrap_or_else(|| "视频内容分析中...".to_string());

    let plan = DirectorPlan {
        id: uuid_simple(),
        summary,
        angle: analysis
            .as_ref()
            .map(|a| a.recommended_angle.clone())
            .unwrap_or_else(|| "剧情解说".to_string()),
        target_audience: analysis
            .as_ref()
            .and_then(|a| a.target_audience.clone()),
        target_duration_secs: target_duration_secs.unwrap_or(120.0),
        estimated_segments: 5,
        segment_mode: SegmentMode::OriginalAudio,
        recommended_voice: default_voice_for_style(style),
        key_points: analysis
            .as_ref()
            .map(|a| a.highlights.clone())
            .unwrap_or_default(),
        warnings: vec![],
        confidence: 0.75,
    };

    machine.plan = Some(plan.clone());
    machine.style = style;
    machine.state = DirectorState::Ready;

    tracing::info!(
        "[Director] Plan 生成: session_id={}, plan_id={}, confidence={}",
        session_id,
        plan.id,
        plan.confidence
    );

    Ok(plan)
}

/// 确认 Plan 并开始渲染（切换到 Rendering 状态）
#[tauri::command]
pub fn approve_director_plan(session_id: String) -> Result<String, String> {
    let mut machine = get_or_create_state(&session_id);
    if machine.state != DirectorState::Ready {
        return Err(format!(
            "当前状态不允许确认 Plan：{:?}（需要 Ready）",
            machine.state
        ));
    }
    machine.state = DirectorState::Rendering;
    machine.updated_at = unix_timestamp();

    tracing::info!("[Director] Plan 确认，开始渲染: session_id={}", session_id);
    Ok("渲染已启动".to_string())
}

/// 用户修正 Plan
#[tauri::command]
pub fn revise_director_plan(
    session_id: String,
    modifications: PlanModifications,
) -> Result<DirectorPlan, String> {
    let mut machine = get_or_create_state(&session_id);
    if machine.state != DirectorState::Ready {
        return Err(format!("当前状态不允许修正：{:?}", machine.state));
    }

    // 应用用户修正 — 用临时变量避免 modifications 字段被 move 后又被引用
    let (target_duration, angle, segment_mode, voice) = (
        modifications.target_duration_secs,
        modifications.angle,
        modifications.segment_mode,
        modifications.recommended_voice,
    );

    if let Some(plan) = &mut machine.plan {
        if let Some(duration) = target_duration {
            plan.target_duration_secs = duration;
        }
        if let Some(a) = angle {
            plan.angle = a;
        }
        if let Some(segments) = segment_mode {
            plan.segment_mode = segments;
        }
        if let Some(v) = voice {
            plan.recommended_voice = v;
        }
        plan.confidence = (plan.confidence + 0.05).min(0.95);
    }

    machine.updated_at = unix_timestamp();

    tracing::info!(
        "[Director] Plan 修正: session_id={}",
        session_id
    );

    machine
        .plan
        .clone()
        .ok_or_else(|| "Plan 不存在".to_string())
}

/// 渲染完成（切换到 Done 状态）
#[tauri::command]
pub fn complete_director_render(session_id: String, output_path: String) -> Result<String, String> {
    let mut machine = get_or_create_state(&session_id);
    machine.state = DirectorState::Done;
    machine.updated_at = unix_timestamp();

    tracing::info!(
        "[Director] 渲染完成: session_id={}, output={}",
        session_id,
        output_path
    );

    Ok(output_path)
}

/// 销毁 Director 会话
#[tauri::command]
pub fn destroy_director_session(session_id: String) -> Result<(), String> {
    clear_state(&session_id);
    tracing::info!("[Director] 会话销毁: session_id={}", session_id);
    Ok(())
}