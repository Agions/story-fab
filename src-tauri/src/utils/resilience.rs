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
use std::sync::{Arc, OnceLock};
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
fn shared_semaphore() -> &'static Arc<Semaphore> {
    static SEM: OnceLock<Arc<Semaphore>> = OnceLock::new();
    SEM.get_or_init(|| {
        let permits = default_permits();
        tracing::info!(
            "[resilience] resource limiter initialized with {} permits (cpus={})",
            permits,
            std::thread::available_parallelism()
                .map(|n| n.get())
                .unwrap_or(0)
        );
        Arc::new(Semaphore::new(permits))
    })
}

/// Cheap, clone-friendly handle to a `Semaphore`-backed limiter.
///
/// Two ways to obtain a handle:
///   - [`ResourceLimiter::shared`] — handle to the process-wide
///     shared limiter. This is what production code (Tauri commands,
///     pipelines) should use so all heavy work participates in the
///     global permit pool.
///   - [`ResourceLimiter::with_capacity`] — create an **independent**
///     limiter backed by a private `Semaphore`. Primarily for tests
///     that need isolation from the shared state.
#[derive(Clone)]
pub struct ResourceLimiter {
    sem: Arc<Semaphore>,
    total: usize,
}

impl ResourceLimiter {
    /// Handle to the process-wide shared limiter. All calls share the
    /// same underlying `Semaphore` (lazily constructed on first use).
    pub fn shared() -> Self {
        let sem = shared_semaphore().clone();
        Self {
            sem,
            // total is resolved lazily — see `total_permits()`.
            total: 0,
        }
    }

    /// Create an **independent** limiter with a specific permit count.
    ///
    /// This is primarily for **tests** that need isolation from the
    /// shared process-wide limiter. Production code should use
    /// [`ResourceLimiter::shared`] to participate in the global pool.
    pub fn with_capacity(permits: usize) -> Self {
        let permits = permits.max(1);
        Self {
            sem: Arc::new(Semaphore::new(permits)),
            total: permits,
        }
    }
}

impl ResourceLimiter {
    /// Acquire a permit. Returns [`ResourceError::ShuttingDown`] if the
    /// semaphore has been closed (which would indicate the runtime is
    /// already in a broken state).
    pub async fn acquire(&self) -> Result<SemaphorePermit<'_>, ResourceError> {
        self.sem
            .acquire()
            .await
            .map_err(|_| ResourceError::ShuttingDown)
    }

    /// Try to acquire a permit without waiting. Useful when a command has
    /// a cheap fallback path (e.g. "all permits busy → return busy error
    /// to the user instead of queueing forever").
    pub fn try_acquire(&self) -> Option<SemaphorePermit<'_>> {
        self.sem.try_acquire().ok()
    }

    /// Number of permits currently available (for diagnostics / dashboards).
    pub fn available_permits(&self) -> usize {
        self.sem.available_permits()
    }

    /// Total permits this limiter was configured with.
    ///
    /// - For handles created via [`ResourceLimiter::shared`] this is
    ///   resolved from a process-wide `OnceLock` (re-reads
    ///   `STORYFAB_RESOURCE_PERMITS` / cpus on first call, then cached).
    /// - For handles created via [`ResourceLimiter::with_capacity(n)]`
    ///   the configured `n` is returned directly. No env / cpus lookup.
    pub fn total_permits(&self) -> usize {
        if self.total > 0 {
            return self.total;
        }
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
        // Two handles to the SAME (independent) limiter share the underlying
        // semaphore. Acquire on one is visible to the other.
        let a = ResourceLimiter::with_capacity(3);
        let b = a.clone();
        let total_before = a.available_permits();
        let permit = a.try_acquire();
        assert!(permit.is_some(), "expected to acquire a permit on idle limiter");
        assert_eq!(b.available_permits(), total_before - 1);
        drop(permit);
        assert_eq!(b.available_permits(), total_before);
    }

    #[test]
    fn permit_released_on_drop() {
        let l = ResourceLimiter::with_capacity(3);
        let total = l.total_permits();
        {
            let p = l.try_acquire().expect("idle limiter must yield a permit");
            assert_eq!(l.available_permits(), total - 1);
            drop(p);
        }
        assert_eq!(l.available_permits(), total);
    }

    #[test]
    fn try_acquire_saturates() {
        // Exercise the "pool exhaustion" guarantee with a private limiter
        // so we can assert exact counts without flakes from the shared pool.
        let l = ResourceLimiter::with_capacity(3);
        let total = l.total_permits();
        assert_eq!(total, 3);

        // Hold every permit.
        let mut held = Vec::with_capacity(total);
        for _ in 0..total {
            held.push(
                l.try_acquire()
                    .expect("permit must be available while pool is not exhausted"),
            );
        }
        // Pool is now empty.
        assert!(
            l.try_acquire().is_none(),
            "try_acquire must return None after exhausting the pool"
        );
        // Release. The private limiter has no other consumers, so the count
        // is exactly the original total.
        held.clear();
        assert_eq!(l.available_permits(), total);
    }

    #[test]
    fn independent_limiters_do_not_share_state() {
        // Two limiters with the same capacity must still be independent
        // (each has its own permit pool). Exhausting one must not affect
        // the other. This is the property that lets tests be run in
        // parallel without cross-test pollution.
        let a = ResourceLimiter::with_capacity(2);
        let b = ResourceLimiter::with_capacity(2);
        let _pa1 = a.try_acquire().unwrap();
        let _pa2 = a.try_acquire().unwrap();
        assert!(a.try_acquire().is_none(), "a must be exhausted");
        assert_eq!(b.available_permits(), 2, "b must be untouched");
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
        let l = ResourceLimiter::with_capacity(3);
        let total = l.total_permits();
        let permit = l.acquire().await.expect("acquire must succeed");
        assert_eq!(l.available_permits(), total - 1);
        drop(permit);
        assert_eq!(l.available_permits(), total);
    }
}
