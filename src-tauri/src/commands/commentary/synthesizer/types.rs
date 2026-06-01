//! Commentary Synthesizer Types — 类型定义

use serde::{Deserialize, Serialize};

/// 合成选项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SynthesizeOptions {
    pub text: String,
    pub voice: String,
    pub speed: f32,
    pub format: Option<String>,
    pub output_path: Option<String>,
    pub volume: Option<f32>,
}

/// 合成结果
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SynthesizeResult {
    pub audio_path: String,
    pub duration_secs: f64,
}

/// 音色信息
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceInfo {
    pub id: String,
    pub name: String,
    pub gender: String,
    pub style: String,
    pub description: String,
}