//! Whisper subtitle types — split from subtitle.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhisperWord {
    pub word: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub probability: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
    pub probability: Option<f32>,
    #[serde(default)]
    pub words: Vec<WhisperWord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleResult {
    pub language: String,
    pub language_probability: f32,
    pub duration_ms: u64,
    pub segments: Vec<SubtitleSegment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhisperModelInfo {
    pub name: String,
    pub size: String,
    pub is_downloaded: bool,
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeProgress {
    pub stage: String,
    pub progress: f32,
    pub current_segment: Option<u32>,
    pub total_segments: Option<u32>,
}

pub const WHISPER_LANGS: &[(&str, &str)] = &[
    ("auto", "自动检测"),
    ("zh", "中文"), ("en", "英语"), ("ja", "日语"), ("ko", "韩语"),
    ("fr", "法语"), ("de", "德语"), ("es", "西班牙语"),
    ("pt", "葡萄牙语"), ("it", "意大利语"), ("ru", "俄语"),
    ("ar", "阿拉伯语"), ("hi", "印地语"), ("id", "印尼语"),
    ("ms", "马来语"), ("th", "泰语"), ("vi", "越南语"),
];
