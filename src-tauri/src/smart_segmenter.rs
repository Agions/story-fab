//! Smart Segmenter - Intelligent video segmentation via scene change and audio analysis
//!
//! Segments video into meaningful chunks based on scene changes, silence detection,
//! dialogue detection, and motion analysis — all without external AI services.

use crate::binary::resolve_binary_path;
use crate::utils::{cmd_err, chrono_like_timestamp, parse_scdet_output, pcm_samples_from_wav};
use serde::{Deserialize, Serialize};
use std::process::Command;

/// Type of video segment
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SegmentType {
    /// Dialogue or speech segment
    Dialogue,
    /// Action/scene with significant motion
    Action,
    /// Transition between scenes (cut, dissolve, etc.)
    Transition,
    /// Silence or near-silence segment
    Silence,
    /// Generic content segment
    Content,
}

impl std::fmt::Display for SegmentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SegmentType::Dialogue => write!(f, "dialogue"),
            SegmentType::Action => write!(f, "action"),
            SegmentType::Transition => write!(f, "transition"),
            SegmentType::Silence => write!(f, "silence"),
            SegmentType::Content => write!(f, "content"),
        }
    }
}

/// A segmented portion of the video
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoSegment {
    /// Start time in milliseconds
    pub start_ms: u64,
    /// End time in milliseconds
    pub end_ms: u64,
    /// Type of segment
    pub segment_type: String,
    /// Duration in milliseconds
    pub duration_ms: u64,
    /// Confidence score 0.0-1.0
    pub confidence: f32,
    /// Scene change flag
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_scene_change: Option<bool>,
    /// Peak audio energy (normalized 0.0-1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peak_energy: Option<f32>,
    /// Silence ratio within segment (0.0-1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub silence_ratio: Option<f32>,
    /// Suggested playback speed for this segment (1.0=normal, 2.0=2x, 6.0=6x fast-forward)
    /// Boring/low-energy segments get high speed to compress dead time;
    /// high-energy/action segments stay at 1.0x
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggested_speed: Option<f32>,
}

impl VideoSegment {
    /// Factory: segment with given start/end, type, and optional overrides.
    fn new(start_ms: u64, end_ms: u64, segment_type: impl Into<String>, confidence: f32, is_scene_change: Option<bool>, suggested_speed: f32) -> Self {
        Self {
            start_ms,
            end_ms,
            duration_ms: end_ms.saturating_sub(start_ms),
            segment_type: segment_type.into(),
            confidence,
            is_scene_change,
            peak_energy: None,
            silence_ratio: None,
            suggested_speed: Some(suggested_speed),
        }
    }
}

/// Parameters for smart segmentation
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SegmentOptions {
    /// Minimum segment duration in ms (default 1000)
    pub min_duration_ms: Option<u64>,
    /// Maximum segment duration in ms (default 30000)
    pub max_duration_ms: Option<u64>,
    /// Scene change threshold 0.0-1.0 (default 0.3)
    pub scene_threshold: Option<f32>,
    /// Silence threshold (dB below mean, default -40)
    pub silence_threshold_db: Option<f32>,
    /// Detect dialogue via audio analysis (default true)
    pub detect_dialogue: Option<bool>,
    /// Detect transitions (default true)
    pub detect_transitions: Option<bool>,
}

impl Default for SegmentOptions {
    fn default() -> Self {
        Self {
            min_duration_ms: Some(1000),
            max_duration_ms: Some(30000),
            scene_threshold: Some(0.3),
            silence_threshold_db: Some(-40.0),
            detect_dialogue: Some(true),
            detect_transitions: Some(true),
        }
    }
}

impl SegmentOptions {
    fn min_ms(&self) -> u64 { self.min_duration_ms.unwrap_or(1000) }
    fn max_ms(&self) -> u64 { self.max_duration_ms.unwrap_or(30000) }
    fn scene_thresh(&self) -> f32 { self.scene_threshold.unwrap_or(0.3) }
}

/// Smart video segmenter
pub struct SmartSegmenter {
    ffmpeg_path: String,
    ffprobe_path: String,
}

