// Video processor module — hardware-accelerated video processing.
// All commands create a fresh VideoProcessor instance per call to avoid
// shared-state issues in a single-threaded Tauri handler environment.

use crate::binary::{ffmpeg_binary, ffprobe_binary, hw_accel, HwAccel};
use crate::utils::{cmd_err, cmd_first_line, chrono_like_timestamp, parse_fraction, format_time, write_concat_file};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tokio::process::Command as TokioCommand;
use tokio::fs as tokio_fs;
use futures_util::future::join_all;

/// Typed segment for cut_video command — replaces raw serde_json::Value.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CutSegment {
    pub start: f64,
    pub end: f64,
    #[serde(default)]
    pub source_start_ms: Option<f64>,
    #[serde(default)]
    pub source_end_ms: Option<f64>,
}

pub struct VideoProcessor {
    ffmpeg_path: String,
    ffprobe_path: String,
}

impl VideoProcessor {
    pub fn new() -> Self {
        Self {
            ffmpeg_path: ffmpeg_binary(),
            ffprobe_path: ffprobe_binary(),
        }
    }

    pub fn check_installed(&self) -> (bool, Option<String>) {
        match Command::new(&self.ffmpeg_path).arg("-version").output() {
            Ok(out) if out.status.success() => (true, cmd_first_line(&out)),
            _ => (false, None),
        }
    }

    pub fn get_metadata(&self, path: &str) -> Result<serde_json::Value, String> {
        let output = Command::new(&self.ffprobe_path)
            .args(&[
                "-v", "error",
                "-show_format", "-show_streams",
                "-of", "json",
                path
            ])
            .output()
            .map_err(|e| format!("运行 ffprobe 失败: {}", e))?;

        if !output.status.success() {
            return Err(cmd_err("ffprobe 失败", &output));
        }

        let data: serde_json::Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("解析 JSON 失败: {}", e))?;

        // Extract video stream
        let video_stream = data["streams"]
            .as_array()
            .and_then(|arr| arr.iter().find(|s| s["codec_type"] == "video"))
            .ok_or("未找到视频流")?;

        let width = video_stream["width"].as_u64().unwrap_or(0) as u32;
        let height = video_stream["height"].as_u64().unwrap_or(0) as u32;
        let codec = video_stream["codec_name"].as_str().unwrap_or("unknown").to_string();
        let fps = parse_fraction(video_stream["r_frame_rate"].as_str().unwrap_or("0/1"));

        // Audio info
        let audio_stream = data["streams"]
            .as_array()
            .and_then(|arr| arr.iter().find(|s| s["codec_type"] == "audio"));

