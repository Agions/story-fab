use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH, Instant};

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

/// Returns timestamp with random suffix to avoid collisions (for temp file names)
static TS_COUNTER: AtomicU64 = AtomicU64::new(0);

pub fn chrono_like_timestamp() -> String {
    let ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    // Counter ensures uniqueness even on sub-ms rapid retries
    let counter = TS_COUNTER.fetch_add(1, Ordering::Relaxed);
    let nano = Instant::now().elapsed().as_nanos() as u64;
    // Mix counter + nanoseconds into rand bits (not crypto-strong, just collision-resistant)
    let rand = (ms ^ counter ^ nano) & 0xffffff_u64;
    format!("{:x}_{:06x}", ms, rand)
}

/// Extract first line from command output (stdout, fallback to stderr)
pub fn cmd_first_line(out: &std::process::Output) -> Option<String> {
    String::from_utf8_lossy(&out.stdout)
        .lines()
        .next()
        .map(|s| s.to_string())
        .or_else(|| String::from_utf8_lossy(&out.stderr).lines().next().map(|s| s.to_string()))
}

/// Build error string from failed command
pub fn cmd_err(msg: &str, out: &std::process::Output) -> String {
    format!("{}: {}", msg, String::from_utf8_lossy(&out.stderr))
}

pub(crate) fn format_srt_time(seconds: f64) -> String {
    let total_ms = (seconds * 1000.0).round() as u64;
    let hours = total_ms / 3_600_000;
    let minutes = (total_ms % 3_600_000) / 60_000;
    let secs = (total_ms % 60_000) / 1000;
    let millis = total_ms % 1000;
    format!("{:02}:{:02}:{:02},{:03}", hours, minutes, secs, millis)
}
