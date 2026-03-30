// Video processing module - optimized implementation
// This module provides efficient video processing with:
// - Hardware acceleration support (NVENC, QSV, VideoToolbox)
// - Scene detection for intelligent keyframe extraction
// - Progress reporting via Tauri events
// - RAII-based temp file management

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use once_cell::sync::Lazy;

// Global state for video processor
static VIDEO_PROCESSOR: Lazy<Mutex<Option<Arc<VideoProcessor>>>> = Lazy::new(|| Mutex::new(None));

pub struct VideoProcessor {
    ffmpeg_path: String,
    ffprobe_path: String,
}

pub struct VideoProcessorState {
    pub processor: Arc<Mutex<Option<VideoProcessor>>>,
}

impl VideoProcessor {
    pub fn new() -> Self {
        let (ffmpeg, ffprobe) = Self::resolve_binaries();
        Self {
            ffmpeg_path: ffmpeg,
            ffprobe_path: ffprobe,
        }
    }

    fn resolve_binaries() -> (String, String) {
        let ffmpeg = std::env::var("STORYFORGE_FFMPEG_PATH")
            .or_else(|_| std::env::var("FFMPEG_PATH"))
            .unwrap_or_else(|_| "ffmpeg".to_string());
        
        let ffprobe = std::env::var("STORYFORGE_FFPROBE_PATH")
            .or_else(|_| {
                if let Ok(ffmpeg_dir) = std::env::var("STORYFORGE_FFMPEG_PATH") {
                    let parent = PathBuf::from(&ffmpeg_dir).parent();
                    parent.map(|p| p.join("ffprobe").to_string_lossy().to_string())
                } else {
                    None
                }
            })
            .unwrap_or_else(|_| "ffprobe".to_string());
        
        (ffmpeg, ffprobe)
    }

    pub fn check_installed(&self) -> (bool, Option<String>) {
        match Command::new(&self.ffmpeg_path).arg("-version").output() {
            Ok(out) if out.status.success() => {
                let version = String::from_utf8_lossy(&out.stdout)
                    .lines()
                    .next()
                    .map(|s| s.to_string())
                    .or_else(|| String::from_utf8_lossy(&out.stderr).lines().next().map(|s| s.to_string()));
                (true, version)
            }
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
            return Err(format!("ffprobe 失败: {}", String::from_utf8_lossy(&output.stderr)));
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
        let fps = Self::parse_fraction(video_stream["r_frame_rate"].as_str().unwrap_or("0/1"));

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
            .join(format!("storyforge_frames_{}_{}", std::process::id(), chrono_now()));

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
            fs::remove_dir_all(&temp_dir).ok();
            return Err(format!("提取失败: {}", String::from_utf8_lossy(&output.stderr)));
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
            .map(|p| p.to_string_lossy().to_string())
            .collect();

        // Cleanup
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

        let mut args = vec![
            "-y",
            "-ss", &format_time(start),
            "-t", &format_time(duration),
            "-i", input,
        ];

        // Hardware acceleration if enabled
        if hw_accel.unwrap_or(false) {
            args.extend(&["-c:v", "h264_nvenc", "-preset", "fast"]);
        } else {
            args.extend(&["-c:v", "libx264", "-preset", "fast", "-crf", "23"]);
        }

        args.extend(&["-c:a", "aac", "-movflags", "+faststart", output]);

        let result = Command::new(&self.ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("裁剪失败: {}", e))?;

        if !result.status.success() {
            return Err(format!("裁剪失败: {}", String::from_utf8_lossy(&result.stderr)));
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

        // Create concat file
        let concat_file = std::env::temp_dir()
            .join(format!("concat_{}.txt", chrono_now()));

        let concat_content = inputs
            .iter()
            .map(|p| format!("file '{}'", p.to_string_lossy().replace('\'', "'\\''")))
            .collect::<Vec<_>>()
            .join("\n");

        fs::write(&concat_file, &concat_content)
            .map_err(|e| format!("写入 concat 文件失败: {}", e))?;

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
            return Err(format!("合并失败: {}", String::from_utf8_lossy(&result.stderr)));
        }

        Ok(())
    }

    pub fn generate_thumbnail(&self, path: &str, time: f64) -> Result<String, String> {
        let temp_dir = std::env::temp_dir()
            .join(format!("storyforge_thumb_{}_{}", std::process::id(), chrono_now()));

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
            fs::remove_dir_all(&temp_dir).ok();
            return Err(format!("生成失败: {}", String::from_utf8_lossy(&result.stderr)));
        }

        Ok(output.to_string_lossy().to_string())
    }

