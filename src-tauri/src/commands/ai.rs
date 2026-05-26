use crate::types::{
    DetectHighlightsInput, DetectSmartSegmentsInput, DirectorPlanInput,
    DirectorPlanOutput,
};
use crate::highlight_detector::HighlightDetector;
use crate::smart_segmenter::SmartSegmenter;
use crate::utils::cmd_err;
use crate::binary::resolve_binary_path;
use serde::{Deserialize, Serialize};

/// Resolve edge-tts path: CUTDECK_EDGE_TTS_PATH env > search PATH > "edge-tts"
fn edge_tts_path() -> String {
    if let Ok(path) = std::env::var("CUTDECK_EDGE_TTS_PATH") {
        if !path.trim().is_empty() {
            return path;
        }
    }
    resolve_binary_path("edge-tts")
}

/// Compute mean of an iterator of f64, returning 0.0 for empty input.
fn mean_f64<I: IntoIterator<Item = f64>>(iter: I) -> f64 {
    let iter = iter.into_iter();
    let (sum, count) = iter.fold((0.0, 0usize), |(s, c), v| (s + v, c + 1));
    if count == 0 { 0.0 } else { sum / count as f64 }
}

// ─── AI Director ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn run_ai_director_plan(input: DirectorPlanInput) -> DirectorPlanOutput {
    let n = input.segments.len().max(1);
    let scene_density = if input.segments.is_empty() {
        1.0
    } else {
        input.scenes.len() as f64 / n as f64
    };
    let speech_density = mean_f64(input.segments.iter().map(|s| s.content.chars().count() as f64)) / input.target_duration.max(1.0);
    let segment_id_stability = mean_f64(input.segments.iter().map(|s| s.id.len() as f64));
    let avg_scene_duration = mean_f64(input.scenes.iter().map(|scene| (scene.end_time - scene.start_time).max(0.0)));
    let scene_id_signal = mean_f64(input.scenes.iter().map(|scene| scene.id.len() as f64));

    let pacing_base = match input.mode.as_str() {
        "ai-mixclip" => 1.08,
        "ai-first-person" => 0.95,
        _ => 1.0,
    };
    let pacing_factor = (pacing_base + (scene_density - 1.0) * 0.06).clamp(0.85, 1.2);
    let preferred_transition: &'static str = if scene_density > 1.2 {
        "cut"
    } else if input.auto_original_overlay {
        "dissolve"
    } else {
        "fade"
    };
    let beat_count = (input.target_duration / 4.0).round().clamp(6.0, 24.0) as u32;
    let confidence = (0.6
        + scene_density * 0.08
        - speech_density * 0.0008
        + (avg_scene_duration.min(8.0) / 8.0) * 0.04
        + (segment_id_stability.min(24.0) / 24.0) * 0.02
        + (scene_id_signal.min(24.0) / 24.0) * 0.02)
        .clamp(0.45, 0.92);

    DirectorPlanOutput { pacing_factor, beat_count, preferred_transition: preferred_transition.to_string(), confidence }
}

// ─── Render Commands ────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_export_dir() -> String {
    if let Some(download_dir) = dirs::download_dir() {
        let export_dir = download_dir.join("StoryFab");
        return export_dir.display().to_string();
    }
    let temp_dir = std::env::temp_dir().join("StoryFab");
    temp_dir.display().to_string()
}

/// Parameters for detect_zcr_bursts command
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectZCRBurstsInput {
    pub audio_path: String,
    pub window_ms: Option<f32>,
    /// ZCR threshold multiplier over mean (default 2.5)
    pub zcr_threshold_mult: Option<f32>,
}

