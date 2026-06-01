//! TTS (Edge TTS) + Translation — edge-tts 语音合成 + 翻译

use std::env;
use tokio::process::Command;
use tokio::fs;
use serde::Deserialize;
use serde::Serialize;

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

// ─── TTS ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn synthesize_speech(
    input: SynthesizeSpeechInput,
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
        if pct > 0 { format!("+{pct}%") } else { format!("{pct}%") }
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

    let metadata = fs::metadata(&tmp_audio_path)
        .await
        .map_err(|e| format!("Failed to read audio file metadata: {e}"))?;
    let file_size_bytes = metadata.len();

    let duration_secs = match ext {
        "wav" => file_size_bytes as f64 / 32000.0,
        _ => file_size_bytes as f64 / 16000.0,
    };

    Ok(SynthesizeSpeechOutput { audio_path: tmp_audio_path, duration_secs })
}

#[tauri::command]
pub async fn list_tts_backends() -> Result<Vec<TtsBackendInfo>, String> {
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

#[tauri::command]
pub async fn check_tts_available() -> Result<bool, String> {
    let path = edge_tts_path();
    let output = Command::new(path)
        .arg("--version")
        .output()
        .await
        .map_err(|e| format!("edge-tts not found: {e}"))?;
    Ok(output.status.success())
}

// ─── Translation ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn translate_text(text: String, from_lang: String, to_lang: String) -> Result<String, String> {
    if text.trim().is_empty() {
        return Err("Text cannot be empty".to_string());
    }

    let langpair = format!("{}|{}", from_lang, to_lang);

    let output = Command::new("curl")
        .arg("-s")
        .arg("-G")
        .arg("--data-urlencode")
        .arg(format!("q={}", text))
        .arg("--data-urlencode")
        .arg(format!("langpair={}", langpair))
        .arg("https://api.mymemory.translated.net/get")
        .output()
        .await
        .map_err(|e| format!("Failed to spawn curl: {e}"))?;

    if !output.status.success() {
        return Err(cmd_err("curl failed", &output));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    #[derive(Deserialize)]
    struct MyMemoryResponse {
        response_data: Option<ResponseData>,
        response_status: Option<i32>,
    }
    #[derive(Deserialize)]
    struct ResponseData { translated_text: Option<String> }

    let resp: MyMemoryResponse = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse translation response: {e}"))?;

    if resp.response_status != Some(200) {
        return Err(format!("Translation API error: status {:?}", resp.response_status));
    }

    resp.response_data
        .and_then(|d| d.translated_text)
        .ok_or_else(|| "No translation returned".to_string())
}