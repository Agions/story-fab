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

/// Format seconds as HH:MM:SS.mmm (dot separator, used by FFmpeg/lib_optimized)
pub(crate) fn format_time(seconds: f64) -> String {
    let total_ms = (seconds * 1000.0).round() as u64;
    let hours = total_ms / 3_600_000;
    let minutes = (total_ms % 3_600_000) / 60_000;
    let secs = (total_ms % 60_000) / 1000;
    let millis = total_ms % 1000;
    format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, millis)
}

/// Convert s16le PCM bytes to normalized f32 samples.
/// Uses `chunks(2)` (not `_exact`) to safely drop any trailing partial chunk.
pub fn pcm_samples_from_wav(pcm_data: &[u8]) -> Vec<f32> {
    pcm_data
        .chunks(2)
        .map(|chunk| {
            let s16 = i16::from_le_bytes([chunk[0], chunk[1]]);
            s16 as f32 / 32768.0
        })
        .collect()
}

/// Parse FFmpeg scdet stderr output, returning Vec of (time_ms, score).
pub fn parse_scdet_output(stderr: &str) -> Vec<(u64, f32)> {
    let mut scene_changes = Vec::new();
    for line in stderr.lines() {
        if line.contains("[scdet]") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            for (i, part) in parts.iter().enumerate() {
                if *part == "[scdet]" && i + 2 < parts.len() {
                    if let (Ok(time_secs), Ok(score)) = (
                        parts[i + 1].parse::<f64>(),
                        parts[i + 2].parse::<f32>(),
                    ) {
                        scene_changes.push(((time_secs * 1000.0) as u64, score));
                    }
                    break;
                }
            }
        }
    }
    scene_changes
}
