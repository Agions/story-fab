//! Highlight Detector - Local AI-free highlight detection via audio energy analysis
//!
//! Uses FFmpeg to extract audio waveform data, then computes Short-Time Energy (STE)
//! to identify highlight moments without any external AI service.

use crate::binary::resolve_binary_path;
use crate::utils::{cmd_err, chrono_like_timestamp, parse_scdet_output, pcm_samples_from_wav};
use serde::{Deserialize, Serialize};

use std::process::Command;

/// Reason why a segment was identified as a highlight
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum HighlightReason {
    /// High audio energy (louder than surroundings)
    AudioEnergy,
    /// Scene change detected
    SceneChange,
    /// Burst of motion detected
    MotionBurst,
    /// Combined score from multiple signals
    Combined,
}

impl std::fmt::Display for HighlightReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HighlightReason::AudioEnergy => write!(f, "audio_energy"),
            HighlightReason::SceneChange => write!(f, "scene_change"),
            HighlightReason::MotionBurst => write!(f, "motion_burst"),
            HighlightReason::Combined => write!(f, "combined"),
        }
    }
}

/// A detected highlight segment
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HighlightSegment {
    /// Start time in milliseconds
    pub start_ms: u64,
    /// End time in milliseconds
    pub end_ms: u64,
    /// Highlight score from 0.0 to 1.0
    pub score: f32,
    /// Reason for highlight detection
    pub reason: String,
    /// Optional sub-score breakdown
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audio_score: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scene_score: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motion_score: Option<f32>,
}

impl HighlightSegment {
    /// Factory: audio energy based highlight
    fn audio(start_ms: u64, end_ms: u64, score: f32) -> Self {
        Self { start_ms, end_ms, score, reason: "audio_energy".into(), audio_score: Some(score), scene_score: None, motion_score: None }
    }

    /// Factory: scene change based highlight
    fn scene(start_ms: u64, end_ms: u64, score: f32) -> Self {
        Self { start_ms, end_ms, score, reason: "scene_change".into(), audio_score: None, scene_score: Some(score), motion_score: None }
    }

    /// Merge another segment into this one (averaged scores, extended end).
    fn combine_with(&mut self, other: &Self) {
        self.end_ms = self.end_ms.max(other.end_ms);
        self.score = (self.score + other.score) / 2.0;
        self.reason = "combined".into();
        // Correct averaging: only average when both have values, otherwise use the available one
        self.audio_score = match (self.audio_score, other.audio_score) {
            (Some(a), Some(b)) => Some((a + b) / 2.0),
            (Some(a), None) | (None, Some(a)) => Some(a),
            (None, None) => None,
        };
        self.scene_score = match (self.scene_score, other.scene_score) {
            (Some(a), Some(b)) => Some((a + b) / 2.0),
            (Some(a), None) | (None, Some(a)) => Some(a),
            (None, None) => None,
        };
    }
}

/// Parameters for highlight detection
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HighlightOptions {
    /// Energy threshold multiplier (default 1.5 = 50% above mean)
    pub threshold: Option<f32>,
    /// Minimum segment duration in ms (default 500)
    pub min_duration_ms: Option<u64>,
    /// Maximum number of highlights to return (default 10)
    pub top_n: Option<usize>,
    /// Window size for energy computation in ms (default 100)
    pub window_ms: Option<u64>,
    /// Enable scene change detection (default true)
    pub detect_scene: Option<bool>,
    /// Scene change threshold 0.0-1.0 (default 0.3)
    pub scene_threshold: Option<f32>,
}

impl Default for HighlightOptions {
    fn default() -> Self {
        Self {
            threshold: Some(1.5),
            min_duration_ms: Some(500),
            top_n: Some(10),
            window_ms: Some(100),
            detect_scene: Some(true),
            scene_threshold: Some(0.3),
        }
    }
}

/// State kept between detection calls
pub struct HighlightDetector {
    ffmpeg_path: String,
    ffprobe_path: String,
}

impl HighlightDetector {
    pub fn new() -> Self {
        Self {
            ffmpeg_path: resolve_binary_path("ffmpeg"),
            ffprobe_path: resolve_binary_path("ffprobe"),
        }
    }

