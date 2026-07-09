//! Resilience — backward-compatible re-export module.
//!
//! The original `resilience.rs` has been split into:
//! - `panic_hook.rs` — panic hook installation
//! - `semaphore.rs` — ResourceLimiter and ResourceError
//! - `crash_recovery.rs` — crash report management
//!
//! This module preserves the public API so existing `crate::utils::resilience::*`
//! imports continue to work without changes.

pub use crate::utils::crash_recovery::crash_dir_path;
pub use crate::utils::panic_hook::install_panic_hook;
pub use crate::utils::semaphore::{
    resource_error_to_user_message, ResourceError, ResourceLimiter,
};