        // Format info
        let duration = data["format"]["duration"]
            .as_str()
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0);

        let bitrate = data["format"]["bit_rate"]
            .as_str()
            .and_then(|s| s.parse::<u64>().ok())
            .or(video_stream["bit_rate"].as_str().and_then(|s| s.parse::<u64>().ok()))
            .unwrap_or(0);

        let file_size = data["format"]["size"]
            .as_str()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);

        Ok(serde_json::json!({
            "duration": duration,
            "width": width,
            "height": height,
            "fps": fps,
            "codec": codec,
            "bitrate": bitrate,
            "fileSize": file_size,
            "audioChannels": audio_stream.and_then(|s| s["channels"].as_u64()).map(|v| v as u32),
            "audioSampleRate": audio_stream.and_then(|s| s["sample_rate"].as_str()).and_then(|s| s.parse::<u32>().ok()),
        }))
    }

    pub fn extract_keyframes(&self, path: &str, max_frames: u32, scene_threshold: f64) -> Result<Vec<String>, String> {
        let temp_dir = std::env::temp_dir()
            .join(format!("story-fab_frames_{}_{}", std::process::id(), chrono_like_timestamp()));

        fs::create_dir_all(&temp_dir)
            .map_err(|e| format!("创建临时目录失败: {}", e))?;

        // Use scene detection for intelligent extraction
        let pattern = temp_dir.join("frame_%04d.jpg");

        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-y",
                "-i", path,
                "-vf", &format!(
                    "select='gt(scene\\,{:.2})',scale=iw:-1,qscale=v(2)",
                    scene_threshold
                ),
                "-frames:v", &max_frames.to_string(),
                "-vsync", "vfr",
                &pattern.to_string_lossy()
            ])
            .output()
            .map_err(|e| format!("提取关键帧失败: {}", e))?;

        if !output.status.success() {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(cmd_err("提取失败", &output));
        }

        // Collect frames
        let mut frames: Vec<_> = fs::read_dir(&temp_dir)
            .ok()
            .map(|d| d.filter_map(|e| e.ok()).filter_map(|e| {
                let p = e.path();
                if p.extension().and_then(|e| e.to_str()) == Some("jpg") {
                    Some(p)
                } else {
                    None
                }
            }).collect())
            .unwrap_or_default();

        frames.sort();

        let result: Vec<String> = frames
            .into_iter()
            .take(max_frames as usize)
            .map(|p| p.display().to_string())
            .collect();

        // Cleanup — caller gets frame paths but they're in temp_dir, so clean now
        let _ = fs::remove_dir_all(&temp_dir);

        Ok(result)
    }

    pub fn cut_video_segment(
        &self,
        input: &str,
        output: &str,
        start: f64,
        end: f64,
        hw_accel: Option<bool>,
    ) -> Result<(), String> {
        let duration = (end - start).max(0.1);
        let start_time = format_time(start);
        let duration_time = format_time(duration);

        let mut args = vec![
            "-y",
            "-ss", &start_time,
            "-t", &duration_time,
            "-i", input,
        ];

        // Hardware acceleration — auto-detect unless explicitly overridden
        let enc = match hw_accel {
            Some(true) => crate::binary::hw_accel().h264_encoder(),
            Some(false) => "libx264",
            None => {
                let detected = crate::binary::hw_accel();
                if detected == HwAccel::Cpu { "libx264" } else { detected.h264_encoder() }
            }
        };
        args.extend(&["-c:v", enc, "-preset", "fast"]);

        args.extend(&["-c:a", "aac", "-movflags", "+faststart", output]);

        let result = Command::new(&self.ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("裁剪失败: {}", e))?;

        if !result.status.success() {
            return Err(cmd_err("裁剪失败", &result));
        }

        Ok(())
    }

    pub fn concat_segments(&self, inputs: &[PathBuf], output: &str) -> Result<(), String> {
        if inputs.is_empty() {
            return Err("没有输入片段".to_string());
        }

        if inputs.len() == 1 {
            fs::copy(&inputs[0], output).map_err(|e| format!("复制失败: {}", e))?;
            return Ok(());
        }

        let concat_file = write_concat_file(inputs)?;

        let result = Command::new(&self.ffmpeg_path)
            .args(&[
                "-y",
                "-f", "concat", "-safe", "0",
                "-i", &concat_file.to_string_lossy(),
                "-c", "copy",
                output
            ])
            .output()
            .map_err(|e| format!("合并失败: {}", e))?;

        let _ = fs::remove_file(&concat_file);

        if !result.status.success() {
            return Err(cmd_err("合并失败", &result));
        }

        Ok(())
    }

    pub fn generate_thumbnail(&self, path: &str, time: f64) -> Result<String, String> {
        let temp_dir = std::env::temp_dir()
            .join(format!("story-fab_thumb_{}_{}", std::process::id(), chrono_like_timestamp()));

        fs::create_dir_all(&temp_dir)
            .map_err(|e| format!("创建临时目录失败: {}", e))?;

        let output = temp_dir.join("thumb.jpg");

        let result = Command::new(&self.ffmpeg_path)
            .args(&[
                "-y",
                "-ss", &format_time(time.max(0.0)),
                "-i", path,
                "-frames:v", "1",
                "-q:v", "2",
                "-vf", "scale=320:-1",
                &output.to_string_lossy()
            ])
            .output()
            .map_err(|e| format!("生成缩略图失败: {}", e))?;

        if !result.status.success() {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(cmd_err("生成失败", &result));
        }

        // Move thumb.jpg out of temp_dir before cleanup
        // Use fs::copy for efficiency instead of read+write
        let final_path = std::env::temp_dir()
            .join(format!("story-fab_thumb_{}.jpg", chrono_like_timestamp()));
        fs::copy(&output, &final_path)
            .map_err(|e| {
                let _ = fs::remove_dir_all(&temp_dir);
                format!("保存缩略图失败: {}", e)
            })?;

        let _ = fs::remove_dir_all(&temp_dir);
        Ok(final_path.display().to_string())
    }

    pub fn detect_hw_accel(&self) -> Option<String> {
        let output = Command::new(&self.ffmpeg_path)
            .arg("-encoders")
            .output()
            .ok()?;

        let s = &String::from_utf8_lossy(&output.stdout);
        if s.contains("h264_nvenc") {
            Some("nvenc".to_string())
        } else if s.contains("h264_qsv") {
            Some("qsv".to_string())
        } else if s.contains("h264_videotoolbox") {
            Some("videotoolbox".to_string())
        } else {
            None
        }
    }
}