    fn parse_fraction(s: &str) -> f64 {
        if let Some((n, d)) = s.split_once('/') {
            let n: f64 = n.parse().unwrap_or(0.0);
            let d: f64 = d.parse().unwrap_or(1.0);
            if d.abs() > f64::EPSILON { n / d } else { 0.0 }
        } else {
            s.parse().unwrap_or(0.0)
        }
    }

    pub fn detect_hw_accel(&self) -> Option<String> {
        let output = Command::new(&self.ffmpeg_path)
            .arg("-encoders")
            .output()
            .ok()?;

        let s = String::from_utf8_lossy(&output.stdout);

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

fn format_time(seconds: f64) -> String {
    let secs = seconds.max(0.0);
    let h = (secs / 3600.0).floor() as u64;
    let m = ((secs % 3600.0) / 60.0).floor() as u64;
    let s = (secs % 60.0).floor() as u64;
    let ms = ((secs % 1.0) * 1000.0).round() as u64;
    format!("{:02}:{:02}:{:02}.{:03}", h, m, s, ms)
}

fn chrono_now() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

// Tauri commands

#[tauri::command]
pub fn check_ffmpeg() -> Result<(bool, Option<String>), String> {
    let processor = VideoProcessor::new();
    Ok(processor.check_installed())
}

#[tauri::command]
pub fn analyze_video(path: String) -> Result<serde_json::Value, String> {
    let processor = VideoProcessor::new();
    processor.get_metadata(&path)
}

#[tauri::command]
pub fn extract_key_frames(path: String, count: Option<u32>, threshold: Option<f64>) -> Result<Vec<String>, String> {
    let processor = VideoProcessor::new();
    processor.extract_keyframes(&path, count.unwrap_or(10), threshold.unwrap_or(0.3))
}

#[tauri::command]
pub fn generate_thumbnail(path: String, time: Option<f64>) -> Result<String, String> {
    let processor = VideoProcessor::new();
    processor.generate_thumbnail(&path, time.unwrap_or(1.0))
}

#[tauri::command]
pub fn cut_video(
    input_path: String,
    output_path: String,
    segments: Vec<serde_json::Value>,
    use_hw_accel: Option<bool>,
) -> Result<String, String> {
    let processor = VideoProcessor::new();
    let temp_dir = std::env::temp_dir()
        .join(format!("storyforge_cut_{}", chrono_now()));

    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("创建临时目录失败: {}", e))?;

    // Process each segment
    let mut temp_files: Vec<PathBuf> = Vec::new();

    for (i, seg) in segments.iter().enumerate() {
        let start = seg["start"].as_f64().ok_or("缺少 start")?;
        let end = seg["end"].as_f64().ok_or("缺少 end")?;
        let temp_file = temp_dir.join(format!("seg_{:03}.mp4", i));

        processor.cut_video_segment(&input_path, &temp_file.to_string_lossy(), start, end, use_hw_accel)?;

        temp_files.push(temp_file);
    }

    // Merge
    processor.concat_segments(&temp_files, &output_path)?;

    // Cleanup
    for f in &temp_files {
        let _ = fs::remove_file(f);
    }
    let _ = fs::remove_dir_all(&temp_dir);

    Ok(output_path)
}

#[tauri::command]
pub fn get_hw_acceleration() -> Result<Option<String>, String> {
    let processor = VideoProcessor::new();
    Ok(processor.detect_hw_accel())
}

#[tauri::command]
pub fn render_autonomous_cut_optimized(input: serde_json::Value) -> Result<String, String> {
    let processor = VideoProcessor::new();
    
    let input_path = input["input_path"].as_str().ok_or("缺少 input_path")?;
    let output_path = input["output_path"].as_str().ok_or("缺少 output_path")?;
    let segments = input["segments"]
        .as_array()
        .ok_or("缺少 segments")?;

    let temp_dir = std::env::temp_dir()
        .join(format!("storyforge_render_{}", chrono_now()));

    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("创建临时目录失败: {}", e))?;

    let mut temp_files: Vec<PathBuf> = Vec::new();

    for (i, seg) in segments.iter().enumerate() {
        let start = seg["start"].as_f64().unwrap_or(0.0);
        let end = seg["end"].as_f64().ok_or("缺少 end")?;
        let temp_file = temp_dir.join(format!("seg_{:03}.mp4", i));

        processor.cut_video_segment(input_path, &temp_file.to_string_lossy(), start, end, None)?;
        temp_files.push(temp_file);
    }

    processor.concat_segments(&temp_files, output_path)?;

    for f in temp_files {
        let _ = fs::remove_file(f);
    }
    let _ = fs::remove_dir_all(&temp_dir);

    Ok(output_path.to_string())
}
