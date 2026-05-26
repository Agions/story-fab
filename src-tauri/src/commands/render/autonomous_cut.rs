//! Autonomous cut — AI-driven multi-segment video cutting and merging.
//!
//! Extracted from render.rs (original lines 51-637), which also held the
//! helpers: apply_time_segment, render_single_cut_sync, apply_post_processing,
//! merge_by_concat, merge_with_transitions, probe_duration, escape_ffmpeg_path,
//! build_overlay_enable_expr, OverlayLayout, pick_overlay_layout_for_marker.

use crate::binary::{ffmpeg_binary, ffprobe_binary, hw_accel, HwAccel};
use crate::commands::export_state;
use crate::types::{AutonomousRenderInput, AutonomousOverlayMarker};
use crate::utils::{chrono_like_timestamp, cmd_err, format_srt_time, write_concat_file};
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use tokio::process::Command as TokioCommand;
use tokio::fs as tokio_fs;
use tokio::sync::Semaphore;

// ─── Tuning Constants ─────────────────────────────────────────────────────────

const DEFAULT_TRANSITION_DURATION: f64 = 0.35;
const MAX_TRANSITION_DURATION: f64 = 1.5;
const MIN_CLIP_DURATION: f64 = 0.1;
const DEFAULT_OVERLAY_OPACITY: f64 = 0.72;
const MIN_OVERLAY_OPACITY: f64 = 0.05;
// Limit concurrent FFmpeg processes to avoid overwhelming the system
const MAX_CONCURRENT_SEGMENTS: usize = 8;

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
    let transition_duration = input.transition_duration.unwrap_or(DEFAULT_TRANSITION_DURATION).clamp(0.0, MAX_TRANSITION_DURATION);

    let temp_root = std::env::temp_dir().join(format!(
        "story-fab_autocut_{}_{}",
        std::process::id(),
        chrono_like_timestamp()
    ));
    tokio_fs::create_dir_all(&temp_root)
        .await
        .map_err(|e| format!("创建临时目录失败: {e}"))?;
    let merged_output = temp_root.join("merged_output.mp4");

    if segments.len() <= 1 {
        let fallback_output = merged_output.to_string_lossy().to_string();
        let output_path = input.output_path.clone();
        render_single_cut_sync(&input.input_path, &fallback_output, input.start_time, input.end_time)?;
        apply_post_processing(&merged_output, &mut input.clone(), &temp_root, &output_path)?;
        let _ = tokio_fs::remove_file(&merged_output).await;
        let _ = tokio_fs::remove_dir(&temp_root).await;
        return Ok(output_path);
    }

    // ── Parallel segment cutting via Tokio (bounded concurrency) ────────────────
    let ffmpeg_bin = ffmpeg_binary();
    let input_path = input.input_path.clone();
    let temp_root_clone = temp_root.clone();
    let sem = Arc::new(Semaphore::new(MAX_CONCURRENT_SEGMENTS));

    let tasks: Vec<_> = segments
        .iter()
        .enumerate()
        .map(|(index, segment)| {
            let ffmpeg_bin = ffmpeg_bin.clone();
            let input_path = input_path.clone();
            let temp_root = temp_root_clone.clone();
            let sem = Arc::clone(&sem);
            async move {
                // Acquire permit before starting FFmpeg — bounds parallelism to MAX_CONCURRENT_SEGMENTS
                let _permit = sem.acquire_owned().await.expect("semaphore closed");
                let temp_file = temp_root.join(format!("seg_{index}.mp4"));
                let duration = (segment.end - segment.start).max(0.1);
                let hw = hw_accel();
                let preset = if hw == HwAccel::Cpu { "veryfast" } else { "fast" };
                let output = TokioCommand::new(&ffmpeg_bin)
                    .arg("-y")
                    .arg("-ss")
                    .arg(segment.start.to_string())
                    .arg("-t")
                    .arg(duration.to_string())
                    .arg("-i")
                    .arg(&input_path)
                    .arg("-c:v")
                    .arg(hw.h264_encoder())
                    .arg("-preset")
                    .arg(preset)
                    .arg("-c:a")
                    .arg("aac")
                    .arg("-movflags")
                    .arg("+faststart")
                    .arg(temp_file.to_string_lossy().as_ref())
                    .output()
                    .await
                    .map_err(|e| format!("执行 ffmpeg 切段失败: {e}"))?;
                if !output.status.success() {
                    return Err(cmd_err("切段失败", &output));
                }
                Ok::<PathBuf, String>(temp_file)
            }
        })
        .collect();

    let results = futures_util::future::join_all(tasks).await;
    let mut temp_files: Vec<PathBuf> = Vec::new();
    for result in results {
        temp_files.push(result?);
    }

    // ── Merge ────────────────────────────────────────────────────────────────
    let merge_result = if transition == "cut" || transition_duration <= 0.0 {
        merge_by_concat(&temp_root, &temp_files, &merged_output.to_string_lossy())
    } else {
        merge_with_transitions(
            &temp_root,
            &temp_files,
            &merged_output.to_string_lossy(),
            transition,
            transition_duration,
        )
        .or_else(|_| merge_by_concat(&temp_root, &temp_files, &merged_output.to_string_lossy()))
    };

    // Cleanup temp segment files
    for file in temp_files {
        let _ = tokio_fs::remove_file(&file).await;
    }

    if let Err(e) = merge_result {
        let _ = tokio_fs::remove_file(&merged_output).await;
        let _ = tokio_fs::remove_dir(&temp_root).await;
        return Err(format!("自动出片合并失败: {e}"));
    }

    let output_path = input.output_path.clone();
    let post_result =
        apply_post_processing(&merged_output, &mut input, &temp_root, &output_path);

    // Cleanup
    let _ = tokio_fs::remove_file(&merged_output).await;
    let _ = tokio_fs::remove_dir(&temp_root).await;

    post_result.map(|_| output_path)
}

