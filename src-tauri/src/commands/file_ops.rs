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

    let file_path = PathBuf::from(&path);
    let canonical = file_path.canonicalize().map_err(|e| format!("路径无效或不存在: {e}"))?;

    // 统一使用 canonical 路径检查，防止符号链接穿越
    let canonical_temp = std::env::temp_dir().canonicalize()
        .map_err(|e| format!("无法解析临时目录: {e}"))?;
    if !canonical.starts_with(&canonical_temp) {
        return Err("只能删除临时目录下的文件".to_string());
    }

    if canonical.exists() {
        tokio::fs::remove_file(&canonical)
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
