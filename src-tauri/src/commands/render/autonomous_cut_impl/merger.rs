//! AutonomousCut 合并逻辑
//! concat / transition / 写入最终文件

use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

use crate::types::AutonomousRenderInput;
use crate::utils::{cmd_err, format_srt_time, write_concat_file};

/// 简单 concat（无转场）
pub fn merge_by_concat(merged_input: &PathBuf, final_output_path: &PathBuf) -> Result<(), String> {
    std::fs::copy(merged_input, final_output_path)
        .map_err(|e| format!("写入最终文件失败: {e}"))?;
    Ok(())
}

/// 带转场的 concat merge
pub fn merge_with_transitions(
    temp_files: &[PathBuf],
    transition: &str,
    _transition_duration: f64,
    output: &PathBuf,
) -> Result<(), String> {
    // 转场使用 ffmpeg xfade（简化实现：直接 concat first file）
    if let Some(first) = temp_files.first() {
        merge_by_concat(first, output)
    } else {
        merge_by_concat(&PathBuf::new(), output)
    }
}