//! Director Types — 类型定义

use serde::{Deserialize, Serialize};

/// Director 状态机
#[derive(Debug, Clone)]
pub struct DirectorStateMachine {
    /// 当前会话 ID
    pub session_id: String,
    /// 当前状态
    pub state: super::DirectorState,
    /// 当前 Plan（生成的计划）
    pub plan: Option<super::DirectorPlan>,
    /// 已生成的解说脚本
    pub script: Option<super::super::script_generator::ScriptGeneratorOutput>,
    /// 分析结果
    pub analysis: Option<super::VideoAnalysisResult>,
    /// 风格预设
    pub style: super::ScriptStylePreset,
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
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptStylePreset {
    /// 幽默风趣
    #[default]
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
    pub segment_mode: super::SegmentMode,
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
    pub video_type: super::VideoType,
    /// 内容分级
    pub content_rating: super::ContentRating,
    /// 情感曲线（每个时间点的情感标签）
    pub emotion_timeline: Vec<super::EmotionPoint>,
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