use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::{AppHandle, Emitter, Manager};

// ============== Types ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoMetadata {
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub codec: String,
    pub bitrate: u64,
    pub file_size: u64,
    pub audio_channels: Option<u32>,
    pub audio_sample_rate: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoSegment {
    pub start: f64,
    pub end: f64,
    pub duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscodeOptions {
    pub codec: Option<String>,        // "libx264", "libx265", "h264_nvenc", etc.
    pub quality: Option<String>,      // "low", "medium", "high", "lossless"
    pub speed: Option<String>,        // "ultrafast", "fast", "medium", "slow"
    pub bitrate: Option<String>,      // e.g., "5M", "10M"
    pub crf: Option<u32>,            // 0-51, lower = better quality
    pub audio_codec: Option<String>,  // "aac", "libopus", "mp3"
    pub audio_bitrate: Option<String>, // e.g., "128k", "256k"
    pub format: Option<String>,       // "mp4", "mkv", "webm"
    pub hw_accel: Option<String>,    // "auto", "nvenc", "qsv", "videotoolbox", "none"
}

impl Default for TranscodeOptions {
    fn default() -> Self {
        Self {
            codec: Some("libx264".to_string()),
            quality: Some("high".to_string()),
            speed: Some("fast".to_string()),
            bitrate: None,
            crf: Some(23),
            audio_codec: Some("aac".to_string()),
            audio_bitrate: Some("192k".to_string()),
            format: Some("mp4".to_string()),
            hw_accel: Some("auto".to_string()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CutOptions {
    pub segments: Vec<VideoSegment>,
    pub transition: Option<String>,
    pub transition_duration: Option<f64>,
    pub output_path: String,
    pub transcode: Option<TranscodeOptions>,
    pub include_audio: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyFrameExtractOptions {
    pub max_frames: Option<u32>,
    pub interval: Option<f64>,        // seconds between frames (alternative to max_frames)
    pub scene_detection: Option<bool>, // use scene detection instead of fixed interval
    pub scene_threshold: Option<f64>,  // scene change threshold (default 0.3)
    pub quality: Option<u32>,          // JPEG quality 2-31 (lower = better)
}

impl Default for KeyFrameExtractOptions {
    fn default() -> Self {
        Self {
            max_frames: Some(10),
            interval: None,
            scene_detection: Some(true),
            scene_threshold: Some(0.3),
            quality: Some(2),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessingProgress {
    pub stage: String,
    pub progress: f64,        // 0.0 - 1.0
    pub current_item: Option<String>,
    pub items_total: Option<u32>,
    pub items_completed: Option<u32>,
    pub time_remaining_secs: Option<u64>,
}

// ============== FFmpeg Resolver ==============

#[derive(Clone)]
pub struct FFmpegResolver {
    custom_paths: HashMap<String, String>,
}

impl FFmpegResolver {
    pub fn new() -> Self {
        Self {
            custom_paths: HashMap::new(),
        }
    }

    pub fn set_path(&mut self, binary: &str, path: &str) {
        self.custom_paths.insert(binary.to_string(), path.to_string());
    }

    fn resolve(&self, binary: &str) -> String {
        // Check custom paths first
        if let Some(path) = self.custom_paths.get(binary) {
            if PathBuf::from(path).exists() {
                return path.clone();
            }
        }

        // Check environment variables
        let env_key = format!("STORYFORGE_{}_PATH", binary.to_uppercase());
        if let Ok(path) = std::env::var(&env_key) {
            if !path.trim().is_empty() && PathBuf::from(&path).exists() {
                return path;
            }
        }

        // For ffprobe, check if it's alongside ffmpeg
        if binary == "ffprobe" {
            if let Ok(ffmpeg_path) = std::env::var("STORYFORGE_FFMPEG_PATH") {
                let ffmpeg = PathBuf::from(&ffmpeg_path);
                if let Some(parent) = ffmpeg.parent() {
                    let probe = parent.join("ffprobe");
                    if probe.exists() {
                        return probe.to_string_lossy().to_string();
                    }
                }
            }
        }

        // Common system paths
        let common_dirs = [
            "/opt/homebrew/bin",
            "/usr/local/bin",
            "/usr/bin",
            "/bin",
            "/snap/bin",
        ];

        for dir in &common_dirs {
            let candidate = PathBuf::from(dir).join(binary);
            if candidate.exists() {
                return candidate.to_string_lossy().to_string();
            }
        }

        binary.to_string()
    }

    pub fn ffmpeg(&self) -> String {
        self.resolve("ffmpeg")
    }

    pub fn ffprobe(&self) -> String {
        self.resolve("ffprobe")
    }
}

impl Default for FFmpegResolver {
    fn default() -> Self {
        Self::new()
    }
}

// ============== Hardware Acceleration ==============

#[derive(Debug, Clone)]
pub struct HWAccelConfig {
    pub encoder: String,
    pub decoder: Option<String>,
    pub pix_fmt: Option<String>,
}

pub fn detect_hw_accel(ffmpeg: &str) -> Option<HWAccelConfig> {
    // Try NVIDIA NVENC
    let output = Command::new(ffmpeg)
        .arg("-hide_banner")
        .arg("-encoders")
        .arg("2>/dev/null")
        .output();

    if let Ok(out) = output {
        let stderr = String::from_utf8_lossy(&out.stderr);
        let stdout = String::from_utf8_lossy(&out.stdout);
        let combined = format!("{}{}", stdout, stderr);

        if combined.contains("h264_nvenc") {
            return Some(HWAccelConfig {
                encoder: "h264_nvenc".to_string(),
                decoder: Some("h264_cuvid".to_string()),
                pix_fmt: Some("cuda".to_string()),
            });
        }
        if combined.contains("hevc_nvenc") {
            return Some(HWAccelConfig {
                encoder: "hevc_nvenc".to_string(),
                decoder: Some("hevc_cuvid".to_string()),
                pix_fmt: Some("cuda".to_string()),
            });
        }
        if combined.contains("h264_qsv") {
            return Some(HWAccelConfig {
                encoder: "h264_qsv".to_string(),
                decoder: Some("h264_qsv".to_string()),
                pix_fmt: Some("qsv".to_string()),
            });
        }
        if combined.contains("h264_videotoolbox") {
            return Some(HWAccelConfig {
                encoder: "h264_videotoolbox".to_string(),
                decoder: None,
                pix_fmt: Some("videotoolbox".to_string()),
            });
        }
    }

    None
}

// ============== Utility Functions ==============

fn parse_fraction(value: &str) -> f64 {
    if let Some((num, den)) = value.split_once('/') {
        let n: f64 = num.parse().unwrap_or(0.0);
        let d: f64 = den.parse().unwrap_or(1.0);
        if d.abs() > f64::EPSILON {
            return n / d;
        }
    }
    value.parse().unwrap_or(0.0)
}

fn chrono_timestamp() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

fn format_time(seconds: f64) -> String {
    let secs = seconds.max(0.0);
    let h = (secs / 3600.0).floor() as u64;
    let m = ((secs % 3600.0) / 60.0).floor() as u64;
    let s = (secs % 60.0).floor() as u64;
    let ms = ((secs % 1.0) * 1000.0).floor() as u64;
    format!("{:02}:{:02}:{:02}.{:03}", h, m, s, ms)
}

fn escape_path(path: &str) -> String {
    path.replace('\\', "\\\\").replace('\'', "\\'")
}

// ============== Core Video Functions ==============

pub struct VideoProcessor {
    ffmpeg: FFmpegResolver,
    temp_dir: PathBuf,
}

impl VideoProcessor {
    pub fn new() -> Self {
        Self {
            ffmpeg: FFmpegResolver::new(),
            temp_dir: std::env::temp_dir().join(format!("storyforge_{}", chrono_timestamp())),
        }
    }

    pub fn set_ffmpeg_path(&mut self, path: &str) {
        self.ffmpeg.set_path("ffmpeg", path);
    }

    pub fn ensure_temp_dir(&self) -> std::io::Result<PathBuf> {
        fs::create_dir_all(&self.temp_dir)?;
        Ok(self.temp_dir.clone())
    }

    pub fn cleanup_temp(&self) -> std::io::Result<()> {
        if self.temp_dir.exists() {
            fs::remove_dir_all(&self.temp_dir)?;
        }
        Ok(())
    }

    pub fn check_installation(&self) -> (bool, Option<String>) {
        let ffmpeg_path = self.ffmpeg.ffmpeg();
        let output = Command::new(&ffmpeg_path)
            .arg("-version")
            .output();

        match output {
            Ok(result) if result.status.success() => {
                let version = String::from_utf8_lossy(&result.stdout)
                    .lines()
                    .next()
                    .map(|s| s.trim().to_string())
                    .or_else(|| {
                        String::from_utf8_lossy(&result.stderr)
                            .lines()
                            .next()
                            .map(|s| s.trim().to_string())
                    });
                (true, version)
            }
            _ => (false, None),
        }
    }

    pub fn get_metadata(&self, path: &str) -> Result<VideoMetadata, String> {
        if path.trim().is_empty() {
            return Err("路径不能为空".to_string());
        }

        let output = Command::new(self.ffmpeg.ffprobe())
            .arg("-v")
            .arg("error")
            .arg("-show_format")
            .arg("-show_streams")
            .arg("-of")
            .arg("json")
            .arg(path)
            .output()
            .map_err(|e| format!("运行 ffprobe 失败: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "ffprobe 执行失败: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let payload: serde_json::Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("解析 JSON 失败: {}", e))?;

        // Find video stream
        let video_stream = payload
            .get("streams")
            .and_then(|s| s.as_array())
            .and_then(|arr| arr.iter().find(|s| s.get("codec_type") == Some(&serde_json::Value::String("video".to_string()))))
            .ok_or("未找到视频流")?;

        let width = video_stream.get("width").and_then(|v| v.as_u64()).unwrap_or(0) as u32;
        let height = video_stream.get("height").and_then(|v| v.as_u64()).unwrap_or(0) as u32;
        let codec = video_stream.get("codec_name").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
        let fps = parse_fraction(
            video_stream.get("r_frame_rate").and_then(|v| v.as_str()).unwrap_or("0/1")
        );

        // Audio stream info
        let audio_stream = payload
            .get("streams")
            .and_then(|s| s.as_array())
            .and_then(|arr| arr.iter().find(|s| s.get("codec_type") == Some(&serde_json::Value::String("audio".to_string()))));

        let audio_channels = audio_stream
            .and_then(|s| s.get("channels"))
            .and_then(|v| v.as_u64())
            .map(|v| v as u32);

        let audio_sample_rate = audio_stream
            .and_then(|s| s.get("sample_rate"))
            .and_then(|v| v.as_str())
            .and_then(|v| v.parse::<u32>().ok());

        // Format info
        let format = payload.get("format").cloned().unwrap_or_default();
        let duration = format
            .get("duration")
            .and_then(|v| v.as_str())
            .and_then(|v| v.parse::<f64>().ok())
            .unwrap_or(0.0);

        let file_size = format
            .get("format")
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        let stream_bitrate = video_stream
            .get("bit_rate")
            .and_then(|v| v.as_str())
            .and_then(|v| v.parse::<u64>().ok());
        let format_bitrate = format
            .get("bit_rate")
            .and_then(|v| v.as_str())
            .and_then(|v| v.parse::<u64>().ok());
        let bitrate = stream_bitrate.or(format_bitrate).unwrap_or(0);

        Ok(VideoMetadata {
            duration,
            width,
            height,
            fps,
            codec,
            bitrate,
            file_size,
            audio_channels,
            audio_sample_rate,
        })
    }

    pub fn extract_key_frames(
        &self,
        path: &str,
        options: &KeyFrameExtractOptions,
        app: Option<&AppHandle>,
    ) -> Result<Vec<String>, String> {
        if path.trim().is_empty() {
            return Err("路径不能为空".to_string());
        }

        let temp_dir = self.ensure_temp_dir().map_err(|e| format!("创建临时目录失败: {}", e))?;
        let output_pattern = temp_dir.join("frame_%04d.jpg");

        let max_frames = options.max_frames.unwrap_or(10).min(60);
        let quality = options.quality.unwrap_or(2).clamp(2, 31);
        let scene_threshold = options.scene_threshold.unwrap_or(0.3);

        let mut args = vec![
            "-y".to_string(),
            "-i".to_string(),
            path.to_string(),
        ];

        // Use scene detection filter for intelligent keyframe extraction
        if options.scene_detection.unwrap_or(true) {
            // Scene detection with select filter
            // scd=mode sets the scene change detection method
            args.extend([
                "-vf".to_string(),
                format!(
                    "select='gt(scene,{})',scale=iw:-1,qscale=v({})",
                    scene_threshold, quality
                ),
                "-frames:v".to_string(),
                max_frames.to_string(),
                "-vsync".to_string(),
                "vfr".to_string(), // Variable frame rate for better timestamps
            ]);
        } else if let Some(interval) = options.interval {
            // Fixed interval extraction
            args.extend([
                "-vf".to_string(),
                format!("fps={},scale=iw:-1,qscale=v({})", 1.0 / interval, quality),
                "-frames:v".to_string(),
                max_frames.to_string(),
            ]);
        } else {
            // Default: evenly spaced frames
            args.extend([
                "-vf".to_string(),
                format!("select='not(mod(n\\,{}))',scale=iw:-1,qscale=v({})",
                    (60.0 / max_frames as f64).round(), quality),
                "-frames:v".to_string(),
                max_frames.to_string(),
            ]);
        }

        args.push(output_pattern.to_string_lossy().to_string());

        if let Some(app_handle) = app {
            let _ = app_handle.emit("processing-progress", ProcessingProgress {
                stage: "正在提取关键帧...".to_string(),
                progress: 0.5,
                current_item: None,
                items_total: None,
                items_completed: None,
                time_remaining_secs: None,
            });
        }

        let output = Command::new(self.ffmpeg.ffmpeg())
            .args(&args)
            .output()
            .map_err(|e| format!("执行 ffmpeg 失败: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "提取关键帧失败: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Collect and sort frames
        let mut frames: Vec<_> = fs::read_dir(&temp_dir)
            .map_err(|e| format!("读取帧目录失败: {}", e))?
            .filter_map(|entry| entry.ok().map(|e| e.path()))
            .filter(|p| p.extension().and_then(|e| e.to_str()) == Some("jpg"))
            .collect();

        frames.sort();

        let result = frames
            .into_iter()
            .take(max_frames as usize)
            .map(|p| p.to_string_lossy().to_string())
            .collect();

        if let Some(app_handle) = app {
            let _ = app_handle.emit("processing-progress", ProcessingProgress {
                stage: "关键帧提取完成".to_string(),
                progress: 1.0,
                current_item: None,
                items_total: None,
                items_completed: None,
                time_remaining_secs: None,
            });
        }

        Ok(result)
    }

    pub fn cut_video(
        &self,
        input_path: &str,
        segments: &[VideoSegment],
        output_path: &str,
        options: Option<&TranscodeOptions>,
        app: Option<&AppHandle>,
    ) -> Result<String, String> {
        if input_path.trim().is_empty() || output_path.trim().is_empty() {
            return Err("输入或输出路径不能为空".to_string());
        }

        if segments.is_empty() {
            return Err("至少需要一个视频片段".to_string());
        }

        let temp_dir = self.ensure_temp_dir().map_err(|e| format!("创建临时目录失败: {}", e))?;
        let opts = options.as_ref().unwrap_or(&TranscodeOptions::default());

        // Emit progress
        if let Some(app_handle) = app {
            let _ = app_handle.emit("processing-progress", ProcessingProgress {
                stage: "正在裁剪视频片段...".to_string(),
                progress: 0.1,
                current_item: None,
                items_total: Some(segments.len() as u32),
                items_completed: Some(0),
                time_remaining_secs: None,
            });
        }

        // Process each segment
        let mut temp_files: Vec<PathBuf> = Vec::new();

        for (idx, segment) in segments.iter().enumerate() {
            let duration = (segment.end - segment.start).max(0.1);
            let temp_file = temp_dir.join(format!("seg_{:03}.mp4", idx));

            let mut args = vec![
                "-y".to_string(),
                "-ss".to_string(),
                format_time(segment.start),
                "-t".to_string(),
                format_time(duration),
                "-i".to_string(),
                input_path.to_string(),
            ];

            // Add encoding options
            self.add_encoding_args(&mut args, opts);

            args.push(temp_file.to_string_lossy().to_string());

            let output = Command::new(self.ffmpeg.ffmpeg())
                .args(&args)
                .output()
                .map_err(|e| format!("裁剪片段 {} 失败: {}", idx, e))?;

            if !output.status.success() {
                return Err(format!(
                    "裁剪片段 {} 失败: {}",
                    idx,
                    String::from_utf8_lossy(&output.stderr)
                ));
            }

            temp_files.push(temp_file);

            if let Some(app_handle) = app {
                let _ = app_handle.emit("processing-progress", ProcessingProgress {
                    stage: format!("已处理 {}/{} 个片段", idx + 1, segments.len()),
                    progress: 0.1 + 0.4 * ((idx + 1) as f64 / segments.len() as f64),
                    current_item: Some(format!("片段 {}", idx + 1)),
                    items_total: Some(segments.len() as u32),
                    items_completed: Some((idx + 1) as u32),
                    time_remaining_secs: None,
                });
            }
        }

        // Merge segments
        if let Some(app_handle) = app {
            let _ = app_handle.emit("processing-progress", ProcessingProgress {
                stage: "正在合并片段...".to_string(),
                progress: 0.6,
                current_item: None,
                items_total: None,
                items_completed: None,
                time_remaining_secs: None,
            });
        }

        if segments.len() == 1 {
            // Single segment, just copy
            fs::copy(&temp_files[0], output_path)
                .map_err(|e| format!("复制视频失败: {}", e))?;
        } else {
            // Multiple segments, concat
            self.merge_segments(&temp_files, output_path, opts, app)?;
        }

        // Cleanup temp files
        for file in temp_files {
            let _ = fs::remove_file(file);
        }

        if let Some(app_handle) = app {
            let _ = app_handle.emit("processing-progress", ProcessingProgress {
                stage: "视频裁剪完成".to_string(),
                progress: 1.0,
                current_item: None,
                items_total: None,
                items_completed: None,
                time_remaining_secs: None,
            });
        }

        Ok(output_path.to_string())
    }

    fn add_encoding_args(&self, args: &mut Vec<String>, opts: &TranscodeOptions) {
        // Video codec
        let codec = match opts.codec.as_deref() {
            Some("libx265") | Some("hevc") => "libx265",
            Some("h264_nvenc") => "h264_nvenc",
            Some("hevc_nvenc") => "hevc_nvenc",
            Some("h264_qsv") => "h264_qsv",
            Some("h264_videotoolbox") => "h264_videotoolbox",
            Some("vp9") => "libvpx-vp9",
            Some("av1") => "libaom-av1",
            _ => "libx264",
        };

        args.extend([
            "-c:v".to_string(), codec.to_string(),
        ]);

        // Quality/speed settings
        match opts.quality.as_deref() {
            Some("low") => {
                args.extend(["-crf".to_string(), (opts.crf.unwrap_or(28)).to_string()]);
                args.extend(["-preset".to_string(), "veryfast".to_string()]);
            }
            Some("medium") => {
                args.extend(["-crf".to_string(), (opts.crf.unwrap_or(23)).to_string()]);
                args.extend(["-preset".to_string(), "fast".to_string()]);
            }
            Some("high") | None => {
                args.extend(["-crf".to_string(), (opts.crf.unwrap_or(20)).to_string()]);
                args.extend(["-preset".to_string(), "medium".to_string()]);
            }
            Some("lossless") => {
                args.extend(["-crf".to_string(), "0".to_string()]);
                args.extend(["-preset".to_string(), "slow".to_string()]);
            }
            _ => {}
        }

        // Custom bitrate
        if let Some(ref bitrate) = opts.bitrate {
            args.extend(["-b:v".to_string(), bitrate.clone()]);
        }

        // Audio
        let audio_codec = opts.audio_codec.as_deref().unwrap_or("aac");
        args.extend(["-c:a".to_string(), audio_codec.to_string()]);

        if let Some(ref audio_bitrate) = opts.audio_bitrate {
            args.extend(["-b:a".to_string(), audio_bitrate.clone()]);
        }

        // Faststart for web playback
        args.extend(["-movflags".to_string(), "+faststart".to_string()]);
    }

    fn merge_segments(
        &self,
        temp_files: &[PathBuf],
        output_path: &str,
        opts: &TranscodeOptions,
        app: Option<&AppHandle>,
    ) -> Result<(), String> {
        let concat_list = temp_dir().join("concat.txt");
        let concat_content = temp_files
            .iter()
            .map(|p| format!("file '{}'\n", escape_path(&p.to_string_lossy())))
            .collect::<String>();

        fs::write(&concat_list, &concat_content)
            .map_err(|e| format!("写入 concat 列表失败: {}", e))?;

        if let Some(app_handle) = app {
            let _ = app_handle.emit("processing-progress", ProcessingProgress {
                stage: "正在合并视频...".to_string(),
                progress: 0.7,
                current_item: None,
                items_total: None,
                items_completed: None,
                time_remaining_secs: None,
            });
        }

        let mut args = vec![
            "-y".to_string(),
            "-f".to_string(),
            "concat".to_string(),
            "-safe".to_string(),
            "0".to_string(),
            "-i".to_string(),
            concat_list.to_string_lossy().to_string(),
        ];

        // Re-encode during merge for consistent codec
        self.add_encoding_args(&mut args, opts);

        args.push(output_path.to_string());

        let output = Command::new(self.ffmpeg.ffmpeg())
            .args(&args)
            .output()
            .map_err(|e| format!("合并视频失败: {}", e))?;

        let _ = fs::remove_file(&concat_list);

        if !output.status.success() {
            return Err(format!(
                "合并视频失败: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(())
    }

    pub fn generate_thumbnail(&self, path: &str, time_secs: Option<f64>, quality: Option<u32>) -> Result<String, String> {
        if path.trim().is_empty() {
            return Err("路径不能为空".to_string());
        }

        let temp_dir = self.ensure_temp_dir().map_err(|e| format!("创建临时目录失败: {}", e))?;
        let output_path = temp_dir.join(format!("thumb_{}.jpg", chrono_timestamp()));
        let time = time_secs.unwrap_or(1.0).max(0.0);
        let q = quality.unwrap_or(2).clamp(2, 31);

        let output = Command::new(self.ffmpeg.ffmpeg())
            .args(&[
                "-y",
                "-ss",
                &format_time(time),
                "-i",
                path,
                "-frames:v",
                "1",
                "-q:v",
                &q.to_string(),
                "-vf",
                "scale=320:-1",
                &output_path.to_string_lossy(),
            ])
            .output()
            .map_err(|e| format!("生成缩略图失败: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "生成缩略图失败: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(output_path.to_string_lossy().to_string())
    }

    pub fn probe_duration(&self, path: &str) -> Result<f64, String> {
        let output = Command::new(self.ffmpeg.ffprobe())
            .args(&[
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                path,
            ])
            .output()
            .map_err(|e| format!("探测视频时长失败: {}", e))?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        text.parse::<f64>()
            .map_err(|e| format!("解析时长失败: {}", e))
    }
}

impl Drop for VideoProcessor {
    fn drop(&mut self) {
        // Cleanup temp directory on drop
        if self.temp_dir.exists() {
            let _ = fs::remove_dir_all(&self.temp_dir);
        }
    }
}

// Thread-local temp directory for concat
thread_local! {
    static TEMP_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);
}

fn temp_dir() -> PathBuf {
    TEMP_DIR.with(|d| d.lock().clone().unwrap_or_else(|| std::env::temp_dir()))
}