/// Synchronous single-cut fallback (keeps existing logic, no async needed)
fn render_single_cut_sync(
    input_path: &str,
    output_path: &str,
    start: Option<f64>,
    end: Option<f64>,
) -> Result<String, String> {
    let mut cmd = Command::new(ffmpeg_binary());
    cmd.arg("-y");
    apply_time_segment(&mut cmd, start, end);
    cmd.arg("-i").arg(input_path);
    let hw = hw_accel();
    cmd.arg("-c:v").arg(hw.h264_encoder());
    cmd.arg("-c:a").arg("aac");
    cmd.arg("-movflags").arg("+faststart");
    cmd.arg(output_path);
    let output = cmd
        .output()
        .map_err(|e| format!("执行 ffmpeg 失败（请确认已安装 ffmpeg）: {e}"))?;
    if output.status.success() {
        Ok(output_path.to_string())
    } else {
        Err(cmd_err("自动出片失败", &output))
    }
}

/// Append ffmpeg -ss / -t time-segment args to `cmd` from start/end Option<f64>.
fn apply_time_segment(cmd: &mut std::process::Command, start: Option<f64>, end: Option<f64>) {
    if let Some(s) = start {
        cmd.arg("-ss").arg(s.to_string());
    }
    if let (Some(s), Some(e)) = (start, end) {
        cmd.arg("-t").arg((e - s).max(0.1).to_string());
    }
}

// ─── Post-processing ─────────────────────────────────────────────────────────

