//! Commentary Synthesizer — Tauri command re-exports
//!
//! This module is a thin re-export layer. The actual synthesis
//! implementation lives in the sibling `synthesizer/` directory
//! (`commands::commentary::synthesizer::*`). We re-export the
//! #[tauri::command] functions and supporting types here so
//! `commands::commentary::commentary_synthesizer::*` paths work
//! as a stable public API for the rest of the crate.

pub use crate::commands::commentary::synthesizer::commands::{
    estimate_tts_duration, list_commentary_voices, synthesize_commentary_audio,
};
pub use crate::commands::commentary::synthesizer::struct_file::CommentarySynthesizer;
pub use crate::commands::commentary::synthesizer::types::{
    SynthesizeOptions, SynthesizeResult, VoiceInfo,
};
