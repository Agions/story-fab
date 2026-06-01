// Video processing module — split from video_processor.rs
// Submodules: processor, metadata, keyframes, thumbnail,
//            ffmpeg_cmd, mix_audio, audio_duration

mod metadata;
mod keyframes;
mod thumbnail;
mod processor;
pub mod ffmpeg_cmd;
pub mod mix_audio;
pub mod audio_duration;

pub use processor::VideoProcessor;
pub use metadata::probe_metadata;
pub use keyframes::extract_keyframes_impl;
pub use thumbnail::generate_thumbnail_impl;
pub use ffmpeg_cmd::cut_video;
pub use mix_audio::{mix_audio, MixAudioInput};
pub use audio_duration::get_audio_duration;
