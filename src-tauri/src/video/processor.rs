// Video processor core — delegates to submodules
// Submodules: metadata, keyframes, thumbnail, ffmpeg_cmd, mix_audio, audio_duration

use crate::binary::{ffmpeg_binary, ffprobe_binary, hw_accel, HwAccel};
use crate::utils::{cmd_err, cmd_first_line, format_time, write_concat_file};
use crate::video::{extract_keyframes_impl, generate_thumbnail_impl, probe_metadata};
use std::path::PathBuf;
use std::process::Command;

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
        probe_metadata(path, &self.ffprobe_path)
    }

    pub fn extract_keyframes(&self, path: &str, max_frames: u32, scene_threshold: f64) -> Result<Vec<String>, String> {
        extract_keyframes_impl(path, max_frames, scene_threshold, &self.ffmpeg_path)
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
            "-y", "-ss", &start_time, "-t", &duration_time, "-i", input,
        ];

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

    pub async fn concat_segments(&self, inputs: &[PathBuf], output: &str) -> Result<(), String> {
        if inputs.is_empty() {
            return Err("没有输入片段".to_string());
        }

        if inputs.len() == 1 {
            tokio::fs::copy(&inputs[0], output).await.map_err(|e| format!("复制失败: {}", e))?;
            return Ok(());
        }

        let concat_file = write_concat_file(inputs)?;

        let result = tokio::process::Command::new(&self.ffmpeg_path)
            .args(&[
                "-y", "-f", "concat", "-safe", "0",
                "-i", &concat_file.to_string_lossy(),
                "-c", "copy",
                output,
            ])
            .output()
            .await
            .map_err(|e| format!("合并失败: {}", e))?;

        let _ = tokio::fs::remove_file(&concat_file).await;

        if !result.status.success() {
            return Err(cmd_err("合并失败", &result));
        }
        Ok(())
    }

    pub fn generate_thumbnail(&self, path: &str, time: f64) -> Result<String, String> {
        generate_thumbnail_impl(path, time, &self.ffmpeg_path)
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