fn apply_post_processing(
    merged_input: &PathBuf,
    input: &mut AutonomousRenderInput,
    temp_root: &PathBuf,
    final_output_path: &str,
) -> Result<(), String> {
    let burn_subtitles = input.burn_subtitles.unwrap_or(false);
    let apply_overlay = input.apply_overlay_markers.unwrap_or(false);
    let overlay_mix_mode = input
        .overlay_mix_mode
        .as_deref()
        .unwrap_or("pip");
    let overlay_opacity = input.overlay_opacity.unwrap_or(DEFAULT_OVERLAY_OPACITY).clamp(MIN_OVERLAY_OPACITY, 1.0);
    let subtitles = input.subtitles.take().unwrap_or_default();
    let overlays = input.overlay_markers.take().unwrap_or_default();

    if (!burn_subtitles || subtitles.is_empty()) && (!apply_overlay || overlays.is_empty()) {
        std::fs::copy(merged_input, final_output_path)
            .map_err(|e| format!("写入最终文件失败: {e}"))?;
        return Ok(());
    }

    let subtitle_filter = if burn_subtitles && !subtitles.is_empty() {
        let srt_path = temp_root.join("autocut_subtitles.srt");
        let srt = subtitles
            .iter()
            .enumerate()
            .map(|(index, subtitle)| {
                format!(
                    "{}\n{} --> {}\n{}\n\n",
                    index + 1,
                    format_srt_time(subtitle.start),
                    format_srt_time(subtitle.end),
                    subtitle.text.replace('\n', " ")
                )
            })
            .collect::<String>();
        std::fs::write(&srt_path, srt).map_err(|e| format!("写入字幕文件失败: {e}"))?;
        Some(format!("subtitles={}", escape_ffmpeg_path(&srt_path)))
    } else {
        None
    };

    if apply_overlay && !overlays.is_empty() {
        let base_chain = if let Some(sf) = &subtitle_filter {
            format!("[0:v]{}[base];", sf)
        } else {
            "[0:v]null[base];".to_string()
        };

        if overlay_mix_mode == "full" {
            let enable_expr = build_overlay_enable_expr(&overlays);
            let filter_complex = format!(
                "{}[1:v]format=rgba,colorchannelmixer=aa={:.3}[ov];[base][ov]overlay=0:0:enable='{}'[v]",
                base_chain, overlay_opacity, enable_expr
            );
            let output = Command::new(ffmpeg_binary())
                .arg("-y")
                .arg("-i")
                .arg(merged_input)
                .arg("-i")
                .arg(merged_input)
                .arg("-filter_complex")
                .arg(filter_complex)
                .arg("-map")
                .arg("[v]")
                .arg("-map")
                .arg("0:a?")
                .arg("-c:v")
                .arg(hw_accel().h264_encoder())
                .arg("-c:a")
                .arg("copy")
                .arg("-movflags")
                .arg("+faststart")
                .arg(final_output_path)
                .output()
                .map_err(|e| format!("原画全屏混合失败: {e}"))?;
            if output.status.success() {
                return Ok(());
            }
        } else {
            let overlay_inputs = overlays
                .iter()
                .enumerate()
                .map(|(idx, marker)| {
                    let layout = pick_overlay_layout_for_marker(marker, idx);
                    format!(
                        "[1:v]scale=iw*{:.3}:-1,format=rgba,colorchannelmixer=aa={:.3}[ov{}];",
                        layout.scale, overlay_opacity, idx
                    )
                })
                .collect::<String>();
            let mut chain = String::new();
            let mut prev = "base".to_string();
            for (idx, marker) in overlays.iter().enumerate() {
                let layout = pick_overlay_layout_for_marker(marker, idx);
                let end = marker.end.max(marker.start + 0.05);
                let out = format!("v{idx}");
                chain.push_str(&format!(
                    "[{}][ov{}]overlay=x={}:y={}:enable='between(t,{:.3},{:.3})'[{}];",
                    prev, idx, layout.x, layout.y, marker.start, end, out
                ));
                prev = out;
            }

            let filter_complex = format!(
                "{}{}[{}]format=yuva422p[v]",
                overlay_inputs, chain, prev
            );

            let output = Command::new(ffmpeg_binary())
                .arg("-y")
                .arg("-i")
                .arg(merged_input)
                .arg("-i")
                .arg(merged_input)
                .arg("-filter_complex")
                .arg(filter_complex)
                .arg("-map")
                .arg("[v]")
                .arg("-map")
                .arg("0:a?")
                .arg("-c:v")
                .arg(hw_accel().h264_encoder())
                .arg("-c:a")
                .arg("copy")
                .arg("-movflags")
                .arg("+faststart")
                .arg(final_output_path)
                .output()
                .map_err(|e| format!("PIP 混合失败: {e}"))?;
            if output.status.success() {
                return Ok(());
            }
        }
    }

    // Fallback: burn subtitles only
    if let Some(sf) = subtitle_filter {
        let output = Command::new(ffmpeg_binary())
            .arg("-y")
            .arg("-i")
            .arg(merged_input)
            .arg("-vf")
            .arg(sf)
            .arg("-c:a")
            .arg("copy")
            .arg("-movflags")
            .arg("+faststart")
            .arg(final_output_path)
            .output()
            .map_err(|e| format!("烧录字幕失败: {e}"))?;
        if output.status.success() {
            return Ok(());
        }
    }

    std::fs::copy(merged_input, final_output_path)
        .map_err(|e| format!("写入最终文件失败: {e}"))?;
    Ok(())
}

// ─── Merge Helpers ────────────────────────────────────────────────────────────

fn merge_by_concat(
    temp_root: &PathBuf,
    temp_files: &[PathBuf],
    output_path: &str,
) -> Result<(), String> {
    if temp_files.is_empty() {
        return Err("没有可合并的文件".to_string());
    }
    if temp_files.len() == 1 {
        std::fs::copy(&temp_files[0], output_path)
            .map_err(|e| format!("复制文件失败: {e}"))?;
        return Ok(());
    }

    // Use the safe write_concat_file helper which properly escapes paths
    let concat_file = write_concat_file(temp_files)?;

    let output = Command::new(ffmpeg_binary())
        .arg("-y")
        .arg("-f")
        .arg("concat")
        .arg("-safe")
        .arg("0")
        .arg("-i")
        .arg(&concat_file)
        .arg("-c")
        .arg("copy")
        .arg(output_path)
        .output()
        .map_err(|e| format!("执行 concat 失败: {e}"))?;
    let _ = std::fs::remove_file(&concat_file);
    if output.status.success() {
        Ok(())
    } else {
        Err(cmd_err("合并失败", &output))
    }
}

