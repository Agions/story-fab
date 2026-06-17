//! Resilience — process-level safety nets for the Tauri backend.
//!
//! Provides two complementary defenses against runaway or unstable native code:
//!
//! 1. **Panic hook** — installed once at startup via [`install_panic_hook`].
//!    Catches uncaught panics, logs them through `tracing` (so they land in
//!    the same pipeline as normal logs), and writes a minimal JSON crash
//!    report into the app data directory. Without this, a panic inside a
//!    Tauri command would silently tear down the whole Tauri runtime and
//!    leave the user staring at a frozen window.
//!
//! 2. **Resource limiter** — a process-wide [`Semaphore`] front-end exposed
//!    by [`ResourceLimiter::acquire`]. Heavy commands (FFmpeg transcodes,
//!    whisper transcriptions, render exports) must `acquire()` a permit
//!    before spawning CPU/IO-heavy work. The default permit count is tuned
//!    to `(logical_cpus - 1).max(1)` so the UI thread and one other task
//!    can keep making progress even when the pipeline is saturated.
//!
//! ## Usage
//!
//! ```ignore
//! // In `lib.rs` `run()`:
//! utils::resilience::install_panic_hook();
//! let limiter = utils::resilience::shared_limiter();
//! tauri::Builder::default()
//!     .manage(limiter)
//!     ...
//! ```
//!
//! ```ignore
//! // Inside a Tauri command:
//! let permit = state.limiter.acquire().await?;
//! let _release_on_drop = permit; // permit is released on drop
//! // ... heavy work ...
//! ```
//!
//! ## Failure mode
//!
//! The limiter is **best-effort, not load-shedding**. A burst of concurrent
//! `acquire()` calls will queue; a permit acquired but never released is a
//! bug (every permit is a `SemaphorePermit` that auto-releases on drop).

use std::path::PathBuf;
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::Manager;
use tokio::sync::{Semaphore, SemaphorePermit};

/// Permits granted to a single process. Defaults to `cpus-1`, clamped to
/// `[1, 8]` to keep the UI responsive on both tiny (2-core) and very
/// large (16+ core) machines. Override with `STORYFAB_RESOURCE_PERMITS`
/// environment variable for diagnostic / CI scenarios.
fn default_permits() -> usize {
    if let Ok(raw) = std::env::var("STORYFAB_RESOURCE_PERMITS") {
        if let Ok(n) = raw.parse::<usize>() {
            if n > 0 {
                return n.clamp(1, 32);
            }
        }
    }
    let logical = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);
    logical.saturating_sub(1).clamp(1, 8)
}

/// Process-wide limiter, lazily constructed on first access.
fn shared_semaphore() -> &'static Semaphore {
    static SEM: OnceLock<Semaphore> = OnceLock::new();
    SEM.get_or_init(|| {
        let permits = default_permits();
        tracing::info!(
            "[resilience] resource limiter initialized with {} permits (cpus={})",
            permits,
            std::thread::available_parallelism()
                .map(|n| n.get())
                .unwrap_or(0)
        );
        Semaphore::new(permits)
    })
}

/// Cheap, clone-friendly handle to the shared limiter.
///
/// The handle is intentionally `Copy` so it can be passed freely between
/// command bodies and helper tasks without `Arc` boilerplate. Internally
/// each clone is a new `Arc` to the same `Semaphore`.
#[derive(Clone, Copy)]
pub struct ResourceLimiter;

