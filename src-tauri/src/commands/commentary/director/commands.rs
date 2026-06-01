//! Director Tauri Commands — all 8 command handlers
//! Thin wrappers that delegate to state_ops helpers and states module

use super::state_ops::{
    apply_modifications, build_plan, parse_style, progress_for_state,
};
use super::states::{clear_state, get_state, update_state_from, unix_timestamp};
use super::types::{DirectorStatusResponse, PlanModifications};

#[tauri::command]
pub fn create_director_session(
    session_id: String,
    style: Option<String>,
) -> Result<String, String> {
    let mut machine = get_state(&session_id);
    machine.state = super::DirectorState::Idle;
    machine.style = parse_style(style);
    machine.error = None;
    machine.updated_at = unix_timestamp();
    update_state_from(&session_id, machine);

    tracing::info!("[Director] 创建会话: session_id={}", session_id);
    Ok(session_id)
}

#[tauri::command]
pub fn get_director_status(session_id: String) -> Result<DirectorStatusResponse, String> {
    let machine = get_state(&session_id);

    Ok(DirectorStatusResponse {
        session_id: machine.session_id.clone(),
        state: machine.state.to_string(),
        plan: machine.plan.clone(),
        error: machine.error.clone(),
        progress_pct: progress_for_state(machine.state),
    })
}

#[tauri::command]
pub fn start_director_analysis(
    session_id: String,
    video_path: String,
    _subtitles: String,
    target_duration_secs: Option<f64>,
) -> Result<(), String> {
    let mut machine = get_state(&session_id);
    machine.state = super::DirectorState::Analyzing;
    machine.error = None;
    machine.updated_at = unix_timestamp();
    update_state_from(&session_id, machine);

    tracing::info!(
        "[Director] 开始分析: session_id={}, video={}, duration={:?}",
        session_id, video_path, target_duration_secs
    );

    Ok(())
}

#[tauri::command]
pub fn generate_director_plan(
    session_id: String,
    style: Option<String>,
    target_duration_secs: Option<f64>,
) -> Result<super::DirectorPlan, String> {
    let mut machine = get_state(&session_id);
    machine.state = super::DirectorState::Planning;
    machine.updated_at = unix_timestamp();

    let style = parse_style(style).unwrap_or(machine.style);
    let plan = build_plan(style, target_duration_secs, &machine.analysis);

    machine.plan = Some(plan.clone());
    machine.style = style;
    machine.state = super::DirectorState::Ready;
    update_state_from(&session_id, machine);

    tracing::info!("[Director] Plan 生成: session_id={}, plan_id={}", session_id, plan.id);
    Ok(plan)
}

#[tauri::command]
pub fn approve_director_plan(session_id: String) -> Result<String, String> {
    let mut machine = get_state(&session_id);
    if machine.state != super::DirectorState::Ready {
        return Err(format!(
            "当前状态不允许确认 Plan：{:?}（需要 Ready）",
            machine.state
        ));
    }
    machine.state = super::DirectorState::Rendering;
    machine.updated_at = unix_timestamp();
    update_state_from(&session_id, machine);

    tracing::info!("[Director] Plan 确认，开始渲染: session_id={}", session_id);
    Ok("渲染已启动".to_string())
}

#[tauri::command]
pub fn revise_director_plan(
    session_id: String,
    modifications: PlanModifications,
) -> Result<super::DirectorPlan, String> {
    let mut machine = get_state(&session_id);
    if machine.state != super::DirectorState::Ready {
        return Err(format!("当前状态不允许修正：{:?}", machine.state));
    }

    if let Some(plan) = &mut machine.plan {
        apply_modifications(plan, modifications);
    }
    machine.updated_at = unix_timestamp();
    update_state_from(&session_id, machine);

    tracing::info!("[Director] Plan 修正: session_id={}", session_id);

    machine
        .plan
        .clone()
        .ok_or_else(|| "Plan 不存在".to_string())
}

#[tauri::command]
pub fn complete_director_render(session_id: String, output_path: String) -> Result<String, String> {
    let mut machine = get_state(&session_id);
    machine.state = super::DirectorState::Done;
    machine.updated_at = unix_timestamp();
    update_state_from(&session_id, machine);

    tracing::info!(
        "[Director] 渲染完成: session_id={}, output={}",
        session_id, output_path
    );

    Ok(output_path)
}

#[tauri::command]
pub fn destroy_director_session(session_id: String) -> Result<(), String> {
    clear_state(&session_id);
    tracing::info!("[Director] 会话销毁: session_id={}", session_id);
    Ok(())
}
