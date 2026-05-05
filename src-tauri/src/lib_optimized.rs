// Video processor module — hardware-accelerated video processing.
// All commands create a fresh VideoProcessor instance per call to avoid
// shared-state issues in a single-threaded Tauri handler environment.

use crate::binary::{ffmpeg_binary, ffprobe_binary};
use crate::utils::{cmd_err, cmd_first_line, chrono_like_timestamp, parse_fraction, format_time};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

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
            .join(format!("cutdeck_frames_{}_{}", std::process::id(), chrono_like_timestamp()));

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

        // Create concat file — use random suffix to avoid same-ms collisions
        let concat_file = std::env::temp_dir()
            .join(format!("concat_{}.txt", chrono_like_timestamp()));

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
            return Err(cmd_err("合并失败", &result));
        }

        Ok(())
    }

    pub fn generate_thumbnail(&self, path: &str, time: f64) -> Result<String, String> {
        let temp_dir = std::env::temp_dir()
            .join(format!("cutdeck_thumb_{}_{}", std::process::id(), chrono_like_timestamp()));

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
        // temp_dir is deleted, so we must extract the file first
        let thumb_data = fs::read(&output)
            .map_err(|e| {
                let _ = fs::remove_dir_all(&temp_dir);
                format!("读取缩略图失败: {}", e)
            })?;

        let final_path = std::env::temp_dir()
            .join(format!("cutdeck_thumb_{}.jpg", chrono_like_timestamp()));
        fs::write(&final_path, &thumb_data)
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
pub fn cut_video(
    input_path: String,
    output_path: String,
    segments: Vec<CutSegment>,
    use_hw_accel: Option<bool>,
) -> Result<String, String> {
    let processor = VideoProcessor::new();
    let temp_dir = std::env::temp_dir()
        .join(format!("cutdeck_cut_{}", chrono_like_timestamp()));

    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("创建临时目录失败: {}", e))?;

    // Process each segment
    let mut temp_files: Vec<PathBuf> = Vec::new();

    let result = (|| {
        for (i, seg) in segments.iter().enumerate() {
            let temp_file = temp_dir.join(format!("seg_{:03}.mp4", i));
            processor.cut_video_segment(&input_path, &temp_file.to_string_lossy(), seg.start, seg.end, use_hw_accel)?;
            temp_files.push(temp_file);
        }

        // Merge
        processor.concat_segments(&temp_files, &output_path)?;
        Ok::<(), String>(())
    })();

    // Cleanup temp files regardless of success/failure
    for f in &temp_files {
        let _ = fs::remove_file(f);
    }
    let _ = fs::remove_dir_all(&temp_dir);

    result?;
    Ok(output_path)
}

#[tauri::command]
pub fn get_hw_acceleration() -> Result<Option<String>, String> {
    let processor = VideoProcessor::new();
    Ok(processor.detect_hw_accel())
}