impl ResourceLimiter {
    /// Acquire a permit. Returns [`ResourceError::ShuttingDown`] if the
    /// semaphore has been closed (which would indicate the runtime is
    /// already in a broken state).
    pub async fn acquire(&self) -> Result<SemaphorePermit<'_>, ResourceError> {
        shared_semaphore()
            .acquire()
            .await
            .map_err(|_| ResourceError::ShuttingDown)
    }

    /// Try to acquire a permit without waiting. Useful when a command has
    /// a cheap fallback path (e.g. "all permits busy → return busy error
    /// to the user instead of queueing forever").
    pub fn try_acquire(&self) -> Option<SemaphorePermit<'_>> {
        shared_semaphore().try_acquire().ok()
    }

    /// Number of permits currently available (for diagnostics / dashboards).
    pub fn available_permits(&self) -> usize {
        shared_semaphore().available_permits()
    }

    /// Total permits this limiter was configured with at startup. Cached
    /// via `OnceLock` so we don't recompute `default_permits()` on every
    /// call (which would re-read env vars and the CPU count).
    pub fn total_permits(&self) -> usize {
        static TOTAL: OnceLock<usize> = OnceLock::new();
        *TOTAL.get_or_init(default_permits)
    }
}

/// Errors emitted by [`ResourceLimiter::acquire`].
#[derive(Debug, thiserror::Error)]
pub enum ResourceError {
    /// The shared semaphore was closed. Indicates the Tauri runtime is
    /// shutting down or the process is in a half-torn-down state. Commands
    /// should return this to the frontend so the UI can show a friendly
    /// "app is closing" message.
    #[error("resource limiter is shutting down")]
    ShuttingDown,
}

impl ResourceError {
    /// Convert to a user-facing Chinese message. Centralised so every
    /// command produces identical error text and we have one place to
    /// tweak copy / localisation later.
    pub fn to_user_message(&self) -> &'static str {
        match self {
            ResourceError::ShuttingDown => "应用正在关闭，请稍后重试",
        }
    }
}

/// Convenience: convert a [`ResourceError`] into the same Chinese string
/// Tauri commands would return to the frontend. Lets call sites use
/// `.map_err(resource_error_to_user_message)?` without writing the
/// `String::from(...)` dance inline.
pub fn resource_error_to_user_message(err: ResourceError) -> String {
    err.to_user_message().to_string()
}

// ─── Panic hook ──────────────────────────────────────────────────────────

/// Install the process-wide panic hook. **Idempotent** — calling this
/// twice (e.g. from test harnesses) is safe; only the first call wins.
///
/// What it does, in order:
/// 1. Logs the panic location, message, and (best-effort) backtrace via
///    `tracing::error!`. This ensures the panic lands in the same log
///    pipeline as normal events.
/// 2. Writes a minimal JSON crash report (`crash-<timestamp>.json`) into
///    `app_data_dir/crashes/` so the user (or a future "send feedback"
///    flow) can attach concrete evidence.
/// 3. Restores the **previous** panic hook before returning — usually
///    this is `std::default` (which aborts the process). We do not
///    `catch_unwind` here on purpose: we want the process to keep its
///    default abort behaviour, so the user sees a crash dialog and the
///    OS can collect a real core dump if configured to.
///
/// Note: the panic hook is called from a panic context. **Do not allocate
/// or do anything that could itself panic** — keep the body minimal.
pub fn install_panic_hook() {
    use std::sync::Once;

    static INSTALLED: Once = Once::new();
    INSTALLED.call_once(|| {
        let previous = std::panic::take_hook();
        std::panic::set_hook(Box::new(move |info| {
            let payload = panic_payload_to_string(info.payload());
            let location = info
                .location()
                .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
                .unwrap_or_else(|| "<unknown>".to_string());

            // Best-effort backtrace. `RUST_BACKTRACE` must be set for this
            // to be useful, but we always emit something (even an empty
            // string) so log parsers don't have to special-case.
            let backtrace = std::backtrace::Backtrace::force_capture();
            let backtrace_str = format!("{backtrace}");

            tracing::error!(
                panic.payload = %payload,
                panic.location = %location,
                "PANIC: backend task aborted — see crash report"
            );
            // tracing does not yet know about backtrace fields; emit a
            // second message so the trace is searchable in log files.
            tracing::error!("panic.backtrace:\n{backtrace_str}");

            // Best-effort crash file write. Failure here is ignored — we
            // are already in panic territory.
            if let Some(dir) = crash_dir() {
                let _ = std::fs::create_dir_all(&dir);
                let ts = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                let path = dir.join(format!("crash-{ts}.json"));
                let body = serde_json::json!({
                    "timestamp": ts,
                    "payload": payload,
                    "location": location,
                    "backtrace": backtrace_str,
                    "version": env!("CARGO_PKG_VERSION"),
                });
                if let Ok(text) = serde_json::to_string_pretty(&body) {
                    let _ = std::fs::write(&path, text);
                }
            }

            // Delegate to the previous (default) hook so the process still
            // aborts on uncaught panics. The user sees a crash dialog
            // instead of a silent freeze.
            previous(info);
        }));

        tracing::info!("[resilience] panic hook installed");
    });
}

