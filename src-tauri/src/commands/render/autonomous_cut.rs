//! Autonomous cut — AI-driven multi-segment video cutting and merging.
//!
//! Split into submodules:
//! - `autonomous_cut_impl/cutter.rs` — parallel segment cutting
//! - `autonomous_cut_impl/merger.rs` — concat / transition merge
//! - `autonomous_cut.rs` — module entry + Tauri command

use crate::binary::{ffmpeg_binary, ffprobe_binary, hw_accel, HwAccel};
use crate::commands::export_state;
use crate::types::{AutonomousRenderInput, AutonomousOverlayMarker};
use crate::utils::{chrono_like_timestamp, cmd_err, format_srt_time, write_concat_file};
use std::path::PathBuf;
use std::process::Command;

// ─── Tuning Constants ─────────────────────────────────────────────────────────

const DEFAULT_TRANSITION_DURATION: f64 = 0.35;
const MAX_TRANSITION_DURATION: f64 = 1.5;
const MIN_CLIP_DURATION: f64 = 0.1;
const DEFAULT_OVERLAY_OPACITY: f64 = 0.72;
const MIN_OVERLAY_OPACITY: f64 = 0.05;
const MAX_CONCURRENT_SEGMENTS: usize = 8;

// ─── Submodules ────────────────────────────────────────────────────────────────

pub mod autonomous_cut_impl;
use autonomous_cut_impl::cutter;
use autonomous_cut_impl::merger;

// ─── Public Command ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn render_autonomous_cut(input: AutonomousRenderInput) -> Result<String, String> {
    export_state::enter_export(&input.output_path);
    let result = render_autonomous_cut_impl(input).await;
    export_state::exit_export();
    result
}

// ─── Inner Implementation ─────────────────────────────────────────────────────

async fn render_autonomous_cut_impl(
    mut input: AutonomousRenderInput,
) -> Result<String, String> {
    let segments = input
        .segments
        .take()
        .unwrap_or_default()
        .into_iter()
        .filter(|segment| segment.end > segment.start)
        .collect::<Vec<_>>();

    let transition = input.transition.as_ref().map(String::as_str).unwrap_or("cut");
    let transition_duration = input.transition_duration.unwrap_or(DEFAULT_TRANSITION_DURATION)
        .clamp(0.0, MAX_TRANSITION_DURATION);

    let temp_root = std::env::temp_dir().join(format!(
        "story-fab_autocut_{}_{}",
        std::process::id(),
        chrono_like_timestamp()
    ));
    tokio_fs::create_dir_all(&temp_root)
        .await
        .map_err(|e| format!("创建临时目录失败: {e}"))?;
    let merged_output = temp_root.join("merged_output.mp4");

    // ── Single segment: direct copy ─────────────────────────────────────────
    if segments.len() <= 1 {
        let output_path = input.output_path.clone();
        render_single_cut_sync(&input.input_path, &merged_output.to_string_lossy(),
            input.start_time, input.end_time)?;
        apply_post_processing(&merged_output, &mut input, &temp_root, &output_path)?;
        let _ = tokio_fs::remove_file(&merged_output).await;
        let _ = tokio_fs::remove_dir(&temp_root).await;
        return Ok(output_path);
    }

    // ── Parallel cutting ──────────────────────────────────────────────────────
    let temp_files = cutter::cut_segments_parallel(
        &input.input_path, &segments, &temp_root,
    ).await?;

    // ── Merge ────────────────────────────────────────────────────────────────
    if transition == "none" || transition == "cut" {
        merger::merge_by_concat(&temp_files, &merged_output)?;
    } else {
        merger::merge_with_transitions(&temp_files, transition, transition_duration, &merged_output)?;
    }

    // ── Post-processing (subtitle burn-in, watermark) ───────────────────────
    apply_post_processing(&merged_output, &mut input, &temp_root, &input.output_path)?;
    let _ = tokio_fs::remove_file(&merged_output).await;
    let _ = tokio_fs::remove_dir(&temp_root).await;
    Ok(input.output_path)
}

// ─── Post-processing ───────────────────────────────────────────────────────────

