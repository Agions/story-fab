//! Whisper model management — split from subtitle.rs

use crate::subtitle::types::WhisperModelInfo;
use crate::utils::cmd_err;
use std::process::Command;

/// Returns the default model directory (~/.cache/whisper)
fn whisper_cache_dir() -> std::path::PathBuf {
    dirs::cache_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("whisper")
}

/// Lists available/found whisper models
#[tauri::command]
pub fn list_whisper_models() -> Vec<WhisperModelInfo> {
    let cache_dir = whisper_cache_dir();
    let known = vec![
        ("tiny", "39M", "tiny.en", "tiny"),
        ("base", "74M", "base.en", "base"),
        ("small", "244M", "small.en", "small"),
        ("medium", "769M", "medium.en", "medium"),
        ("large-v3", "1550M", "large-v3", "large-v3"),
        ("distil-large-v3", "820M", "distil-large-v3", "distil-large-v3"),
        ("distil-medium.en", "448M", "distil-medium.en", "distil-medium.en"),
        ("distil-small.en", "140M", "distil-small.en", "distil-small.en"),
    ];

    known
        .into_iter()
        .map(|(name, size, file, _)| {
            let path = cache_dir.join(file);
            WhisperModelInfo {
                name: name.to_string(),
                size: size.to_string(),
                is_downloaded: path.exists(),
                path: path.exists().then(|| path.display().to_string()),
            }
        })
        .collect()
}

/// Check if faster-whisper Python package is available
#[tauri::command]
pub fn check_faster_whisper() -> Result<bool, String> {
    let output = Command::new("python3")
        .arg("-c")
        .arg("import faster_whisper; print(faster_whisper.__version__)")
        .output();

    match output {
        Ok(result) if result.status.success() => {
            let version = String::from_utf8_lossy(&result.stdout).trim().to_string();
            log::info!("[StoryFab] faster-whisper version: {}", version);
            Ok(true)
        }
        _ => {
            log::warn!("[StoryFab] faster-whisper not installed");
            Ok(false)
        }
    }
}

/// Download a whisper model (placeholder — faster-whisper auto-downloads on first use)
#[tauri::command]
pub async fn download_whisper_model(model_size: String) -> Result<String, String> {
    log::info!("[StoryFab] Model download requested: {}", model_size);

    if !model_size.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.') {
        return Err(format!("无效的模型名称: {}", model_size));
    }

    let model_repr = format!("{:?}", model_size);
    let output = tokio::process::Command::new("python3")
        .arg("-c")
        .arg(format!(
            "from faster_whisper import WhisperModel; m = WhisperModel({}, device='cpu', compute_type='int8'); del m; print('ok')",
            model_repr
        ))
        .output()
        .await
        .map_err(|e| format!("启动下载进程失败: {}", e))?;

    if output.status.success() {
        Ok(format!("模型 {} 下载完成", model_size))
    } else {
        Err(cmd_err("模型下载失败", &output))
    }
}

/// Get supported languages for whisper transcription
#[tauri::command]
pub fn get_whisper_supported_languages() -> Vec<serde_json::Value> {
    WHISPER_LANGS
        .iter()
        .map(|(code, name)| serde_json::json!({"code": code, "name": name}))
        .collect()
}