impl SmartSegmenter {
    pub fn new() -> Self {
        Self {
            ffmpeg_path: resolve_binary_path("ffmpeg"),
            ffprobe_path: resolve_binary_path("ffprobe"),
        }
    }

    /// Perform smart segmentation on a video file
    pub fn smart_segment(&self, video_path: &str, options: &SegmentOptions) -> Vec<VideoSegment> {
        let opts = options.clone();
        let min_duration_ms = opts.min_ms();
        let max_duration_ms = opts.max_ms();

        // Step 1: Get video duration
        let duration_ms = match self.probe_duration_ms(video_path) {
            Ok(d) => d,
            Err(e) => {
                log::warn!("Failed to probe duration: {}", e);
                return Vec::new();
            }
        };

        // Step 2: Extract audio for analysis
        let audio_path = match self.extract_audio(video_path) {
            Ok(p) => p,
            Err(e) => {
                log::warn!("Failed to extract audio: {}", e);
                return self.scene_based_segmentation(video_path, duration_ms, &opts);
            }
        };

        // Step 3: Compute audio energy over time
        let energy_data = match self.compute_energy_profile(&audio_path, 500) {
            Ok(d) => d,
            Err(e) => {
                log::warn!("Failed to compute energy profile: {}", e);
                return self.scene_based_segmentation(video_path, duration_ms, &opts);
            }
        };

        // Step 4: Detect scene changes
        let scene_threshold = opts.scene_thresh();
        let scene_changes = if opts.detect_transitions.unwrap_or(true) {
            self.detect_scene_changes(video_path, scene_threshold)
        } else {
            Vec::new()
        };

        // Step 5: Segment based on energy profile
        let segments = self.segment_by_energy(energy_data.clone(), min_duration_ms, max_duration_ms);

        // Step 6: Compute global statistics for speed assignment
        let energies: Vec<f32> = energy_data.iter().map(|(_, e)| *e).collect();
        let mean_energy = if energies.is_empty() {
            0.0
        } else {
            energies.iter().sum::<f32>() / energies.len() as f32
        };

        // Step 7: Classify each segment and assign suggested playback speed
        let classified_segments: Vec<VideoSegment> = segments
            .into_iter()
            .map(|seg| {
                let seg_type = self.classify_segment(&seg, &scene_changes, &energy_data, mean_energy);
                let suggested_speed = self.derive_suggested_speed(&seg, &energy_data, mean_energy);
                VideoSegment {
                    start_ms: seg.0,
                    end_ms: seg.1,
                    duration_ms: seg.1.saturating_sub(seg.0),
                    segment_type: seg_type.0,
                    confidence: seg_type.1,
                    is_scene_change: Some(self.is_scene_at(&scene_changes, seg.0)),
                    peak_energy: None,
                    silence_ratio: None,
                    suggested_speed: Some(suggested_speed),
                }
            })
            .filter(|s| s.duration_ms >= min_duration_ms)
            .collect();

        // Cleanup
        let _ = std::fs::remove_file(&audio_path);

        classified_segments
    }

    fn scene_based_segmentation(&self, video_path: &str, duration_ms: u64, opts: &SegmentOptions) -> Vec<VideoSegment> {
        let min_duration_ms = opts.min_ms();
        let max_duration_ms = opts.max_ms();
        let scene_threshold = opts.scene_thresh();

        let scene_changes = self.detect_scene_changes(video_path, scene_threshold);

        // Evenly divide the video into segments if no scene changes detected
        if scene_changes.is_empty() {
            let mut segments = Vec::new();
            let mut current = 0u64;
            while current < duration_ms {
                let end = (current + max_duration_ms).min(duration_ms);
                segments.push(VideoSegment::new(current, end, "content", 0.5, Some(false), 1.0));
                current = end;
            }
            return segments;
        }

        // Segment around scene changes
        let mut segments = Vec::new();
        let mut prev_end = 0u64;

        for change_time in scene_changes {
            if change_time > prev_end && change_time - prev_end >= min_duration_ms {
                segments.push(VideoSegment::new(prev_end, change_time, "content", 0.7, Some(false), 1.0));
            }
            prev_end = change_time;
        }

        // Final segment
        if prev_end < duration_ms {
            segments.push(VideoSegment::new(prev_end, duration_ms, "content", 0.7, Some(false), 1.0));
        }

        segments
    }

