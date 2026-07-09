//! Commentary Pipeline — Orchestration module
//!
//! Exposes the `run_commentary_pipeline` Tauri command and the three
//! phase orchestrator functions (director / script / synthesize).

pub mod commands;
pub mod director;
pub mod script;
pub mod synthesize;
pub mod types;

// Re-export the primary types and the command entry point so that
// `commands::commentary::pipeline::run_commentary_pipeline` and the DTOs
// are easily accessible from outside this module.
pub use commands::run_commentary_pipeline;
pub use types::{
    AudioSegmentResult, CommentaryPipelineInput, CommentaryPipelineOutput,
    PipelineErrorPayload, PipelineProgressPayload, PipelineStage,
};
