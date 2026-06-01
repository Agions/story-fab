//! Project storage helpers — directory resolution for StoryFab app data

use std::path::PathBuf;
use tauri::Manager;
use tokio::fs as tokio_fs;

/// Returns (app_data_dir, story_fab_dir). Creates StoryFab subdir if needed.
pub async fn get_story_fab_dir(
    app: &tauri::AppHandle,
) -> Result<(PathBuf, PathBuf), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取 AppData 目录: {e}"))?;
    let story_fab_dir = app_dir.join("StoryFab");
    tokio_fs::create_dir_all(&story_fab_dir)
        .await
        .map_err(|e| format!("创建目录失败: {e}"))?;
    Ok((app_dir, story_fab_dir))
}
