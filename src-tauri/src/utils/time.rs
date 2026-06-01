//! Timestamp and time formatting utilities

use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH, Instant};

/// Parse a string like "30/1" or "29.97" into f64 seconds (frame rate parsing).
pub fn parse_fraction(value: &str) -> f64 {
    if let Some((num, den)) = value.split_once('/') {
        let n = num.parse::<f64>().unwrap_or(0.0);
        let d = den.parse::<f64>().unwrap_or(1.0);
        if d.abs() > f64::EPSILON {
            return n / d;
        }
        return 0.0;
    }
    value.parse::<f64>().unwrap_or(0.0)
}

/// Returns timestamp with random suffix to avoid collisions (for temp file names).
static TS_COUNTER: AtomicU64 = AtomicU64::new(0);

pub fn chrono_like_timestamp() -> String {
    let ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let counter = TS_COUNTER.fetch_add(1, Ordering::Relaxed);
    let nano = Instant::now().elapsed().as_nanos() as u64;
    let rand = (ms ^ counter ^ nano) & 0xffffff_u64;
    format!("{:x}_{:06x}", ms, rand)
}

/// Format seconds as HH:MM:SS.mmm (dot separator, used by FFmpeg).
pub(crate) fn format_time(seconds: f64) -> String {
    let total_ms = (seconds * 1000.0).round() as u64;
    let hours = total_ms / 3_600_000;
    let minutes = (total_ms % 3_600_000) / 60_000;
    let secs = (total_ms % 60_000) / 1000;
    let millis = total_ms % 1000;
    format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, millis)
}

/// Format seconds as SRT subtitle time: HH:MM:SS,mmm
pub(crate) fn format_srt_time(seconds: f64) -> String {
    let total_ms = (seconds * 1000.0).round() as u64;
    let hours = total_ms / 3_600_000;
    let minutes = (total_ms % 3_600_000) / 60_000;
    let secs = (total_ms % 60_000) / 1000;
    let millis = total_ms % 1000;
    format!("{:02}:{:02}:{:02},{:03}", hours, minutes, secs, millis)
}