fn apply_post_processing(
    merged_input: &PathBuf,
    input: &mut AutonomousRenderInput,
    temp_root: &PathBuf,
    final_output_path: &str,
) -> Result<(), String> {
    // subtitle burn-in, watermark, overlay — delegated to subtitle_burnin module
    let use_overlay = input.overlay_markers.as_ref().map(Vec::is_empty).unwrap_or(true);

    if !use_overlay {
        let subtitle = input.subtitle.as_mut().and_then(|s| s.as_mut());
        if let (Some(srt_content), Some(start)) = (subtitle, input.start_time) {
            let srt_normalized = normalize_srt_for_burnin(srt_content, input.end_time.unwrap_or(start + 60.0));
            let temp_srt = temp_root.join("temp.srt");
            std::fs::write(&temp_srt, srt_normalized).map_err(|e| format!("写SRT失败: {e}"))?;
            burn_subtitle_ffmpeg(merged_input, final_output_path, &temp_srt)?;
        }
    } else {
        std::fs::copy(merged_input, final_output_path)
            .map_err(|e| format!("复制最终文件失败: {e}"))?;
    }
    Ok(())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Escape path for FFmpeg filter graphs
fn escape_ffmpeg_path(path: &str) -> String {
    path.replace('\\', "\\\\").replace(':', "\\:")
}

/// Build filter_complex enable expression for overlay markers
fn build_overlay_enable_expr(markers: &[AutonomousOverlayMarker]) -> String {
    if markers.is_empty() {
        return String::new();
    }
    let exprs: Vec<String> = markers.iter().map(|m| {
        let enable = format!("between(t,{},{})", m.start_time, m.end_time);
        if let Some(ref label) = m.label {
            format!("'{enable}'*if(n\,{label}\,1)",)
        } else {
            format!("'{enable}'",)
        }
    }).collect();
    format!("enable='{}':alpha=0.8", exprs.join("+"))
}

#[derive(Clone, Debug)]
enum OverlayLayout { TopLeft, TopRight, BottomLeft, BottomRight, Center }

fn pick_overlay_layout_for_marker(_marker: &AutonomousOverlayMarker) -> OverlayLayout {
    OverlayLayout::BottomRight // default
}

/// Normalize SRT timestamps for burn-in (shift to absolute start)
fn normalize_srt_for_burnin(srt: &str, duration: f64) -> String {
    let timestamp_pattern = regex::Regex::new(r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})").unwrap();
    // Simple pass-through for now
    srt.to_string()
}

/// Burn SRT subtitle into video using FFmpeg
fn burn_subtitle_ffmpeg(input: &PathBuf, output: &str, srt_path: &PathBuf) -> Result<(), String> {
    let ffmpeg_bin = ffmpeg_binary();
    let mut cmd = std::process::Command::new(&ffmpeg_bin);
    cmd.arg("-y").arg("-i").arg(input).arg("-vf")
        .arg(format!("subtitles='{}'", srt_path.to_string_lossy()))
        .arg("-c:a").arg("copy").arg(output);
    let output = cmd.output().map_err(|e| format!("烧录字幕失败: {e}"))?;
    if !output.status.success() {
        return Err(cmd_err("烧录字幕失败", &output));
    }
    Ok(())
}

/// Render a single time segment synchronously (used for single-segment case)
fn render_single_cut_sync(input_path: &str, output: &str, start: Option<f64>, end: Option<f64>) -> Result<(), String> {
    let ffmpeg_bin = ffmpeg_binary();
    let mut cmd = std::process::Command::new(&ffmpeg_bin);
    cmd.arg("-y");
    if let Some(s) = start { cmd.arg("-ss").arg(s.to_string()); }
    if let Some(s) = start { cmd.arg("-i").arg(input_path); }
    if let (Some(s), Some(e)) = (start, end) { cmd.arg("-t").arg((e - s).max(0.1).to_string()); }
    cmd.arg("-c").arg("copy").arg(output);
    let output = cmd.output().map_err(|e| format!("单段切 clip 失败: {e}"))?;
    if !output.status.success() { return Err(cmd_err("单段切 clip 失败", &output)); }
    Ok(())
}

/// Probe video duration via ffprobe
fn probe_duration(input_path: &str) -> Result<f64, String> {
    let ffprobe_bin = ffprobe_binary();
    let output = Command::new(&ffprobe_bin)
        .args(["-v", "error", "-show_entries", "format=duration",
               "-of", "default=noprint_wrappers=1:nokey=1", input_path])
        .output()
        .map_err(|e| format!("探测时长失败: {e}"))?;
    if !output.status.success() { return Err(format!("ffprobe 失败")); }
    let s = String::from_utf8_lossy(&output.stdout);
    s.trim().parse().map_err(|e| format!("解析时长失败: {e}"))
}

/// Append ffmpeg -ss / -t time-segment args
fn apply_time_segment(cmd: &mut std::process::Command, start: Option<f64>, end: Option<f64>) {
    if let Some(s) = start { cmd.arg("-ss").arg(s.to_string()); }
    if let (Some(s), Some(e)) = (start, end) { cmd.arg("-t").arg((e - s).max(0.1).to_string()); }
}

use tokio::fs as tokio_fs;