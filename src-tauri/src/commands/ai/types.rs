//! AI Commands Types — 类型定义

use serde::{Deserialize, Serialize};

/// AI Director Plan 输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectorPlanInput {
    pub segments: Vec<SegmentInput>,
    pub scenes: Vec<SceneInput>,
    pub target_duration: f64,
    pub mode: String,
    pub auto_original_overlay: bool,
}

/// 片段输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SegmentInput { pub id: String, pub content: String }

/// 场景输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneInput {
    pub id: String,
    pub start_time: f64,
    pub end_time: f64,
}

/// AI Director Plan 输出
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectorPlanOutput {
    pub pacing_factor: f64,
    pub beat_count: u32,
    pub preferred_transition: String,
    pub confidence: f64,
}

/// ZCR 突发检测输入
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectZCRBurstsInput {
    pub audio_path: String,
    pub window_ms: Option<f32>,
    pub zcr_threshold_mult: Option<f32>,
}

/// ZCR 突发检测结果
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZCRBurstResult {
    pub start_ms: u64,
    pub end_ms: u64,
    pub score: f32,
}

/// TTS 输入
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SynthesizeSpeechInput {
    pub text: String,
    pub voice: String,
    pub speed: f32,
    pub format: String,
    pub backend: String,
}

/// TTS 输出
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SynthesizeSpeechOutput {
    pub audio_path: String,
    pub duration_secs: f64,
}

/// TTS 后端信息
#[derive(Debug, Serialize)]
pub struct TtsBackendInfo {
    pub name: String,
    pub label: String,
    pub description: String,
    #[serde(rename = "requiresNetwork")]
    pub requires_network: bool,
    #[serde(rename = "requiresModelDownload")]
    pub requires_model_download: bool,
    #[serde(rename = "modelPath")]
    pub model_path: Option<String>,
}