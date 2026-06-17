//! Combiner — merge audio + scene highlights into unified output
//! Combiner — merge audio + scene highlights into unified output

use crate::highlight::types::{HighlightOptions, HighlightSegment};
use crate::highlight::audio_analysis::HighlightDetector as AudioDetector;
use crate::highlight::scene_detect::SceneDetector;
use std::process::Command;
use crate::binary::resolve_binary_path;
use crate::utils::chrono_like_timestamp;

/// Get combined highlights from both audio energy and scene change analysis
pub fn get_highlights(
    video_path: &str,
    options: &HighlightOptions,
) -> Vec<HighlightSegment> {
    let opts = options.clone();
    let top_n = opts.top_n.unwrap_or(10);
    let min_duration_ms = opts.min_duration_ms.unwrap_or(500) as u64;

    let audio_detector = AudioDetector::new();
    let scene_detector = SceneDetector::new();

    let mut all_segments: Vec<HighlightSegment> = Vec::new();

    // 1. Audio-based highlights
    if let Ok(audio_path) = extract_audio_path(video_path, &audio_detector) {
        let audio_segments = audio_detector.detect_audio_highlights(&audio_path, &opts);
        all_segments.extend(audio_segments);
        let _ = std::fs::remove_file(&audio_path);
    }

    // 2. Scene change highlights
    if opts.detect_scene.unwrap_or(true) {
        let scene_segments = scene_detector.detect_scene_changes(video_path, &opts);
        all_segments.extend(scene_segments);
    }

    if all_segments.is_empty() {
        return Vec::new();
    }

    all_segments.sort_by_key(|s| s.start_ms);

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

    let merged: Vec<HighlightSegment> = merged
        .into_iter()
        .filter(|s| s.end_ms.saturating_sub(s.start_ms) >= min_duration_ms)
        .map(|mut s| {
            s.score = s.score.clamp(0.0, 1.0);
            s
        })
        .collect();

    let mut sorted = merged;
    sorted.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    sorted.into_iter().take(top_n).collect()
}

/// Extract audio from video to temp WAV file
fn extract_audio_path(video_path: &str, _detector: &AudioDetector) -> Result<String, String> {
    let temp_audio = std::env::temp_dir()
        .join(format!("story-fab_audio_{}.wav", chrono_like_timestamp()));
    let ffmpeg_path = resolve_binary_path("ffmpeg");

    let output = Command::new(&ffmpeg_path)
        .args(&[
            "-y", "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "44100",
            "-ac", "1",
            &temp_audio.to_string_lossy(),
        ])
        .output()
        .map_err(|e| format!("FFmpeg audio extraction failed: {}", e))?;

    if !output.status.success() {
        let _ = std::fs::remove_file(&temp_audio);
        return Err(String::from_utf8_lossy(&output.stderr).into_owned());
    }

    Ok(temp_audio.display().to_string())
}