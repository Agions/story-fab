//! TTS 核心逻辑 — synthesize_speech / list_tts_backends / check_tts_available / edge_tts_path

use std::env;
use tokio::process::Command;
use tokio::fs;

use super::types::{SynthesizeSpeechInput, SynthesizeSpeechOutput, TtsBackendInfo};
use crate::utils::cmd_err;

/// Resolve edge-tts path: CUTDECK_EDGE_TTS_PATH env > search PATH > "edge-tts"
pub fn edge_tts_path() -> String {
    if let Ok(path) = env::var("CUTDECK_EDGE_TTS_PATH") {
        if !path.trim().is_empty() {
            return path;
        }
    }
    crate::binary::resolve_binary_path("edge-tts")
}

/// Synthesize speech via edge-tts — returns audio path and duration
pub async fn synthesize_speech_impl(
    input: &SynthesizeSpeechInput,
) -> Result<SynthesizeSpeechOutput, String> {
    if input.text.trim().is_empty() {
        return Err("Text cannot be empty".to_string());
    }

    let mut tmp_audio = env::temp_dir();
    let ext = match input.format.as_str() {
        "wav" | "audio/wav" => "wav",
        "ogg" | "audio/ogg" => "ogg",
        _ => "mp3",
    };
    tmp_audio.push(format!("tts_output_{}.{}", std::process::id(), ext));
    let tmp_audio_path = tmp_audio.display().to_string();

    let mut tmp_text = env::temp_dir();
    tmp_text.push(format!("tts_input_{}.txt", std::process::id()));
    let tmp_text_path = tmp_text.display().to_string();
    fs::write(&tmp_text_path, &input.text)
        .await
        .map_err(|e| format!("Failed to write text file: {e}"))?;

    let mut cmd = Command::new(edge_tts_path());
    let rate = {
        let pct = ((input.speed - 1.0) * 100.0).round() as i32;
        if pct > 0 {
            format!("+{pct}%")
        } else {
            format!("{pct}%")
        }
    };

    cmd.arg("--file").arg(&tmp_text_path);
    cmd.arg("--voice").arg(&input.voice);
    cmd.arg("--rate").arg(&rate);
    cmd.arg("--write-media").arg(&tmp_audio_path);

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to spawn edge-tts: {e}"))?;

    let _ = fs::remove_file(&tmp_text_path).await;

    if !output.status.success() {
        return Err(cmd_err("edge-tts failed", &output));
    }

    let metadata =
        fs::metadata(&tmp_audio_path).await.map_err(|e| format!("Failed to read audio file metadata: {e}"))?;
    let file_size_bytes = metadata.len();

    let duration_secs = match ext {
        "wav" => file_size_bytes as f64 / 32000.0,
        _ => file_size_bytes as f64 / 16000.0,
    };

    Ok(SynthesizeSpeechOutput {
        audio_path: tmp_audio_path,
        duration_secs,
    })
}

/// List available TTS backends
pub async fn list_tts_backends_impl() -> Result<Vec<TtsBackendInfo>, String> {
    let edge_path = edge_tts_path();
    let edge_available = fs::metadata(edge_path).await.is_ok();
    if edge_available {
        Ok(vec![TtsBackendInfo {
            name: "edge".into(),
            label: "Microsoft Edge TTS".into(),
            description: "免费，无需 API key，音质好，需要网络".into(),
            requires_network: true,
            requires_model_download: false,
            model_path: None,
        }])
    } else {
        Ok(vec![])
    }
}

/// Check if edge-tts is available
pub async fn check_tts_available_impl() -> Result<bool, String> {
    let path = edge_tts_path();
    let output = Command::new(path)
        .arg("--version")
        .output()
        .await
        .map_err(|e| format!("edge-tts not found: {e}"))?;
    Ok(output.status.success())
}
