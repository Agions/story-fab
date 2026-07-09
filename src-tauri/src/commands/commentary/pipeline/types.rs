//! Commentary Pipeline — Types
//!
//! Defines all DTOs for the `run_commentary_pipeline` orchestration command:
//! input, output, event payloads, and the stage enum.

use serde::{Deserialize, Serialize};

// Re-export existing types so callers inside the pipeline module can use
// `crate::commands::commentary::pipeline::types::DirectorPlan` etc.
pub use crate::commands::commentary::director::types::DirectorPlan;
pub use crate::commands::commentary::script_generator::types::{
    ScriptGeneratorOutput, ScriptSegment,
};
pub use crate::commands::commentary::synthesizer::types::SynthesizeResult;

// ─── Stage Enum ──────────────────────────────────────────────────────────────

/// Pipeline stage identifiers (used in progress / error events).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PipelineStage {
    Director,
    Script,
    Synthesize,
}

impl std::fmt::Display for PipelineStage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PipelineStage::Director => write!(f, "director"),
            PipelineStage::Script => write!(f, "script"),
            PipelineStage::Synthesize => write!(f, "synthesize"),
        }
    }
}

// ─── Event Payloads ──────────────────────────────────────────────────────────

/// Payload for `pipeline-progress` events.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineProgressPayload {
    pub stage: String,
    pub progress: f64,
    pub message: Option<String>,
}

/// Payload for `pipeline-error` events.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineErrorPayload {
    pub stage: String,
    pub error: String,
}

// ─── Pipeline Input / Output ─────────────────────────────────────────────────

/// Input passed from the frontend to `run_commentary_pipeline`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentaryPipelineInput {
    pub session_id: String,
    pub video_path: String,
    pub subtitles: String,
    pub style: Option<String>,                // kebab-case, e.g. "conversational"
    pub target_duration_secs: Option<f64>,
    pub api_key: String,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub base_url: Option<String>,
    pub voice: Option<String>,
    pub speed: Option<f32>,
    pub auto_approve: Option<bool>,
}

/// Output returned from `run_commentary_pipeline`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentaryPipelineOutput {
    pub director_plan: DirectorPlan,
    pub script: ScriptGeneratorOutput,
    pub audio_segments: Vec<AudioSegmentResult>,
    pub total_audio_duration_secs: f64,
}

/// Per-segment audio synthesis result collected during the Synthesize phase.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioSegmentResult {
    pub text: String,
    pub audio_path: String,
    pub duration_secs: f64,
    pub segment_index: usize,
}

// ─── Style Mapping Helpers ───────────────────────────────────────────────────

/// Map a kebab-case style string to the Director's `ScriptStylePreset`.
pub fn parse_style_for_director(style: Option<&str>) -> crate::commands::commentary::director::types::ScriptStylePreset {
    match style.and_then(|s| match s {
        "humorous" => Some(crate::commands::commentary::director::types::ScriptStylePreset::Humorous),
        "serious" => Some(crate::commands::commentary::director::types::ScriptStylePreset::Serious),
        "conversational" => Some(crate::commands::commentary::director::types::ScriptStylePreset::Conversational),
        "suspense" => Some(crate::commands::commentary::director::types::ScriptStylePreset::Suspense),
        "warm" => Some(crate::commands::commentary::director::types::ScriptStylePreset::Warm),
        _ => None,
    }) {
        Some(s) => s,
        None => crate::commands::commentary::director::types::ScriptStylePreset::default(),
    }
}

/// Map a kebab-case style string to the Script Generator's `ScriptStyle`.
pub fn parse_style_for_script(style: Option<&str>) -> crate::commands::commentary::script_generator::types::ScriptStyle {
    match style.and_then(|s| match s {
        "humorous" => Some(crate::commands::commentary::script_generator::types::ScriptStyle::Humorous),
        "serious" => Some(crate::commands::commentary::script_generator::types::ScriptStyle::Serious),
        "conversational" => Some(crate::commands::commentary::script_generator::types::ScriptStyle::Conversational),
        "suspense" => Some(crate::commands::commentary::script_generator::types::ScriptStyle::Suspense),
        "warm" => Some(crate::commands::commentary::script_generator::types::ScriptStyle::Warm),
        _ => None,
    }) {
        Some(s) => s,
        None => crate::commands::commentary::script_generator::types::ScriptStyle::default(),
    }
}
