//! File operations: temp cleanup, open file in system viewer, voice discovery.

use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct VoiceDiscoveryResult {
    pub voices: Vec<VoiceInfo>,
}

#[derive(Serialize)]
pub struct VoiceInfo {
    pub name: String,
    pub locale: String,
    pub gender: String,
}

// ─── Temp File Cleanup ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn clean_temp_file(path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("路径不能为空".to_string());
    }

    let temp_dir = std::env::temp_dir();
    let file_path = PathBuf::from(&path);

    if !file_path.starts_with(&temp_dir) {
        return Err("只能删除临时目录下的文件".to_string());
    }

    if file_path.exists() {
        tokio::fs::remove_file(&path)
            .await
            .map_err(|e| format!("删除临时文件失败: {e}"))?;
    }

    Ok(())
}

// ─── Open File ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("路径不能为空".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("打开文件失败: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("打开文件失败: {e}"))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("打开文件失败: {e}"))?;
    }

    Ok(())
}

// ─── Voice Discovery ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn voice_discovery() -> Result<VoiceDiscoveryResult, String> {
    // edge-tts does not expose a voice discovery HTTP API.
    // Frontend should use hardcoded voice names matching the installed edge-tts version.
    Ok(VoiceDiscoveryResult { voices: vec![] })
}