/// Response for ZCR burst detection
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZCRBurstResult {
    pub start_ms: u64,
    pub end_ms: u64,
    /// Ratio of peak ZCR to threshold (score > 1 = burst)
    pub score: f32,
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
pub fn detect_highlights(input: DetectHighlightsInput) -> Result<Vec<crate::highlight_detector::HighlightSegment>, String> {
    if input.video_path.trim().is_empty() {
        return Err("视频路径不能为空".to_string());
    }
    let detector = HighlightDetector::new();
    let options = crate::highlight_detector::HighlightOptions {
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
pub fn detect_smart_segments(
    input: DetectSmartSegmentsInput,
) -> Result<Vec<crate::smart_segmenter::VideoSegment>, String> {
    if input.video_path.trim().is_empty() {
        return Err("视频路径不能为空".to_string());
    }
    let segmenter = SmartSegmenter::new();
    let options = crate::smart_segmenter::SegmentOptions {
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

// ─── TTS (Edge TTS) Commands ─────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct SynthesizeSpeechInput {
    pub text: String,
    pub voice: String,
    pub speed: f32,
    pub format: String,
    pub backend: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SynthesizeSpeechOutput {
    pub audio_path: String,
    pub duration_secs: f64,
}



#[tauri::command]
pub async fn synthesize_speech(
    input: SynthesizeSpeechInput,
) -> Result<SynthesizeSpeechOutput, String> {
    if input.text.trim().is_empty() {
        return Err("Text cannot be empty".to_string());
    }

    // Output path
    let mut tmp_audio = std::env::temp_dir();
    let ext = match input.format.as_str() {
        "wav" | "audio/wav" => "wav",
        "ogg" | "audio/ogg" => "ogg",
        _ => "mp3",
    };
    tmp_audio.push(format!("tts_output_{}.{}", std::process::id(), ext));
    let tmp_audio_path = tmp_audio.display().to_string();

    // Write text to temp file (edge-tts --file flag)
    let mut tmp_text = std::env::temp_dir();
    tmp_text.push(format!("tts_input_{}.txt", std::process::id()));
    let tmp_text_path = tmp_text.display().to_string();
    tokio::fs::write(&tmp_text_path, &input.text)
        .await
        .map_err(|e| format!("Failed to write text file: {e}"))?;

    let mut cmd = tokio::process::Command::new(edge_tts_path());
    let rate = {
        let pct = ((input.speed - 1.0) * 100.0).round() as i32;
        if pct > 0 { format!("+{pct}%") } else { format!("{pct}%") }
    };
    let voice = &input.voice;

    cmd.arg("--file").arg(&tmp_text_path);
    cmd.arg("--voice").arg(voice);
    cmd.arg("--rate").arg(&rate);
    cmd.arg("--write-media").arg(&tmp_audio_path);

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to spawn edge-tts: {e}"))?;

    let _ = tokio::fs::remove_file(&tmp_text_path).await;

    if !output.status.success() {
        return Err(cmd_err("edge-tts failed", &output));
    }

    let metadata = tokio::fs::metadata(&tmp_audio_path)
        .await
        .map_err(|e| format!("Failed to read audio file metadata: {e}"))?;
    let file_size_bytes = metadata.len();

    let duration_secs = match ext {
        "wav" => file_size_bytes as f64 / 32000.0,
        _ => file_size_bytes as f64 / 16000.0,
    };

    Ok(SynthesizeSpeechOutput {
        audio_path: tmp_audio_path,
        duration_secs,
    })
}

#[tauri::command]
pub async fn list_tts_backends() -> Result<Vec<TtsBackendInfo>, String> {
    let mut backends = Vec::new();

    // Check Edge TTS
    let edge_path = edge_tts_path();
    let edge_available = tokio::fs::metadata(edge_path).await.is_ok();
    if edge_available {
        backends.push(TtsBackendInfo {
            name: "edge".into(),
            label: "Microsoft Edge TTS".into(),
            description: "免费，无需 API key，音质好，需要网络".into(),
            requires_network: true,
            requires_model_download: false,
            model_path: None,
        });
    }

    Ok(backends)
}

#[derive(Debug, Serialize)]
pub struct TtsBackendInfo {
    pub name: String,
    pub label: String,
    pub description: String,
    #[serde(rename = "requiresNetwork")]
    pub requires_network: bool,
    #[serde(rename = "requiresModelDownload")]
    pub requires_model_download: bool,
    #[serde(rename = "modelPath")]
    pub model_path: Option<String>,
}

#[tauri::command]
pub async fn translate_text(text: String, from_lang: String, to_lang: String) -> Result<String, String> {
    if text.trim().is_empty() {
        return Err("Text cannot be empty".to_string());
    }

    let langpair = format!("{}|{}", from_lang, to_lang);
    let _langpair = langpair.clone(); // suppress unused warning

    let output = tokio::process::Command::new("curl")
        .arg("-s")
        .arg("-G")
        .arg("--data-urlencode")
        .arg(format!("q={}", text))
        .arg("--data-urlencode")
        .arg(format!("langpair={}", langpair))
        .arg("https://api.mymemory.translated.net/get")
        .output()
        .await
        .map_err(|e| format!("Failed to spawn curl: {e}"))?;

    if !output.status.success() {
        return Err(cmd_err("curl failed", &output));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    #[derive(serde::Deserialize)]
    struct MyMemoryResponse {
        response_data: Option<ResponseData>,
        response_status: Option<i32>,
    }
    #[derive(serde::Deserialize)]
    struct ResponseData {
        translated_text: Option<String>,
    }

    let resp: MyMemoryResponse = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse translation response: {e}"))?;

    if resp.response_status != Some(200) {
        return Err(format!("Translation API error: status {:?}", resp.response_status));
    }

    resp.response_data
        .and_then(|d| d.translated_text)
        .ok_or_else(|| "No translation returned".to_string())
}

#[tauri::command]
pub async fn check_tts_available() -> Result<bool, String> {
    let edge_tts_path = edge_tts_path();
    let output = tokio::process::Command::new(edge_tts_path)
        .arg("--version")
        .output()
        .await
        .map_err(|e| format!("edge-tts not found: {e}"))?;
    Ok(output.status.success())
}
