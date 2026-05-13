//! Render command modules
//!
//! Split from the monolithic render.rs for maintainability:
//! - `transcode.rs`     — Aspect-ratio cropping / quality transcoding
//! - `autonomous_cut.rs` — AI-driven multi-segment autonomous cut
//! - `preview.rs`       — Quick preview generation

pub mod autonomous_cut;
pub mod preview;
pub mod transcode;

pub use autonomous_cut::render_autonomous_cut;
pub use preview::generate_preview;
pub use transcode::{export_video, transcode_with_crop};