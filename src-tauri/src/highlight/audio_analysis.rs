//! Audio analysis for highlight detection — split from highlight module
//! Handles audio energy computation, PCM extraction, ZCR, and audio-based highlight detection

use crate::binary::resolve_binary_path;
use crate::utils::{cmd_err, chrono_like_timestamp, pcm_samples_from_wav};
use crate::highlight::types::{HighlightOptions, HighlightSegment};
use std::process::Command;

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
    pub fn detect_audio_highlights(
        &self,
        audio_path: &str,
        options: &HighlightOptions,
    ) -> Vec<HighlightSegment> {
        let threshold_mult = options.threshold.unwrap_or(1.5);
        let min_duration_ms = options.min_duration_ms.unwrap_or(500) as f32;
        let window_ms = options.window_ms.unwrap_or(100) as f32;

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

        let sample_rate = 44100u32;
        let window_samples = (window_ms * sample_rate as f32 / 1000.0) as usize;
        let hop_size = window_samples / 2;

        let mut energies: Vec<f32> = Vec::new();
        let mut timestamps: Vec<u64> = Vec::new();

        for i in (0..pcm_data.len().saturating_sub(window_samples)).step_by(hop_size) {
            let window = &pcm_data[i..i + window_samples];
            let energy: f32 =
                window.iter().map(|&s| s * s).sum::<f32>() / window_samples as f32;
            let time_ms = (i as f32 * 1000.0 / sample_rate as f32) as u64;
            energies.push(energy);
            timestamps.push(time_ms);
        }

        if energies.is_empty() {
            return Vec::new();
        }

        let mean_energy = energies.iter().sum::<f32>() / energies.len() as f32;
        let variance = energies
            .iter()
            .map(|&e| (e - mean_energy).powi(2))
            .sum::<f32>()
            / energies.len() as f32;
        let std_energy = variance.sqrt();

        let threshold = mean_energy + threshold_mult * std_energy;

        let mut segments: Vec<(usize, usize)> = Vec::new();
        let mut in_highlight = false;
        let mut highlight_start = 0usize;

        for (i, &energy) in energies.iter().enumerate() {
            if energy > threshold {
                if !in_highlight {
                    in_highlight = true;
                    highlight_start = i;
                }
            } else if in_highlight {
                segments.push((highlight_start, i));
                in_highlight = false;
            }
        }
        if in_highlight {
            segments.push((highlight_start, energies.len() - 1));
        }

        let mut results: Vec<HighlightSegment> = segments
            .into_iter()
            .filter_map(|(start_idx, end_idx)| {
                let start_ms = *timestamps.get(start_idx)?;
                let end_ms = *timestamps.get(end_idx)?;
                let duration_ms = end_ms.saturating_sub(start_ms);

                if duration_ms < min_duration_ms as u64 {
                    return None;
                }

                let peak_energy =
                    energies[start_idx..=end_idx].iter().fold(0.0f32, |max, &e| max.max(e));
                let score =
                    ((peak_energy - mean_energy) / (std_energy.max(0.001))).clamp(0.0, 1.0) * 0.8
                        + 0.2;

                Some(HighlightSegment::audio(start_ms, end_ms, score))
            })
            .collect();

        results.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        results
    }

    /// Compute Zero-Crossing Rate (ZCR) for audio burst detection.
    pub fn detect_zcr_bursts(
        &self,
        audio_path: &str,
        window_ms: f32,
        threshold: f32,
    ) -> Vec<(u64, u64, f32)> {
        let pcm_data = match self.extract_audio_pcm(audio_path) {
            Ok(d) => d,
            Err(_) => return Vec::new(),
        };
        if pcm_data.is_empty() {
            return Vec::new();
        }

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

        if zcr_values.is_empty() {
            return Vec::new();
        }

        let mean_zcr = zcr_values.iter().sum::<f32>() / zcr_values.len() as f32;
        let zcr_threshold = mean_zcr * threshold;

        let mut bursts: Vec<(u64, u64, f32)> = Vec::new();
        let mut in_burst = false;
        let mut start_idx = 0usize;

        for (i, &zcr) in zcr_values.iter().enumerate() {
            if zcr > zcr_threshold {
                if !in_burst {
                    in_burst = true;
                    start_idx = i;
                }
            } else if in_burst {
                in_burst = false;
                let start_ms = timestamps[start_idx];
                let end_ms = timestamps[i];
                bursts.push((start_ms, end_ms, zcr));
            }
        }
        bursts
    }

    fn extract_audio_pcm(&self, audio_path: &str) -> Result<Vec<f32>, String> {
        let temp_wav =
            std::env::temp_dir().join(format!("story-fab_pcm_{}.wav", chrono_like_timestamp()));

        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-y", "-i", audio_path, "-ac", "1", "-ar", "44100", "-f", "s16le",
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
                return Err(format!(
                    "Failed to read PCM from '{}': {}",
                    temp_wav.display(),
                    e
                ));
            }
        };
        let _ = std::fs::remove_file(&temp_wav);

        Ok(pcm_samples_from_wav(&pcm_data))
    }
}

impl Default for HighlightDetector {
    fn default() -> Self {
        Self::new()
    }
}