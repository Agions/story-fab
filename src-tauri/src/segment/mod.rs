//! Smart video segmentation module — split from smart_segmenter.rs
//! Files: types.rs, energy.rs, scene.rs, classifier.rs, segmenter.rs, mod.rs

mod types;
mod energy;
mod scene;
mod classifier;
mod segmenter;

pub mod classifier;

pub use types::{SegmentOptions, SegmentType, VideoSegment};
pub use segmenter::SmartSegmenter;
pub use scene::SceneSegmenter;
pub use classifier::SegmentClassifier;