    /// Detect highlights from audio energy analysis
    pub fn detect_audio_highlights(&self, audio_path: &str, options: &HighlightOptions) -> Vec<HighlightSegment> {
        let opts = options;
        let threshold_mult = opts.threshold.unwrap_or(1.5);
        let min_duration_ms = opts.min_duration_ms.unwrap_or(500) as f32;
        let window_ms = opts.window_ms.unwrap_or(100) as f32;

        // Extract audio as raw PCM for energy analysis
        let pcm_data = match self.extract_audio_pcm(audio_path) {
            Ok(d) => d,
            Err(e) => {
                log::warn!("Failed to extract audio PCM: {}", e);
                return Vec::new();
            }
        };

        if pcm_data.is_empty() {
            return Vec::new();
        }

        // Compute Short-Time Energy (STE)
        let sample_rate = 44100u32;
        let window_samples = (window_ms * sample_rate as f32 / 1000.0) as usize;
        let hop_size = window_samples / 2; // 50% overlap

        let mut energies: Vec<f32> = Vec::new();
        let mut timestamps: Vec<u64> = Vec::new();

        for i in (0..pcm_data.len().saturating_sub(window_samples)).step_by(hop_size) {
            let window = &pcm_data[i..i + window_samples];
            let energy: f32 = window.iter().map(|&s| s * s).sum::<f32>() / window_samples as f32;
            let time_ms = (i as f32 * 1000.0 / sample_rate as f32) as u64;
            energies.push(energy);
            timestamps.push(time_ms);
        }

        if energies.is_empty() {
            return Vec::new();
        }

        // Compute mean and std of energies
        let mean_energy = energies.iter().sum::<f32>() / energies.len() as f32;
        let variance = energies.iter().map(|&e| (e - mean_energy).powi(2)).sum::<f32>() / energies.len() as f32;
        let std_energy = variance.sqrt();

        let threshold = mean_energy + threshold_mult * std_energy;

        // Find segments above threshold
        let mut segments: Vec<(usize, usize)> = Vec::new();
        let mut in_highlight = false;
        let mut highlight_start = 0usize;

        for (i, &energy) in energies.iter().enumerate() {
            if energy > threshold {
                if !in_highlight {
                    in_highlight = true;
                    highlight_start = i;
                }
            } else {
                if in_highlight {
                    segments.push((highlight_start, i));
                    in_highlight = false;
                }
            }
        }
        if in_highlight {
            segments.push((highlight_start, energies.len() - 1));
        }

        // Convert to HighlightSegments with scores
        let mut results: Vec<HighlightSegment> = segments
            .into_iter()
            .filter_map(|(start_idx, end_idx)| {
                let start_ms = timestamps.get(start_idx).copied().unwrap_or(0);
                let end_ms = timestamps.get(end_idx).copied().unwrap_or(start_ms);
                let duration_ms = end_ms.saturating_sub(start_ms);

                if duration_ms < min_duration_ms as u64 {
                    return None;
                }

                // Compute score relative to threshold
                let peak_energy = energies[start_idx..=end_idx]
                    .iter()
                    .fold(0.0f32, |max, &e| max.max(e));
                let score = ((peak_energy - mean_energy) / (std_energy.max(0.001))).clamp(0.0, 1.0) * 0.8 + 0.2;

                Some(HighlightSegment::audio(start_ms, end_ms, score))
            })
            .collect();

        // Sort by score descending
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        results
    }

