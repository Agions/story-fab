//! Transcode with crop — converts video to a target aspect ratio.
//!
//! Extracted from render.rs (original lines 17-49).

use crate::binary::{ffmpeg_binary, ffprobe_binary};
use crate::types::TranscodeCropInput;
use crate::utils::cmd_err;

/// Returns (crf, preset) for a quality tier.
fn quality_params(quality: Option<&str>) -> (u32, &'static str) {
    match quality {
        Some("low") => (28, "veryfast"),
        Some("medium") => (23, "fast"),
        _ => (20, "medium"),
    }
}

#[tauri::command]
pub fn transcode_with_crop(input: TranscodeCropInput) -> Result<String, String> {
    if input.input_path.trim().is_empty() || input.output_path.trim().is_empty() {
        return Err("输入或输出路径不能为空".to_string());
    }
    let mut cmd = std::process::Command::new(ffmpeg_binary());
    cmd.arg("-y");
    if let (Some(s), Some(e)) = (input.start_time, input.end_time) {
        cmd.arg("-ss").arg(s.to_string());
        cmd.arg("-t").arg((e - s).max(0.1).to_string());
    }
    cmd.arg("-i").arg(&input.input_path);
    let vf_filter: String = match input.aspect.as_str() {
        "9:16" => {
            "scale=1080:1920:force_original_aspect_ratio=decrease,crop=1080:1920:(iw-1080)/2:(ih-1920)/2,setsar=1".to_string()
        }
        "1:1" => {
            "scale='min(iw\\,ih):min(iw\\,ih)',crop='min(iw\\,ih):min(iw\\,ih)',setsar=1".to_string()
        }
        "16:9" => {
            "scale=1920:1080:force_original_aspect_ratio=decrease,crop=1920:1080:(iw-1920)/2:(ih-1080)/2,setsar=1".to_string()
        }
        _ => return Err("不支持的宽高比，仅支持 9:16、1:1、16:9".to_string()),
    };
    cmd.arg("-vf").arg(vf_filter);
    let (crf, preset) = quality_params(input.quality.as_deref());
    cmd.args(["-c:v", "libx264", "-crf", &crf.to_string(), "-preset", preset]);
    cmd.args(["-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"]);
    cmd.arg(&input.output_path);
    let output = cmd.output().map_err(|e| format!("FFmpeg 执行失败: {e}"))?;
    if output.status.success() {
        Ok(input.output_path)
    } else {
        Err(cmd_err("裁切导出失败", &output))
    }
}