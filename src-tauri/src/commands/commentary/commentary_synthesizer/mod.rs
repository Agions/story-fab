//! Commentary Synthesizer — re-export from synthesizer/ submodules
//!
//! `synthesizer/` lives in the parent `commands::commentary` directory,
//! so we reach it via `super::synthesizer` and re-export the
//! #[tauri::command] functions + types so the rest of the crate can
//! access them as `commands::commentary::commentary_synthesizer::*`.

pub use super::synthesizer::commands::{
    estimate_tts_duration, list_commentary_voices, synthesize_commentary_audio,
};
pub use super::synthesizer::types::{SynthesizeOptions, SynthesizeResult, VoiceInfo};
pub use super::synthesizer::struct_file::CommentarySynthesizer;
