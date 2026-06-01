//! Whisper subtitle transcription module — split from subtitle.rs
//! Files: types.rs, whisper.rs, transcribe.rs, mod.rs

mod types;
mod whisper;
mod transcribe;

pub use types::{SubtitleResult, SubtitleSegment, TranscribeProgress, WhisperModelInfo, WhisperWord, WHISPER_LANGS};
pub use whisper::{check_faster_whisper, download_whisper_model, get_whisper_supported_languages, list_whisper_models};
pub use transcribe::transcribe_audio;

pub use types::TranscribeProgress as _;