impl Default for VideoProcessor {
    fn default() -> Self {
        Self::new()
    }
}

// Tauri commands

#[tauri::command]
pub async fn cut_video(
    input_path: String,
    output_path: String,
    segments: Vec<CutSegment>,
    use_hw_accel: Option<bool>,
) -> Result<String, String> {
    let temp_dir = std::env::temp_dir()
        .join(format!("story-fab_cut_{}", chrono_like_timestamp()));

    tokio_fs::create_dir_all(&temp_dir)
        .await
        .map_err(|e| format!("创建临时目录失败: {}", e))?;

    // ── Parallel segment cutting ───────────────────────────────────────────────
    let ffmpeg_bin = ffmpeg_binary();
    let use_hw = use_hw_accel.unwrap_or(false);

    let tasks: Vec<_> = segments
        .iter()
        .enumerate()
        .map(|(i, seg)| {
            let ffmpeg_bin = ffmpeg_bin.clone();
            let input_path = input_path.clone();
            let temp_dir = temp_dir.clone();
            async move {
                let temp_file = temp_dir.join(format!("seg_{:03}.mp4", i));
                let duration = (seg.end - seg.start).max(0.1);
                let start_time = format_time(seg.start);
                let duration_str = format_time(duration);

                let mut args = vec![
                    "-y",
                    "-ss",
                    &start_time,
                    "-t",
                    &duration_str,
                    "-i",
                    &input_path,
                ];

                // Hardware acceleration — auto-detect unless explicitly overridden
                let enc = match use_hw {
                    true => crate::binary::hw_accel().h264_encoder(),
                    false => "libx264",
                };
                args.extend(&["-c:v", enc, "-preset", "fast"]);

                args.extend(&["-c:a", "aac", "-movflags", "+faststart"]);
                let temp_file_str = temp_file.to_string_lossy();
                args.push(temp_file_str.as_ref());

                let result = TokioCommand::new(&ffmpeg_bin)
                    .args(&args)
                    .output()
                    .await
                    .map_err(|e| format!("裁剪失败: {}", e))?;

                if !result.status.success() {
                    return Err(cmd_err("裁剪失败", &result));
                }
                Ok::<PathBuf, String>(temp_file)
            }
        })
        .collect();

    let results = join_all(tasks).await;
    let mut temp_files: Vec<PathBuf> = Vec::new();
    for result in results {
        temp_files.push(result?);
    }

    // ── Merge ────────────────────────────────────────────────────────────────
    let processor = VideoProcessor::new();
    processor.concat_segments(&temp_files, &output_path)
        .map_err(|e| format!("合并失败: {}", e))?;

    // Cleanup temp files
    for f in temp_files {
        let _ = tokio_fs::remove_file(&f).await;
    }
    let _ = tokio_fs::remove_dir_all(&temp_dir).await;

    Ok(output_path)
}

