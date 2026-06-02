//! Commentary Synthesizer — re-export from synthesizer/ submodules
//!
//! `synthesizer/` is a sibling directory of this file, so we declare
//! it as a public module so the rest of the crate can reach its commands
//! via `commands::commentary::commentary_synthesizer::synthesizer::*`.

pub mod synthesizer;

pub use synthesizer::commands::{estimate_tts_duration, list_commentary_voices, synthesize_commentary_audio};
pub use synthesizer::types::{SynthesizeOptions, SynthesizeResult, VoiceInfo};