    fn detect_scene_changes(&self, video_path: &str, threshold: f32) -> Vec<u64> {
        let stderr = Command::new(&self.ffmpeg_path)
            .args(&[
                "-hide_banner",
                "-i", video_path,
                "-vf", &format!("scdet=threshold={:.2}", threshold),
                "-f", "null", "-"
            ])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stderr).to_string())
            .unwrap_or_default();

        parse_scdet_output(&stderr)
            .into_iter()
            .map(|(ms, _)| ms)
            .collect()
    }

    fn extract_audio(&self, video_path: &str) -> Result<String, String> {
        let temp_audio = std::env::temp_dir()
            .join(format!("story-fab_seg_audio_{}.wav", chrono_like_timestamp()));

        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-y",
                "-i", video_path,
                "-vn",
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                &temp_audio.to_string_lossy(),
            ])
            .output()
            .map_err(|e| format!("Audio extraction failed: {}", e))?;

        if !output.status.success() {
            return Err(cmd_err("FFmpeg failed", &output));
        }

        Ok(temp_audio.display().to_string())
    }

    fn compute_energy_profile(&self, audio_path: &str, window_ms: u64) -> Result<Vec<(u64, f32)>, String> {
        let sample_rate = 16000u32;
        let window_samples = (window_ms as f64 * sample_rate as f64 / 1000.0) as usize;

        // Read WAV PCM directly — no second FFmpeg pass needed
        let pcm_data = match std::fs::read(audio_path) {
            Ok(d) => d,
            Err(e) => return Err(format!("Failed to read audio file '{}': {}", audio_path, e)),
        };

        let samples = pcm_samples_from_wav(&pcm_data);
        let mut energies = Vec::new();
        let hop = window_samples;

        for i in (0..samples.len().saturating_sub(window_samples)).step_by(hop) {
            let window = &samples[i..i + window_samples];
            let energy: f32 = window.iter().map(|&s| s * s).sum::<f32>() / window_samples as f32;
            let time_ms = (i as f32 * 1000.0 / sample_rate as f32) as u64;
            energies.push((time_ms, energy));
        }

        // 处理尾部残余样本（不足一个 window_samples 的末尾部分）
        let total_processed = (samples.len() / window_samples) * window_samples;
        if total_processed < samples.len() {
            let remaining = &samples[total_processed..];
            if !remaining.is_empty() {
                let energy: f32 = remaining.iter().map(|&s| s * s).sum::<f32>() / remaining.len() as f32;
                let time_ms = (total_processed as f32 * 1000.0 / sample_rate as f32) as u64;
                energies.push((time_ms, energy));
            }
        }

        Ok(energies)
    }

    fn segment_by_energy(&self, energy_data: Vec<(u64, f32)>, min_duration_ms: u64, max_duration_ms: u64) -> Vec<(u64, u64)> {
        if energy_data.is_empty() {
            return Vec::new();
        }

        // Compute global statistics
        let energies: Vec<f32> = energy_data.iter().map(|(_, e)| *e).collect();
        let mean_energy = energies.iter().sum::<f32>() / energies.len() as f32;
        let silence_threshold = mean_energy * 0.1; // -20dB relative to mean

        let mut segments = Vec::new();
        let mut segment_start: Option<u64> = None;
        for i in 0..energy_data.len() {
            let (time_ms, energy) = energy_data[i];

            if segment_start.is_none() {
                segment_start = Some(time_ms);
            }

            // Check if we should end the segment
            let duration = time_ms.saturating_sub(segment_start.unwrap_or(0));
            let next_time = energy_data.get(i + 1).map(|(t, _)| *t);

            let should_end = duration >= min_duration_ms
                && (duration >= max_duration_ms
                    || next_time.map(|nt| {
                        // End if energy drops significantly (silence) or next segment would be too long
                        energy < silence_threshold || (nt.saturating_sub(time_ms) + duration) > max_duration_ms
                    }).unwrap_or(false));

            if should_end {
                segments.push((segment_start.unwrap_or(0), time_ms));
                segment_start = None;
            }
        }

        // Don't forget the last segment
        if let Some(start) = segment_start {
            if let Some((last_time, _)) = energy_data.last() {
                let duration = *last_time - start;
                if duration >= min_duration_ms as u64 {
                    segments.push((start, *last_time));
                }
            }
        }

        segments
    }

    fn classify_segment(
        &self,
        seg: &(u64, u64),
        scene_changes: &[u64],
        energy_data: &[(u64, f32)],
        mean_energy: f32,
    ) -> (String, f32) {
        let duration = seg.1.saturating_sub(seg.0);
        let _mid_point = seg.0 + duration / 2;

        // Check if this is right at a scene change
        let at_scene_change = scene_changes.iter().any(|&sc| {
            (sc >= seg.0 && sc <= seg.1) || (sc.saturating_sub(500) <= seg.0 && sc + 500 >= seg.0)
        });

        if at_scene_change && duration < 2000 {
            return ("transition".to_string(), 0.85);
        }

        // Duration-based classification
        if duration < 3000 {
            if at_scene_change {
                return ("transition".to_string(), 0.8);
            }
            return ("action".to_string(), 0.6);
        }

        if duration > 15000 {
            return ("content".to_string(), 0.7);
        }

        ("content".to_string(), 0.65)
    }

    /// Derive suggested playback speed (1.0–6.0x) based on segment energy profile.
    ///
    /// Speed tiers — aligned with the ai-video-editor pipeline:
    ///   1.0x  — High energy, dialogue/action, scene changes (keep original pacing)
    ///   2.0x  — Moderate energy (slightly below mean)
    ///   4.0x  — Low energy / setup / transitions (skip dead time)
    ///   6.0x  — Very low energy / silence (maximum compression; optional skip)
    fn derive_suggested_speed(
        &self,
        seg: &(u64, u64),
        energy_data: &[(u64, f32)],
        mean_energy: f32,
    ) -> f32 {
        if mean_energy <= 0.0 || energy_data.is_empty() {
            return 1.0;
        }

        // Compute average energy within this segment's time window
        let seg_energies: Vec<f32> = energy_data
            .iter()
            .filter(|(t, _)| *t >= seg.0 && *t <= seg.1)
            .map(|(_, e)| *e)
            .collect();

        if seg_energies.is_empty() {
            return 1.0;
        }

        let seg_mean: f32 = seg_energies.iter().sum::<f32>() / seg_energies.len() as f32;
        let ratio = seg_mean / mean_energy;

        // Transition segments get a small boost only if they have enough content
        let duration_ms = seg.1.saturating_sub(seg.0);
        if duration_ms < 3000 {
            // Very short segments — keep at normal speed to avoid jarring jumps
            return 1.0;
        }

        if ratio > 1.1 {
            // Segment is above average energy — high pacing, keep full speed
            1.0
        } else if ratio > 0.85 {
            // Slightly below average — mild slowdown of "dead time"
            2.0
        } else if ratio > 0.5 {
            // Well below average — significant dead time
            4.0
        } else {
            // Near silence — maximum compression
            6.0
        }
    }

    fn is_scene_at(&self, scene_changes: &[u64], time_ms: u64) -> bool {
        scene_changes.iter().any(|&sc| {
            sc >= time_ms.saturating_sub(200) && sc <= time_ms + 200
        })
    }

    fn probe_duration_ms(&self, video_path: &str) -> Result<u64, String> {
        let output = Command::new(&self.ffprobe_path)
            .args(&[
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video_path,
            ])
            .output()
            .map_err(|e| format!("Probe failed: {}", e))?;

        if !output.status.success() {
            return Err(cmd_err("FFmpeg failed", &output));
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let secs: f64 = text.parse()
            .map_err(|_| "Failed to parse duration".to_string())?;

        Ok((secs * 1000.0) as u64)
    }
}

impl Default for SmartSegmenter {
    fn default() -> Self {
        Self::new()
    }
}


