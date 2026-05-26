use std::path::{Path, PathBuf};

pub(crate) fn resolve_binary_path(binary_name: &str) -> String {
    // Guard against empty input — Command::new("") panics
    if binary_name.is_empty() {
        return binary_name.to_string();
    }
    let env_key = format!("CUTDECK_{}_PATH", binary_name.to_uppercase());
    if let Ok(path) = std::env::var(&env_key) {
        if !path.trim().is_empty() && Path::new(&path).exists() {
            return path;
        }
    }

    if binary_name == "ffprobe" {
        if let Ok(ffmpeg_path) = std::env::var("CUTDECK_FFMPEG_PATH") {
            let ffmpeg = PathBuf::from(ffmpeg_path);
            if let Some(parent) = ffmpeg.parent() {
                let probe = parent.join("ffprobe");
                if probe.exists() {
                    return probe.display().to_string();
                }
            }
        }
    }

    // Search all PATH directories for the binary
    if let Some(path_var) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join(binary_name);
            if candidate.exists() {
                return candidate.display().to_string();
            }
        }
    }

    // Fallback to common system directories
    let common_dirs = [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
        "/snap/bin",
        "/home/linuxbrew/.linuxbrew/bin",
    ];
    for dir in common_dirs {
        let candidate = Path::new(dir).join(binary_name);
        if candidate.exists() {
            return candidate.display().to_string();
        }
    }

    binary_name.to_string()
}

pub(crate) fn ffmpeg_binary() -> String {
    resolve_binary_path("ffmpeg")
}

pub(crate) fn ffprobe_binary() -> String {
    resolve_binary_path("ffprobe")
}

// ─── Hardware Acceleration ──────────────────────────────────────────────────

/// Hardware acceleration backend detected on the system
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HwAccel {
    /// NVIDIA GPU via NVENC/NVDEC (Linux/Windows)
    Nvidia,
    /// Intel GPU via Quick Sync Video (Linux/Windows)
    IntelQsv,
    /// AMD GPU via VAAPI (Linux)
    AmdVaapi,
    /// Apple Silicon / Intel Mac via VideoToolbox (macOS)
    VideoToolbox,
    /// No hardware acceleration — CPU only
    Cpu,
}

impl HwAccel {
    /// Returns a human-readable name
    pub fn name(self) -> &'static str {
        match self {
            HwAccel::Nvidia => "NVIDIA NVENC/NVDEC",
            HwAccel::IntelQsv => "Intel Quick Sync Video",
            HwAccel::AmdVaapi => "AMD VAAPI",
            HwAccel::VideoToolbox => "Apple VideoToolbox",
            HwAccel::Cpu => "CPU (libx264/libx265)",
        }
    }

    /// Returns the FFmpeg video decoder for this hardware
    pub fn video_decoder(self) -> Option<&'static str> {
        match self {
            HwAccel::Nvidia => Some("h264_cuvid"),
            HwAccel::IntelQsv => Some("h264_qsv"),
            HwAccel::AmdVaapi => Some("hevc_vaapi"),
            HwAccel::VideoToolbox => Some("h264_videotoolbox"),
            HwAccel::Cpu => None,
        }
    }

    /// Returns the FFmpeg video encoder for H.264
    pub fn h264_encoder(self) -> &'static str {
        match self {
            HwAccel::Nvidia => "h264_nvenc",
            HwAccel::IntelQsv => "h264_qsv",
            HwAccel::AmdVaapi => "h264_vaapi",
            HwAccel::VideoToolbox => "h264_videotoolbox",
            HwAccel::Cpu => "libx264",
        }
    }

    /// Returns the FFmpeg video encoder for H.265/HEVC
    pub fn hevc_encoder(self) -> &'static str {
        match self {
            HwAccel::Nvidia => "hevc_nvenc",
            HwAccel::IntelQsv => "hevc_qsv",
            HwAccel::AmdVaapi => "hevc_vaapi",
            HwAccel::VideoToolbox => "hevc_videotoolbox",
            HwAccel::Cpu => "libx265",
        }
    }

    /// Returns the FFmpeg audio encoder to pair with hardware video encoding
    pub fn audio_encoder(self) -> &'static str {
        // All hardware encoders support AAC
        "aac"
    }

    /// Returns the FFmpeg input hardware device flag (for VAAPI/VideoToolbox)
    pub fn input_device(self) -> Option<&'static str> {
        match self {
            HwAccel::AmdVaapi => Some("vaapi"),
            HwAccel::VideoToolbox => None, // Auto-detected
            _ => None,
        }
    }

    /// Returns extra FFmpeg args to enable hardware decode input
    /// e.g. ["-hwaccel", "vaapi", "-hwaccel_device", "/dev/dri/renderD128"]
    pub fn hwaccel_input_args(self) -> Vec<&'static str> {
        match self {
            HwAccel::AmdVaapi => vec!["-vaapi_device", "/dev/dri/renderD128"],
            HwAccel::Nvidia => vec!["-hwaccel", "cuda"],
            _ => vec![],
        }
    }
}

impl std::fmt::Display for HwAccel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name())
    }
}

/// Detects available hardware acceleration on this system.
/// Priority: NVIDIA > Intel QSV > AMD VAAPI > VideoToolbox > CPU
pub fn detect_hw_accel() -> HwAccel {
    // NVIDIA: check for nvidia-smi
    if std::process::Command::new("nvidia-smi")
        .arg("--query-gpu=name")
        .arg("--format=csv,noheader")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        log::info!("[StoryFab] Detected NVIDIA GPU — using NVENC/NVDEC");
        return HwAccel::Nvidia;
    }

    // Intel QSV: check for vainfo (Linux) or QSV availability
    if std::process::Command::new("vainfo")
        .arg("--show_config")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        log::info!("[StoryFab] Detected Intel GPU — using Quick Sync Video");
        return HwAccel::IntelQsv;
    }

    // AMD VAAPI: check for /dev/dri/renderD128
    if Path::new("/dev/dri/renderD128").exists()
        && std::process::Command::new("vainfo")
            .arg("--show_config")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    {
        log::info!("[StoryFab] Detected AMD GPU — using VAAPI");
        return HwAccel::AmdVaapi;
    }

    // Apple VideoToolbox: check for macOS
    #[cfg(target_os = "macos")]
    {
        log::info!("[StoryFab] Detected macOS — using VideoToolbox");
        return HwAccel::VideoToolbox;
    }

    log::info!("[StoryFab] No GPU detected — using CPU encoding");
    HwAccel::Cpu
}

/// Returns the globally detected hardware acceleration backend.
/// Cached after first call.
static HW_DETECTED: std::sync::OnceLock<HwAccel> = std::sync::OnceLock::new();

pub fn hw_accel() -> HwAccel {
    *HW_DETECTED.get_or_init(detect_hw_accel)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hw_accel_names() {
        assert_eq!(HwAccel::Cpu.name(), "CPU (libx264/libx265)");
        assert_eq!(HwAccel::Nvidia.h264_encoder(), "h264_nvenc");
        assert_eq!(HwAccel::Nvidia.hevc_encoder(), "hevc_nvenc");
        assert_eq!(HwAccel::Cpu.h264_encoder(), "libx264");
    }

    #[test]
    fn test_hwaccel_input_args() {
        assert!(HwAccel::Nvidia.hwaccel_input_args().contains(&"-hwaccel"));
        assert!(HwAccel::AmdVaapi.hwaccel_input_args().contains(&"-vaapi_device"));
        assert!(HwAccel::Cpu.hwaccel_input_args().is_empty());
    }
}