fn merge_with_transitions(
    temp_root: &PathBuf,
    temp_files: &[PathBuf],
    output_path: &str,
    transition: &str,
    transition_duration: f64,
) -> Result<(), String> {
    if temp_files.len() < 2 {
        return merge_by_concat(temp_root, temp_files, output_path);
    }

    let mut current = temp_files[0].clone();
    let transition_name = if transition == "dissolve" { "fade" } else { transition };

    for (index, next) in temp_files.iter().enumerate().skip(1) {
        let merged = temp_root.join(format!("xfade_{index}.mp4"));
        let current_duration = probe_duration(&current)?;
        let offset = (current_duration - transition_duration).max(MIN_CLIP_DURATION);

        let filter = format!(
            "[0:v][1:v]xfade=transition={}:duration={}:offset={}[v];[0:a][1:a]acrossfade=d={}[a]",
            transition_name, transition_duration, offset, transition_duration
        );

        let output = Command::new(ffmpeg_binary())
            .arg("-y")
            .arg("-i")
            .arg(&current)
            .arg("-i")
            .arg(next)
            .arg("-filter_complex")
            .arg(filter)
            .arg("-map")
            .arg("[v]")
            .arg("-map")
            .arg("[a]")
            .arg("-c:v")
            .arg(hw_accel().h264_encoder())
            .arg("-c:a")
            .arg("aac")
            .arg("-movflags")
            .arg("+faststart")
            .arg(&merged)
            .output()
            .map_err(|e| format!("执行 ffmpeg xfade 失败: {e}"))?;

        if !output.status.success() {
            return Err(cmd_err("xfade 失败", &output));
        }

        if current != temp_files[0] {
            let _ = std::fs::remove_file(&current);
        }
        current = merged;
    }

    std::fs::copy(&current, output_path).map_err(|e| format!("写入最终文件失败: {e}"))?;

    // Clean up: final merged result + all intermediate xfade files
    let _ = std::fs::remove_file(&current);
    if let Ok(entries) = std::fs::read_dir(temp_root) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if name_str.starts_with("xfade_") && name_str.ends_with(".mp4") {
                let _ = std::fs::remove_file(entry.path());
            }
        }
    }
    Ok(())
}

fn probe_duration(path: &PathBuf) -> Result<f64, String> {
    let output = Command::new(ffprobe_binary())
        .arg("-v")
        .arg("error")
        .arg("-show_entries")
        .arg("format=duration")
        .arg("-of")
        .arg("default=noprint_wrappers=1:nokey=1")
        .arg(path)
        .output()
        .map_err(|e| format!("执行 ffprobe 失败: {e}"))?;
    if !output.status.success() {
        return Err(cmd_err("probe 失败", &output));
    }
    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    text.parse::<f64>()
        .map_err(|e| format!("解析时长失败: {e}"))
}

fn escape_ffmpeg_path(path: &PathBuf) -> String {
    path.to_string_lossy()
        .replace('\\', "\\\\")
        .replace(':', "\\:")
        .replace('\'', "\\'")
}

fn build_overlay_enable_expr(overlays: &[AutonomousOverlayMarker]) -> String {
    overlays
        .iter()
        .map(|marker| {
            let extra = if marker.label == "anchor" { 0.12 } else { 0.0 };
            let end = marker.end.max(marker.start + 0.05);
            format!("between(t,{:.3},{:.3})", marker.start, end + extra)
        })
        .collect::<Vec<_>>()
        .join("+")
}

struct OverlayLayout {
    x: &'static str,
    y: &'static str,
    scale: f64,
}

fn pick_overlay_layout_for_marker(
    marker: &AutonomousOverlayMarker,
    index: usize,
) -> OverlayLayout {
    match marker.label.as_str() {
        "corner-tr" => OverlayLayout { x: "W-w-16", y: "16", scale: 0.20 },
        "corner-tl" => OverlayLayout { x: "16", y: "16", scale: 0.20 },
        "corner-br" => OverlayLayout { x: "W-w-16", y: "H-h-16", scale: 0.20 },
        "anchor" => {
            const ANCHOR_Y: [&str; 5] = ["H*0.7", "H*0.5", "H*0.3", "H*0.65", "H*0.35"];
            OverlayLayout { x: "W*0.82", y: ANCHOR_Y[index % 5], scale: 0.26 }
        }
        _ => {
            const DEFAULT_X: [&str; 4] = ["W*0.05", "W*0.78", "W*0.05", "W*0.78"];
            OverlayLayout { x: DEFAULT_X[index % 4], y: "H*0.72", scale: 0.22 }
        }
    }
}