    /// Detect scene changes using FFmpeg's scdet filter
    pub fn detect_scene_changes(&self, video_path: &str, options: &HighlightOptions) -> Vec<HighlightSegment> {
        let opts = options;
        let threshold = opts.scene_threshold.unwrap_or(0.3);
        let min_duration_ms = opts.min_duration_ms.unwrap_or(500);
        let top_n = opts.top_n.unwrap_or(10);

        let stderr = Command::new(&self.ffmpeg_path)
            .args(&[
                "-hide_banner",
                "-i", video_path,
                "-vf", &format!("scdet=threshold={:.2}:sc_pass=1:debug=0", threshold),
                "-f", "null", "-"
            ])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stderr).into_owned())
            .unwrap_or_default();

        let scene_changes = parse_scdet_output(&stderr);

        // Merge nearby scene changes into segments
        let mut segments: Vec<HighlightSegment> = Vec::new();
        let mut current_start: Option<u64> = None;
        let mut current_end: Option<u64> = None;
        let mut current_max_score: f32 = 0.0;

        for (time_ms, score) in scene_changes {
            if current_start.is_none() {
                current_start = Some(time_ms);
                current_end = Some(time_ms);
                current_max_score = score;
            } else if time_ms - current_end.unwrap_or(0) < min_duration_ms {
                current_end = Some(time_ms);
                current_max_score = current_max_score.max(score);
            } else {
                if let (Some(start), Some(end)) = (current_start, current_end) {
                    let duration = end.saturating_sub(start);
                    if duration >= min_duration_ms {
                        segments.push(HighlightSegment::scene(start, end, current_max_score.min(1.0)));
                    }
                }
                current_start = Some(time_ms);
                current_end = Some(time_ms);
                current_max_score = score;
            }
        }
        if let (Some(start), Some(end)) = (current_start, current_end) {
            let duration = end.saturating_sub(start);
            if duration >= min_duration_ms {
                segments.push(HighlightSegment::scene(start, end, current_max_score.min(1.0)));
            }
        }

        segments.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        segments.into_iter().take(top_n).collect()
    }

    /// Get combined highlights from both audio and scene analysis
    pub fn get_highlights(&self, video_path: &str, options: &HighlightOptions) -> Vec<HighlightSegment> {
        let opts = options.clone();
        let top_n = opts.top_n.unwrap_or(10);
        let min_duration_ms = opts.min_duration_ms.unwrap_or(500);

        let mut all_segments: Vec<HighlightSegment> = Vec::new();

        // 1. Audio-based highlights
        if let Ok(audio_path) = self.extract_audio_path(video_path) {
            let audio_segments = self.detect_audio_highlights(&audio_path, &opts);
            all_segments.extend(audio_segments);
            // Always cleanup temp audio, even on error
            let _ = std::fs::remove_file(&audio_path);
        }

        // 2. Scene change highlights
        if opts.detect_scene.unwrap_or(true) {
            let scene_segments = self.detect_scene_changes(video_path, &opts);
            all_segments.extend(scene_segments);
        }

        // 3. Merge overlapping segments (union)
        if all_segments.is_empty() {
            return Vec::new();
        }

        // Sort by start_ms
        all_segments.sort_by_key(|s| s.start_ms);

        // Merge overlapping segments
        let mut merged: Vec<HighlightSegment> = Vec::new();
        for seg in all_segments {
            if let Some(last) = merged.last_mut() {
                if seg.start_ms <= last.end_ms {
                    last.combine_with(&seg);
                    continue;
                }
            }
            merged.push(seg);
        }

        // Filter out short segments and re-score
        let merged: Vec<HighlightSegment> = merged
            .into_iter()
            .filter(|s| s.end_ms.saturating_sub(s.start_ms) >= min_duration_ms as u64)
            .map(|mut s| {
                // Finalize score to 0.0-1.0 range
                s.score = s.score.clamp(0.0, 1.0);
                s
            })
            .collect();

        // Sort by score and take top N
        let mut sorted = merged;
        sorted.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        sorted.into_iter().take(top_n).collect()
    }

    fn extract_audio_pcm(&self, audio_path: &str) -> Result<Vec<f32>, String> {
        let temp_wav = std::env::temp_dir()
            .join(format!("story-fab_pcm_{}.wav", chrono_like_timestamp()));

        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-y",
                "-i", audio_path,
                "-ac", "1",
                "-ar", "44100",
                "-f", "s16le",
                "-acodec", "pcm_s16le",
                &temp_wav.to_string_lossy(),
            ])
            .output()
            .map_err(|e| format!("FFmpeg failed to extract audio from '{}': {}", audio_path, e))?;

        if !output.status.success() {
            let _ = std::fs::remove_file(&temp_wav);
            return Err(cmd_err("FFmpeg failed", &output));
        }

        let pcm_data = match std::fs::read(&temp_wav) {
            Ok(d) => d,
            Err(e) => {
                let _ = std::fs::remove_file(&temp_wav);
                return Err(format!("Failed to read PCM from '{}': {}", temp_wav.display(), e));
            }
        };
        let _ = std::fs::remove_file(&temp_wav);

        Ok(pcm_samples_from_wav(&pcm_data))
    }

    /// Compute Zero-Crossing Rate (ZCR) for audio burst detection.
    /// High ZCR indicates sudden audio events (applause, laughter, sharp sounds).
    pub fn detect_zcr_bursts(&self, audio_path: &str, window_ms: f32, threshold: f32) -> Vec<(u64, u64, f32)> {
        let pcm_data = match self.extract_audio_pcm(audio_path) {
            Ok(d) => d,
            Err(_) => return Vec::new(),
        };
        if pcm_data.is_empty() { return Vec::new(); }

        let sample_rate = 44100.0f32;
        let window_samples = (window_ms * sample_rate / 1000.0) as usize;
        let hop = window_samples / 2;

        let mut zcr_values: Vec<f32> = Vec::new();
        let mut timestamps: Vec<u64> = Vec::new();

        for i in (0..pcm_data.len().saturating_sub(window_samples)).step_by(hop) {
            let window = &pcm_data[i..i + window_samples];
            let mut crossings = 0u32;
            let mut prev = window[0];
            for cur in &window[1..] {
                if (cur >= &0.0 && prev < 0.0) || (cur < &0.0 && prev >= 0.0) {
                    crossings += 1;
                }
                prev = *cur;
            }
            let zcr = crossings as f32 / (window_samples - 1) as f32;
            zcr_values.push(zcr);
            timestamps.push((i as f32 * 1000.0 / sample_rate) as u64);
        }

        if zcr_values.is_empty() { return Vec::new(); }

        let mean_zcr = zcr_values.iter().sum::<f32>() / zcr_values.len() as f32;
        let zcr_threshold = mean_zcr * threshold;

        let mut bursts: Vec<(u64, u64, f32)> = Vec::new();
        let mut in_burst = false;
        let mut start_idx = 0usize;

        for (i, &zcr) in zcr_values.iter().enumerate() {
            if zcr > zcr_threshold {
                if !in_burst { in_burst = true; start_idx = i; }
            } else if in_burst {
                in_burst = false;
                let start_ms = timestamps[start_idx];
                let end_ms = timestamps[i];
                if end_ms > start_ms + 200 { // min 200ms burst
                    let peak_zcr = zcr_values[start_idx..=i].iter().fold(0.0f32, |m, v| m.max(*v));
                    bursts.push((start_ms, end_ms, peak_zcr / zcr_threshold.max(0.001)));
                }
            }
        }
        if in_burst && !zcr_values.is_empty() {
            let start_ms = timestamps[start_idx];
            let end_ms = *timestamps.last().unwrap_or(&0);
            if end_ms > start_ms + 200 {
                let peak_zcr = zcr_values[start_idx..].iter().fold(0.0f32, |m, v| m.max(*v));
                bursts.push((start_ms, end_ms, peak_zcr / zcr_threshold.max(0.001)));
            }
        }
        bursts
    }


    fn extract_audio_path(&self, video_path: &str) -> Result<String, String> {
        let temp_audio = std::env::temp_dir()
            .join(format!("story-fab_audio_{}.wav", chrono_like_timestamp()));

        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-y",
                "-i", video_path,
                "-vn",              // No video
                "-acodec", "pcm_s16le",
                "-ar", "44100",
                "-ac", "1",
                &temp_audio.to_string_lossy(),
            ])
            .output()
            .map_err(|e| format!("FFmpeg audio extraction failed: {}", e))?;

        if !output.status.success() {
            // Cleanup temp file on failure
            let _ = std::fs::remove_file(&temp_audio);
            return Err(cmd_err("FFmpeg failed", &output));
        }

        Ok(temp_audio.display().to_string())
    }
}

impl Default for HighlightDetector {
    fn default() -> Self {
        Self::new()
    }
}

