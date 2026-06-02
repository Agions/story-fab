//! Commentary Synthesizer — 解说配音合成子模块

pub mod commands;
pub mod synthesizer;
pub mod types;

pub use commands::{estimate_tts_duration, list_commentary_voices, synthesize_commentary_audio};
pub use synthesizer::CommentarySynthesizer;