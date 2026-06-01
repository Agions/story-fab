// Video processing module — split from video_processor.rs
// Single-responsibility files: processor, ffmpeg_cmd, mix_audio, audio_duration

mod processor;
pub mod ffmpeg_cmd;
pub mod mix_audio;
pub mod audio_duration;

pub use processor::VideoProcessor;
pub use ffmpeg_cmd::cut_video;
pub use mix_audio::{mix_audio, MixAudioInput};
pub use audio_duration::get_audio_duration;
