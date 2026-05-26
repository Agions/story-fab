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

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

/// Director 全局状态表（thread-safe）
static DIRECTOR_STATES: Lazy<Mutex<HashMap<String, DirectorStateMachine>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// Director 状态机
#[derive(Debug, Clone)]
pub struct DirectorStateMachine {
    /// 当前会话 ID
    pub session_id: String,
    /// 当前状态
    pub state: DirectorState,
    /// 当前 Plan（生成的计划）
    pub plan: Option<DirectorPlan>,
    /// 已生成的解说脚本
    pub script: Option<super::script_generator::ScriptGeneratorOutput>,
    /// 分析结果
    pub analysis: Option<VideoAnalysisResult>,
    /// 风格预设
    pub style: ScriptStylePreset,
    /// 错误信息（如有）
    pub error: Option<String>,
    /// 创建时间戳
    pub created_at: i64,
    /// 最后更新时间戳
    pub updated_at: i64,
}

/// Director Agent 状态枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DirectorState {
    /// 空闲状态
    Idle,
    /// 分析中（分析视频内容）
    Analyzing,
    /// 规划中（生成解说 Plan）
    Planning,
    /// 就绪（Plan 已确认，等待执行）
    Ready,
    /// 渲染中（执行配音合成 + 成片渲染）
    Rendering,
    /// 完成
    Done,
}

impl std::fmt::Display for DirectorState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DirectorState::Idle => write!(f, "idle"),
            DirectorState::Analyzing => write!(f, "analyzing"),
            DirectorState::Planning => write!(f, "planning"),
            DirectorState::Ready => write!(f, "ready"),
            DirectorState::Rendering => write!(f, "rendering"),
            DirectorState::Done => write!(f, "done"),
        }
    }
}

/// 风格预设（5 种）
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptStylePreset {
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

impl Default for ScriptStylePreset {
    fn default() -> Self {
        ScriptStylePreset::Conversational
    }
}

/// Director Plan — 导演计划
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectorPlan {
    /// 计划 ID
    pub id: String,
    /// 视频内容摘要
    pub summary: String,
    /// 解说角度/主题
    pub angle: String,
    /// 目标受众
    pub target_audience: Option<String>,
    /// 解说时长（秒）
    pub target_duration_secs: f64,
    /// 预计片段数
    pub estimated_segments: usize,
    /// 片段模式
    pub segment_mode: SegmentMode,
    /// 推荐 TTS 音色
    pub recommended_voice: String,
    /// 核心信息点列表
    pub key_points: Vec<String>,
    /// 风险提示（如有）
    pub warnings: Vec<String>,
    /// 置信度 0.0-1.0
    pub confidence: f64,
}

/// 片段模式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SegmentMode {
    /// 纯静音模式（保留背景音乐，解说覆盖原声）
    SilentOnly,
    /// 原声模式（解说 + 原声混音）
    OriginalAudio,
    /// 素材重组模式（仅保留关键片段重新剪辑）
    Montage,
}

/// 视频分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoAnalysisResult {
    /// 内容摘要
    pub summary: String,
    /// 核心看点
    pub highlights: Vec<String>,
    /// 推荐解说角度
    pub recommended_angle: String,
    /// 目标受众
    pub target_audience: Option<String>,
    /// 视频类型
    pub video_type: VideoType,
    /// 内容分级
    pub content_rating: ContentRating,
    /// 情感曲线（每个时间点的情感标签）
    pub emotion_timeline: Vec<EmotionPoint>,
}

/// 视频类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VideoType {
    Movie,
    Drama,
    Documentary,
    Variety,
    Short,
    Unknown,
}

/// 内容分级
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ContentRating {
    General,
    PG,
    PG13,
    R,
    Unknown,
}

/// 情感时间点
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmotionPoint {
    pub start_time: f64,
    pub end_time: f64,
    pub emotion: String,
    pub intensity: f64,
}

/// 导演状态响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectorStatusResponse {
    pub session_id: String,
    pub state: String,
    pub plan: Option<DirectorPlan>,
    pub error: Option<String>,
    pub progress_pct: f64,
}

// ─── 状态管理 ──────────────────────────────────────────────────────────────

/// 获取或创建 Director 状态机
pub fn get_or_create_state(session_id: &str) -> DirectorStateMachine {
    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    states
        .entry(session_id.to_string())
        .or_insert_with(|| DirectorStateMachine {
            session_id: session_id.to_string(),
            state: DirectorState::Idle,
            plan: None,
            script: None,
            analysis: None,
            style: ScriptStylePreset::Conversational,
            error: None,
            created_at: unix_timestamp(),
            updated_at: unix_timestamp(),
        })
        .clone()
}

/// 更新 Director 状态
pub fn update_state(session_id: &str, new_state: DirectorState) {
    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    if let Some(machine) = states.get_mut(session_id) {
        machine.state = new_state;
        machine.updated_at = unix_timestamp();
    }
}

/// 清除 Director 状态
pub fn clear_state(session_id: &str) {
    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    states.remove(session_id);
}

fn unix_timestamp() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

// ─── Tauri 命令 ──────────────────────────────────────────────────────────

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

    let machine = get_or_create_state(&session_id);
    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    if let Some(m) = states.get_mut(&session_id) {
        m.style = style;
        m.state = DirectorState::Idle;
        m.error = None;
        m.updated_at = unix_timestamp();
    }

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
        session_id: machine.session_id,
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

    // 实际分析在后台任务中执行，这里仅更新状态
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

// ─── 辅助结构体 ───────────────────────────────────────────────────────────

/// 用户对 Plan 的修正
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanModifications {
    /// 目标时长修正
    pub target_duration_secs: Option<f64>,
    /// 解说角度修正
    pub angle: Option<String>,
    /// 片段模式修正
    pub segment_mode: Option<SegmentMode>,
    /// 推荐音色修正
    pub recommended_voice: Option<String>,
}

impl Default for PlanModifications {
    fn default() -> Self {
        Self {
            target_duration_secs: None,
            angle: None,
            segment_mode: None,
            recommended_voice: None,
        }
    }
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────

fn default_voice_for_style(style: ScriptStylePreset) -> String {
    match style {
        ScriptStylePreset::Humorous => "zh-CN-XiaoxiaoNeural".to_string(),
        ScriptStylePreset::Serious => "zh-CN-YunxiNeural".to_string(),
        ScriptStylePreset::Conversational => "zh-CN-YunyangNeural".to_string(),
        ScriptStylePreset::Suspense => "zh-CN-XiaoyiNeural".to_string(),
        ScriptStylePreset::Warm => "zh-CN-XiaoxiaoNeural".to_string(),
    }
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("plan_{}", now)
}