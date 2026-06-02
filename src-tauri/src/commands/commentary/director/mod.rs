//! AI Director — multi-step state machine that analyzes a video and
//! generates a narration plan (style, segments, render specs).
//!
//! ## Module structure
//! - `types.rs`     — DirectorPlan, DirectorState, request/response DTOs
//! - `state_ops.rs` — pure helpers: build_plan, parse_style, apply_modifications
//! - `states.rs`    — thread-safe state map (`DIRECTOR_STATES`) + mutators
//! - `commands.rs`  — 8 Tauri command handlers (#[tauri::command])
//!
//! `super::script_generator::ScriptGeneratorOutput` is reached from
//! this module via `super::super::script_generator` in types.rs.

pub mod commands;
pub mod state_ops;
pub mod states;
pub mod types;

pub use commands::{
    approve_director_plan, complete_director_render, create_director_session,
    destroy_director_session, generate_director_plan, get_director_status,
    revise_director_plan, start_director_analysis,
};
pub use types::{
    ContentRating, DirectorPlan, DirectorState, DirectorStateMachine, DirectorStatusResponse,
    EmotionPoint, PlanModifications, ScriptStylePreset, SegmentMode, VideoAnalysisResult,
    VideoType,
};
