//! Commentary Synthesizer Commands — Tauri 命令

use std::path::PathBuf;
use tokio::fs;

use super::struct_file::CommentarySynthesizer;
use super::types::{SynthesizeResult, VoiceInfo};

/// 合成单条解说音频
#[tauri::command]
pub async fn synthesize_commentary_audio(
    text: String,
    voice: String,
    speed: f32,
    format: Option<String>,
    output_path: Option<String>,
) -> Result<SynthesizeResult, String> {
    let format = format.unwrap_or_else(|| "mp3".to_string());
    let result = CommentarySynthesizer::synthesize(&text, &voice, speed, &format).await?;

    if let Some(dest) = output_path {
        let src = PathBuf::from(&result.audio_path);
        fs::copy(&src, &dest)
            .await
            .map_err(|e| format!("复制音频文件失败: {}", e))?;

        Ok(SynthesizeResult { audio_path: dest, duration_secs: result.duration_secs })
    } else {
        Ok(result)
    }
}

/// 估算 TTS 音频时长
#[tauri::command]
pub async fn estimate_tts_duration(
    text: String,
    voice: String,
    speed: f32,
) -> Result<f64, String> {
    CommentarySynthesizer::estimate_duration(&text, &voice, speed).await
}

/// 获取推荐音色列表
#[tauri::command]
pub fn list_commentary_voices(style: Option<String>) -> Vec<VoiceInfo> {
    super::struct_file::list_voices(style)
}