// ─────────────────────────────────────────────────────────────────────────────
// mix_audio — 混音 TTS 配音 + 原视频音轨
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MixAudioInput {
    pub video_path: String,
    pub tts_audio_path: String,
    pub output_path: String,
    /// TTS 配音音量（0.0–1.0）
    #[serde(default = "default_one")]
    pub tts_volume: f32,
    /// 原视频背景音量（0.0–1.0）
    #[serde(default = "default_three_tenths")]
    pub background_volume: f32,
    /// TTS 音频在视频中的起始偏移（秒）
    #[serde(default)]
    pub offset_seconds: f64,
}

fn default_one() -> f32 { 1.0 }
fn default_three_tenths() -> f32 { 0.3 }

#[tauri::command]
pub async fn mix_audio(input: MixAudioInput) -> Result<String, String> {
    let ffmpeg_bin = crate::binary::ffmpeg_binary();

    // 检查原视频是否有音轨
    let has_audio_track = check_video_has_audio(&ffmpeg_bin, &input.video_path)
        .await
        .unwrap_or(false);

    let mut cmd = TokioCommand::new(&ffmpeg_bin);

    if has_audio_track {
        // 策略：原视频音轨 volume 降低作为背景，TTS 配音覆盖其上
        // filter_complex:
        //   [0:a]volume=bg_vol[bg]; [1:a]volume=tts_vol[tts]; [bg][tts]amix=inputs=2:duration=first[mixed]
        let bg_vol = input.background_volume;
        let tts_vol = input.tts_volume;
        let offset = input.offset_seconds;

        cmd.arg("-i").arg(&input.video_path);
        cmd.arg("-i").arg(&input.tts_audio_path);

        if offset > 0.0 {
            // 用 adelay 延迟 TTS 音频
            let delay_ms = (offset * 1000.0) as i64;
            cmd.args(&["-filter_complex",
                &format!(
                    "[0:a]volume={bg}[bg];[1:a]volume={tts},adelay={delay}|{delay}[tts];[bg][tts]amix=inputs=2:duration=first[mixed]",
                    bg = bg_vol, tts = tts_vol, delay = delay_ms
                ),
                "-map", "0:v",
                "-map", "[mixed]",
            ]);
        } else {
            cmd.args(&["-filter_complex",
                &format!(
                    "[0:a]volume={bg}[bg];[1:a]volume={tts}[tts];[bg][tts]amix=inputs=2:duration=first[mixed]",
                    bg = bg_vol, tts = tts_vol
                ),
                "-map", "0:v",
                "-map", "[mixed]",
            ]);
        }
    } else {
        // 无原音轨：直接用 TTS 音频替换视频的静音轨
        cmd.arg("-i").arg(&input.video_path);
        cmd.arg("-i").arg(&input.tts_audio_path);
        cmd.args(&["-map", "0:v", "-map", "1:a", "-c:v", "copy"]);
    }

    // 编码参数
    cmd.args(&["-c:a", "aac", "-movflags", "+faststart", "-y"]);

    if !has_audio_track {
        // 已有 c:v copy，只需要指定输出
    }

    cmd.arg(&input.output_path);

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("混音命令执行失败: {e}"))?;

    if !output.status.success() {
        return Err(cmd_err("mix_audio failed", &output));
    }

    Ok(input.output_path)
}

/// 检查视频是否包含音轨
async fn check_video_has_audio(ffmpeg_bin: &str, video_path: &str) -> Result<bool, String> {
    let output = TokioCommand::new(ffmpeg_bin)
        .args(&["-i", video_path, "-t", "0", "-f", "null", "-"])
        .output()
        .await
        .map_err(|e| format!("ffprobe check failed: {e}"))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    // FFmpeg 在无音轨时会输出 "Stream #0:X: Audio: none"
    Ok(!stderr.contains("Audio: none"))
}

// ─────────────────────────────────────────────────────────────────────────────
// get_audio_duration — 获取音频/视频文件的时长
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_audio_duration(audio_path: String) -> Result<f64, String> {
    let ffprobe_bin = crate::binary::ffprobe_binary();

    let output = TokioCommand::new(&ffprobe_bin)
        .args(&[
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            &audio_path,
        ])
        .output()
        .await
        .map_err(|e| format!("ffprobe failed: {e}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let duration_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    duration_str.parse::<f64>()
        .map_err(|e| format!("failed to parse duration '{duration_str}': {e}"))
}

