//! Utils — shared utility functions
//!
//! Sub-modules:
//!   time.rs    — parse_fraction, chrono_like_timestamp, format_time, format_srt_time
//!   process.rs — cmd_first_line, cmd_err, parse_scdet_output
//!   concat.rs  — write_concat_file
//!   audio.rs   — pcm_samples_from_wav

mod audio;
mod concat;
mod process;
mod time;

pub use audio::pcm_samples_from_wav;
pub use concat::write_concat_file;
pub use process::{cmd_err, cmd_first_line, parse_scdet_output};
pub use time::{chrono_like_timestamp, format_srt_time, format_time, parse_fraction};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_fraction_float() {
        assert!((parse_fraction("0.5") - 0.5).abs() < 1e-9);
        assert!((parse_fraction("1.0") - 1.0).abs() < 1e-9);
    }

    #[test]
    fn test_parse_fraction_ratio() {
        assert!((parse_fraction("1/2") - 0.5).abs() < 1e-9);
        assert!((parse_fraction("3/4") - 0.75).abs() < 1e-9);
    }

    #[test]
    fn test_parse_fraction_zero_denominator() {
        assert_eq!(parse_fraction("1/0"), 0.0);
    }

    #[test]
    fn test_parse_fraction_invalid() {
        assert_eq!(parse_fraction(""), 0.0);
        assert_eq!(parse_fraction("abc"), 0.0);
    }

    #[test]
    fn test_format_srt_time_basic() {
        assert_eq!(format_srt_time(0.0), "00:00:00,000");
        assert_eq!(format_srt_time(1.0), "00:00:01,000");
        assert_eq!(format_srt_time(1.234), "00:00:01,234");
        assert_eq!(format_srt_time(3661.0), "01:01:01,000");
    }

    #[test]
    fn test_format_time_basic() {
        assert_eq!(format_time(0.0), "00:00:00.000");
        assert_eq!(format_time(1.0), "00:00:01.000");
        assert_eq!(format_time(1.234), "00:00:01.234");
        assert_eq!(format_time(3661.0), "01:01:01.000");
    }

    #[test]
    fn test_pcm_samples_from_wav_silence() {
        let data: Vec<u8> = vec![0u8; 44 + 4];
        let samples = pcm_samples_from_wav(&data);
        assert_eq!(samples, vec![0.0_f32, 0.0_f32]);
    }

    #[test]
    fn test_pcm_samples_from_wav_max_amplitude() {
        let mut data = vec![0u8; 44];
        data.push(0xFF);
        data.push(0x7F);
        let samples = pcm_samples_from_wav(&data);
        assert!((samples[0] - 1.0_f32).abs() < 1e-6);
    }

    #[test]
    fn test_pcm_samples_from_wav_short_header() {
        let data = vec![0x00, 0x00, 0x01, 0x00];
        let samples = pcm_samples_from_wav(&data);
        assert_eq!(samples.len(), 2);
    }

    #[test]
    fn test_pcm_samples_from_wav_odd_byte_count() {
        let mut data = vec![0u8; 44];
        data.extend([0x00, 0x00, 0x01]);
        let samples = pcm_samples_from_wav(&data);
        assert_eq!(samples.len(), 2);
    }

    #[test]
    fn test_cmd_first_line_stdout() {
        let out = std::process::Output {
            stdout: "line1\nline2".as_bytes().to_vec(),
            stderr: "err1\nerr2".as_bytes().to_vec(),
            status: std::process::ExitStatus::from_raw(0),
        };
        assert_eq!(cmd_first_line(&out), Some("line1".to_string()));
    }

    #[test]
    fn test_cmd_first_line_fallback_stderr() {
        let out = std::process::Output {
            stdout: vec![],
            stderr: "err1\nerr2".as_bytes().to_vec(),
            status: std::process::ExitStatus::from_raw(1),
        };
        assert_eq!(cmd_first_line(&out), Some("err1".to_string()));
    }

    #[test]
    fn test_cmd_first_line_empty() {
        let out = std::process::Output {
            stdout: vec![],
            stderr: vec![],
            status: std::process::ExitStatus::from_raw(0),
        };
        assert_eq!(cmd_first_line(&out), None);
    }

    #[test]
    fn test_cmd_err_includes_stderr() {
        let out = std::process::Output {
            stdout: vec![],
            stderr: "ffmpeg: error".as_bytes().to_vec(),
            status: std::process::ExitStatus::from_raw(1),
        };
        let result = cmd_err("export failed", &out);
        assert!(result.contains("export failed"));
        assert!(result.contains("ffmpeg: error"));
    }

    #[test]
    fn test_write_concat_file_single_entry() {
        let entries = vec![std::path::PathBuf::from("/tmp/video1.mp4")];
        let path = write_concat_file(&entries).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("video1.mp4"));
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn test_write_concat_file_escapes_single_quotes() {
        let entries = vec![std::path::PathBuf::from("/tmp/video's.mp4")];
        let path = write_concat_file(&entries).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("'\\''"));
        std::fs::remove_file(&path).ok();
    }
}