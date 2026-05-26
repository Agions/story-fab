//! Auto-save and crash-recovery for StoryFab projects.
//!
//! Design:
//! - `auto_save_project` writes a `{project_id}.autosave.json` next to the project file.
//!   This is the "in-progress" copy that survives crashes.
//! - After a successful full save, frontend calls `clear_autosave` to remove it.
//! - `list_autosaves` returns any recoverable autosave files for startup recovery UI.
//! - `recover_autosave` renames the autosave back to the main project file.

use std::path::PathBuf;
use tauri::Manager;
use tokio::fs as tokio_fs;

/// Returns the autosave path for a given project_id.
fn autosave_path(story_fab_dir: &PathBuf, project_id: &str) -> PathBuf {
    story_fab_dir.join(format!("{}.autosave.json", project_id))
}

/// Returns the main project file path for a given project_id.
fn project_path(story_fab_dir: &PathBuf, project_id: &str) -> PathBuf {
    story_fab_dir.join(format!("{}.json", project_id))
}

/// Returns the story-fab_dir (shared with project.rs storage).
async fn get_story_fab_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取 AppData 目录: {e}"))?;
    let story_fab_dir = app_dir.join("StoryFab");
    tokio_fs::create_dir_all(&story_fab_dir)
        .await
        .map_err(|e| format!("创建目录失败: {e}"))?;
    Ok(story_fab_dir)
}

/// Write an autosave snapshot of the project.
/// The autosave file is stored as `{project_id}.autosave.json`.
/// A successful "save_project_file" should be followed by "clear_autosave".
#[tauri::command]
pub async fn auto_save_project(
    app: tauri::AppHandle,
    project_id: String,
    content: String,
) -> Result<(), String> {
    let story_fab_dir = get_story_fab_dir(&app).await?;
    let target_path = autosave_path(&story_fab_dir, &project_id);

    tokio_fs::write(&target_path, &content)
        .await
        .map_err(|e| format!("自动保存失败: {e}"))?;

    tracing::debug!("[StoryFab] Autosaved project {} to {:?}", project_id, target_path);
    Ok(())
}

/// Remove the autosave file after a successful full save.
#[tauri::command]
pub async fn clear_autosave(
    app: tauri::AppHandle,
    project_id: String,
) -> Result<(), String> {
    let story_fab_dir = get_story_fab_dir(&app).await?;
    let autosave = autosave_path(&story_fab_dir, &project_id);

    if autosave.exists() {
        tokio_fs::remove_file(&autosave)
            .await
            .map_err(|e| format!("清除自动保存失败: {e}"))?;
        tracing::debug!("[StoryFab] Cleared autosave for project {}", project_id);
    }
    Ok(())
}

/// List all projects that have a pending autosave (for crash-recovery UI).
/// Returns project_ids that have a `.autosave.json` but no corresponding `.json`.
#[tauri::command]
pub async fn list_recoverable_projects(
    app: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    let story_fab_dir = get_story_fab_dir(&app).await?;
    let mut recoverable = Vec::new();

    let mut entries = tokio_fs::read_dir(&story_fab_dir)
        .await
        .map_err(|e| format!("读取项目目录失败: {e}"))?;

    let mut dir_entry = entries
        .next_entry()
        .await
        .map_err(|e| format!("读取目录项失败: {e}"))?;

    while let Some(entry) = dir_entry {
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) == Some("json") {
            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                if stem.ends_with(".autosave") {
                    let project_id = stem.strip_suffix(".autosave").unwrap_or(stem).to_string();
                    recoverable.push(project_id);
                }
            }
        }
        dir_entry = entries
            .next_entry()
            .await
            .map_err(|e| format!("读取目录项失败: {e}"))?;
    }

    Ok(recoverable)
}

/// Recover a project from its autosave file — renames `.autosave.json` → `.json`.
#[tauri::command]
pub async fn recover_autosave(
    app: tauri::AppHandle,
    project_id: String,
) -> Result<String, String> {
    let story_fab_dir = get_story_fab_dir(&app).await?;
    let autosave = autosave_path(&story_fab_dir, &project_id);
    let main_file = project_path(&story_fab_dir, &project_id);

    if !autosave.exists() {
        return Err(format!("没有找到项目 {} 的自动保存", project_id));
    }

    // Read content first (so we can return it)
    let content = tokio_fs::read_to_string(&autosave)
        .await
        .map_err(|e| format!("读取自动保存失败: {e}"))?;

    // Remove old main file if it exists
    if main_file.exists() {
        tokio_fs::remove_file(&main_file)
            .await
            .map_err(|e| format!("删除旧项目文件失败: {e}"))?;
    }

    // Rename autosave → main project file
    tokio_fs::rename(&autosave, &main_file)
        .await
        .map_err(|e| format!("恢复自动保存失败: {e}"))?;

    tracing::info!("[StoryFab] Recovered project {} from autosave", project_id);
    Ok(content)
}

/// Load the autosave content without recovering it (preview before recovery).
#[tauri::command]
pub async fn preview_autosave(
    app: tauri::AppHandle,
    project_id: String,
) -> Result<String, String> {
    let story_fab_dir = get_story_fab_dir(&app).await?;
    let autosave = autosave_path(&story_fab_dir, &project_id);

    if !autosave.exists() {
        return Err(format!("没有找到项目 {} 的自动保存", project_id));
    }

    tokio_fs::read_to_string(&autosave)
        .await
        .map_err(|e| format!("读取自动保存失败: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_autosave_path_format() {
        let dir = std::path::PathBuf::from("/data/story-fab");
        let id = "my-project";
        let result = autosave_path(&dir, id);
        assert_eq!(result, std::path::PathBuf::from("/data/story-fab/my-project.autosave.json"));
    }

    #[test]
    fn test_project_path_format() {
        let dir = std::path::PathBuf::from("/data/story-fab");
        let id = "my-project";
        let result = project_path(&dir, id);
        assert_eq!(result, std::path::PathBuf::from("/data/story-fab/my-project.json"));
    }

    #[test]
    fn test_autosave_path_strips_suffix_correctly() {
        let dir = std::path::PathBuf::from("/data/story-fab");
        // Test that autosave file with project_id "proj" becomes "proj.autosave.json"
        let result = autosave_path(&dir, "proj");
        assert!(result.to_str().unwrap().contains(".autosave.json"));
    }

    #[test]
    fn test_autosave_path_unique_per_id() {
        let dir = std::path::PathBuf::from("/data/story-fab");
        let p1 = autosave_path(&dir, "project-a");
        let p2 = autosave_path(&dir, "project-b");
        assert_ne!(p1, p2);
    }
}
