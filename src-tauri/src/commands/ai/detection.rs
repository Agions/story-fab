//! Highlight & Segment Detection — 高光检测 + 智能切段

use crate::highlight::HighlightDetector;
use crate::segment::SmartSegmenter;
use crate::types::{DetectHighlightsInput, DetectSmartSegmentsInput};

use super::types::{DetectZCRBurstsInput, ZCRBurstResult};

#[tauri::command]
pub fn detect_highlights(input: DetectHighlightsInput) -> Result<Vec<crate::highlight::HighlightSegment>, String> {
    if input.video_path.trim().is_empty() {
        return Err("视频路径不能为空".to_string());
    }
    let detector = HighlightDetector::new();
    let options = crate::highlight::HighlightOptions {
        threshold: input.threshold.map(|v| v as f32),
        min_duration_ms: input.min_duration_ms,
        top_n: input.top_n,
        window_ms: input.window_ms,
        detect_scene: input.detect_scene,
        scene_threshold: input.scene_threshold.map(|v| v as f32),
    };
    let highlights = detector.get_highlights(&input.video_path, &options);
    Ok(highlights)
}

#[tauri::command]
pub fn detect_zcr_bursts(input: DetectZCRBurstsInput) -> Result<Vec<ZCRBurstResult>, String> {
    if input.audio_path.trim().is_empty() {
        return Err("音频路径不能为空".to_string());
    }
    let detector = HighlightDetector::new();
    let window_ms = input.window_ms.unwrap_or(50.0);
    let threshold = input.zcr_threshold_mult.unwrap_or(2.5);
    let bursts = detector.detect_zcr_bursts(&input.audio_path, window_ms, threshold);
    Ok(bursts
        .into_iter()
        .map(|(start_ms, end_ms, score)| ZCRBurstResult { start_ms, end_ms, score })
        .collect())
}

#[tauri::command]
pub fn detect_smart_segments(
    input: DetectSmartSegmentsInput,
) -> Result<Vec<crate::segment::VideoSegment>, String> {
    if input.video_path.trim().is_empty() {
        return Err("视频路径不能为空".to_string());
    }
    let segmenter = SmartSegmenter::new();
    let options = crate::segment::SegmentOptions {
        min_duration_ms: input.min_duration_ms,
        max_duration_ms: input.max_duration_ms,
        scene_threshold: input.scene_threshold.map(|v| v as f32),
        silence_threshold_db: input.silence_threshold_db,
        detect_dialogue: input.detect_dialogue,
        detect_transitions: input.detect_transitions,
    };
    let segments = segmenter.smart_segment(&input.video_path, &options);
    Ok(segments)
}