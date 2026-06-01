//! Auto-save and crash-recovery tests

use super::{autosave_path, project_path};

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
