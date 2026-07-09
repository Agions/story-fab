//! Crash recovery helpers — types and path resolution.
//!
//! Extracted from `utils/resilience.rs` to keep each module under 300 lines.
//! The actual Tauri commands remain in `commands/crash_recovery.rs`.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

/// Lightweight summary returned by `list_crashes`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrashSummary {
    pub filename: String,
    pub timestamp: u64,
    pub size_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview: Option<String>,
}

/// Full crash record, returned by `read_crash`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrashRecord {
    pub filename: String,
    pub timestamp: u64,
    pub payload: String,
    pub location: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backtrace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

/// Strip the `crash-<ts>.json` prefix and parse the timestamp.
pub fn parse_crash_timestamp(filename: &str) -> Option<u64> {
    let stem = filename.strip_prefix("crash-")?.strip_suffix(".json")?;
    stem.parse::<u64>().ok()
}

/// Resolve the crashes directory for the given Tauri app.
pub fn crash_dir_path(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取 AppData 目录: {e}"))?;
    let dir = base.join("crashes");
    Ok(dir)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_crash_timestamp_accepts_valid_names() {
        assert_eq!(parse_crash_timestamp("crash-1700000000.json"), Some(1_700_000_000));
        assert_eq!(parse_crash_timestamp("crash-0.json"), Some(0));
    }

    #[test]
    fn parse_crash_timestamp_rejects_invalid_names() {
        assert_eq!(parse_crash_timestamp("crash.json"), None);
        assert_eq!(parse_crash_timestamp("crash-abc.json"), None);
        assert_eq!(parse_crash_timestamp("crash-1700000000.txt"), None);
        assert_eq!(parse_crash_timestamp("1700000000.json"), None);
        assert_eq!(parse_crash_timestamp("../crash-1.json"), None);
        assert_eq!(parse_crash_timestamp(""), None);
    }

    #[test]
    fn parse_crash_timestamp_rejects_negative_or_overflow() {
        assert_eq!(parse_crash_timestamp("crash--1.json"), None);
    }
}
