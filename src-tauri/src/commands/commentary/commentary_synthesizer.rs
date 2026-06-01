//! Commentary Synthesizer — re-export from synthesizer/ submodules

pub mod synthesizer;

pub use synthesizer::{CommentarySynthesizer, list_voices};
pub use synthesizer::commands::{estimate_tts_duration, list_commentary_voices, synthesize_commentary_audio};
pub use synthesizer::types::{SynthesizeOptions, SynthesizeResult, VoiceInfo};