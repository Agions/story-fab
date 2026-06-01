// Highlight detection module — split from highlight_detector.rs
// Files: types.rs, audio_analysis.rs, scene_detect.rs, combiner.rs, energy.rs, zcr.rs, mod.rs

mod types;
mod audio_analysis;
mod scene_detect;
mod combiner;
mod energy;
mod zcr;

pub mod combiner;

pub use types::{HighlightOptions, HighlightReason, HighlightSegment};
pub use audio_analysis::HighlightDetector;
pub use scene_detect::SceneDetector;
pub use combiner::get_highlights;