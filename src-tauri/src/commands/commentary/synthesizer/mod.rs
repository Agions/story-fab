//! Commentary Synthesizer — 解说配音合成子模块

pub mod commands;
pub mod struct_file;
pub mod types;

pub use commands::{estimate_tts_duration, list_commentary_voices, synthesize_commentary_audio};
pub use struct_file::CommentarySynthesizer;