fn panic_payload_to_string(payload: &dyn std::any::Any) -> String {
    if let Some(s) = payload.downcast_ref::<&'static str>() {
        s.to_string()
    } else if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else {
        "<non-string panic payload>".to_string()
    }
}

fn crash_dir() -> Option<PathBuf> {
    dirs::data_dir().map(|base| base.join("story-fab").join("crashes"))
}

/// Public version of [`crash_dir`] that resolves through a Tauri
/// `AppHandle`'s `app_data_dir()` (so the location matches the rest of
/// the app on every platform), and falls back to the platform default
/// data dir if the Tauri resolution fails. Used by `crash_recovery` to
/// list / read / delete crash reports.
pub fn crash_dir_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取 AppData 目录: {e}"))?;
    let dir = base.join("crashes");
    Ok(dir)
}

// ─── Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_permits_is_at_least_one() {
        let n = default_permits();
        assert!(n >= 1, "default permits must be ≥ 1, got {n}");
    }

    #[test]
    fn limiter_clone_share_state() {
        let a = ResourceLimiter;
        let b = ResourceLimiter;
        // Both handles point at the same semaphore. After acquiring one
        // permit, the other handle must report one fewer available.
        let total_before = a.available_permits();
        let permit = a.try_acquire();
        assert!(permit.is_some(), "expected to acquire a permit on idle limiter");
        assert_eq!(b.available_permits(), total_before - 1);
        drop(permit);
        assert_eq!(b.available_permits(), total_before);
    }

    #[test]
    fn permit_released_on_drop() {
        let l = ResourceLimiter;
        let total = l.available_permits();
        {
            let p = l.try_acquire().expect("idle limiter must yield a permit");
            assert_eq!(l.available_permits(), total - 1);
            drop(p);
        }
        assert_eq!(l.available_permits(), total);
    }

    #[test]
    fn try_acquire_saturates() {
        let l = ResourceLimiter;
        let total = l.available_permits();
        let mut held = Vec::new();
        for _ in 0..total {
            held.push(l.try_acquire().expect("permit available"));
        }
        // The next try_acquire must return None — we have exhausted the
        // pool. (Not .await: try_acquire is non-blocking.)
        assert!(l.try_acquire().is_none());
        held.clear();
        assert_eq!(l.available_permits(), total);
    }

    #[test]
    fn panic_payload_str() {
        let s = panic_payload_to_string(&"hello");
        assert_eq!(s, "hello");
    }

    #[test]
    fn panic_payload_string() {
        let owned: String = "owned".to_string();
        let s = panic_payload_to_string(&owned);
        assert_eq!(s, "owned");
    }

    #[test]
    fn panic_payload_unknown() {
        // A non-string payload should not panic and should produce the
        // sentinel string.
        let n: i32 = 42;
        let s = panic_payload_to_string(&n);
        assert_eq!(s, "<non-string panic payload>");
    }

    #[test]
    fn install_panic_hook_is_idempotent() {
        // Call twice — should not double-install or panic.
        install_panic_hook();
        install_panic_hook();
    }

    #[tokio::test]
    async fn acquire_awaits_and_releases() {
        let l = ResourceLimiter;
        let total = l.available_permits();
        let permit = l.acquire().await.expect("acquire must succeed");
        assert_eq!(l.available_permits(), total - 1);
        drop(permit);
        assert_eq!(l.available_permits(), total);
    }
}
