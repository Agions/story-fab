//! Director state operations — extracted from commands.rs for line count control
//! commands.rs will call these helpers, staying under 200 lines

use super::types::{
    DirectorPlan, DirectorState, PlanModifications, ScriptStylePreset, SegmentMode,
};

/// Parse style string to ScriptStylePreset
pub fn parse_style(style: Option<String>) -> ScriptStylePreset {
    style
        .and_then(|s| match s.as_str() {
            "humorous" => Some(ScriptStylePreset::Humorous),
            "serious" => Some(ScriptStylePreset::Serious),
            "conversational" => Some(ScriptStylePreset::Conversational),
            "suspense" => Some(ScriptStylePreset::Suspense),
            "warm" => Some(ScriptStylePreset::Warm),
            _ => None,
        })
        .unwrap_or(ScriptStylePreset::Humorous)
}

/// Build a DirectorPlan from current analysis + style + target_duration
pub fn build_plan(
    style: ScriptStylePreset,
    target_duration_secs: Option<f64>,
    analysis: &Option<crate::commands::commentary::director::types::VideoAnalysisResult>,
) -> DirectorPlan {
    let summary = analysis
        .as_ref()
        .map(|a| a.summary.clone())
        .unwrap_or_else(|| "视频内容分析中...".to_string());

    DirectorPlan {
        id: uuid_simple(),
        summary,
        angle: analysis
            .as_ref()
            .map(|a| a.recommended_angle.clone())
            .unwrap_or_else(|| "剧情解说".to_string()),
        target_audience: analysis
            .as_ref()
            .and_then(|a| a.target_audience.clone()),
        target_duration_secs: target_duration_secs.unwrap_or(120.0),
        estimated_segments: 5,
        segment_mode: SegmentMode::OriginalAudio,
        recommended_voice: default_voice_for_style(style),
        key_points: analysis
            .as_ref()
            .map(|a| a.highlights.clone())
            .unwrap_or_default(),
        warnings: vec![],
        confidence: 0.75,
    }
}

/// Apply user modifications to a plan, return (updated_plan, confidence_delta)
pub fn apply_modifications(
    plan: &mut super::types::DirectorPlan,
    modifications: PlanModifications,
) {
    if let Some(duration) = modifications.target_duration_secs {
        plan.target_duration_secs = duration;
    }
    if let Some(a) = modifications.angle {
        plan.angle = a;
    }
    if let Some(segments) = modifications.segment_mode {
        plan.segment_mode = segments;
    }
    if let Some(v) = modifications.recommended_voice {
        plan.recommended_voice = v;
    }
    plan.confidence = (plan.confidence + 0.05).min(0.95);
}

/// Progress percentage for a given DirectorState
pub fn progress_for_state(state: DirectorState) -> f64 {
    match state {
        DirectorState::Idle => 0.0,
        DirectorState::Analyzing => 0.2,
        DirectorState::Planning => 0.4,
        DirectorState::Ready => 0.6,
        DirectorState::Rendering => 0.8,
        DirectorState::Done => 1.0,
    }
}

/// Lightweight UUID-like identifier (uses rand-free, time-based encoding).
pub fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let pid = std::process::id();
    format!("plan-{nanos:x}-{pid:x}")
}

/// Default voice name for a given style.
pub fn default_voice_for_style(style: ScriptStylePreset) -> String {
    match style {
        ScriptStylePreset::Humorous => "zh-CN-YunxiNeural".to_string(),
        ScriptStylePreset::Serious => "zh-CN-YunjianNeural".to_string(),
        ScriptStylePreset::Conversational => "zh-CN-YunyangNeural".to_string(),
        ScriptStylePreset::Suspense => "zh-CN-YunxiNeural".to_string(),
        ScriptStylePreset::Warm => "zh-CN-XiaoxiaoNeural".to_string(),
    }
}
