use crate::binary::{ffmpeg_binary, ffprobe_binary};
use crate::commands::render::ffmpeg_builder::quality_preset;
use crate::types::{ExportVideoInput, TranscodeCropInput};
use crate::utils::cmd_err;

#[tauri::command]
pub fn transcode_with_crop(input: TranscodeCropInput) -> Result<String, String> {
    if input.input_path.trim().is_empty() || input.output_path.trim().is_empty() {
        return Err("输入或输出路径不能为空".to_string());
    }
    let mut cmd = std::process::Command::new(ffmpeg_binary());
    cmd.arg("-y").arg("-hide_banner");
    if let (Some(s), Some(e)) = (input.start_time, input.end_time) {
        cmd.arg("-ss").arg(s.to_string());
        cmd.arg("-t").arg((e - s).max(0.1).to_string());
    }
    cmd.arg("-i").arg(&input.input_path);
    let vf_filter: String = match input.aspect.as_str() {
        "9:16" => {
            "scale=1080:1920:force_original_aspect_ratio=decrease,crop=1080:1920:(iw-1080)/2:(ih-1920)/2,setsar=1".to_string()
        }
        "1:1" => {
            "scale='min(iw\\,ih):min(iw\\,ih)',crop='min(iw\\,ih):min(iw\\,ih)',setsar=1".to_string()
        }
        "16:9" => {
            "scale=1920:1080:force_original_aspect_ratio=decrease,crop=1920:1080:(iw-1920)/2:(ih-1080)/2,setsar=1".to_string()
        }
        _ => return Err("不支持的宽高比，仅支持 9:16、1:1、16:9".to_string()),
    };
    cmd.arg("-vf").arg(&vf_filter);

    use crate::binary::HwAccel;
    let hw = crate::binary::hw_accel();
    let enc = if hw == HwAccel::Cpu { "libx264" } else { hw.h264_encoder() };
    let (crf, preset) = quality_preset(input.quality.as_deref().unwrap_or("medium"));
    cmd.args(["-c:v", enc, "-crf", &crf.to_string(), "-preset", preset]);
    cmd.args(["-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"]);
    cmd.arg(&input.output_path);
    let output = cmd.output().map_err(|e| format!("FFmpeg 执行失败: {e}"))?;
    if output.status.success() {
        Ok(input.output_path)
    } else {
        Err(cmd_err("裁切导出失败", &output))
    }
}

/// Export video — full-featured video export with optional subtitle burn-in.
/// Returns { output_path, duration, file_size }.
#[tauri::command]
pub fn export_video(input: ExportVideoInput) -> Result<ExportVideoResult, String> {
    if input.input_path.trim().is_empty() || input.output_path.trim().is_empty() {
        return Err("输入或输出路径不能为空".to_string());
    }

    // Subtitle burn-in path — normalize then delegate to subtitle_burnin module
    let sub_path_normalized = match &input.subtitle_path {
        Some(p) if !p.is_empty() && input.burn_subtitles == Some(true) => {
            Some(crate::commands::render::subtitle_burnin::normalize_subtitle_file(p, &std::env::temp_dir())?)
        }
        _ => None,
    };

    if let Some(ref norm_sub) = sub_path_normalized {
        // Burn subtitles via dedicated module (handles its own FFmpeg invocation)
        crate::commands::render::subtitle_burnin::burn_subtitles(
            &input.input_path,
            &input.output_path,
            norm_sub,
            None,
        )?;
    } else {
        // Plain encode — no subtitles
        let mut cmd = std::process::Command::new(ffmpeg_binary());
        cmd.arg("-y").arg("-hide_banner");
        cmd.arg("-i").arg(&input.input_path);

        use crate::binary::HwAccel;
        let hw = crate::binary::hw_accel();
        let video_codec = match input.video_codec.as_deref() {
            Some("h265") | Some("hevc") => {
                if hw == HwAccel::Cpu { "libx265" } else { hw.hevc_encoder() }
            }
            Some("h264") | None => {
                if hw == HwAccel::Cpu { "libx264" } else { hw.h264_encoder() }
            }
            Some(c) => c,
        };
        let crf = input.crf.unwrap_or(23);
        cmd.args(["-c:v", video_codec, "-crf", &crf.to_string()]);

        let audio_codec = input.audio_codec.as_deref().unwrap_or("aac");
        cmd.args(["-c:a", audio_codec, "-b:a", "192k"]);
        cmd.args(["-movflags", "+faststart"]);
        cmd.arg(&input.output_path);

        let output = cmd.output().map_err(|e| format!("FFmpeg 执行失败: {e}"))?;
        if !output.status.success() {
            return Err(cmd_err("导出失败", &output));
        }
    }

    // Get file size
    let metadata = std::fs::metadata(&input.output_path)
        .map_err(|e| format!("无法读取输出文件元数据: {e}"))?;
    let file_size = metadata.len();

    // Get duration via ffprobe
    let duration = get_duration_of_file(&input.output_path)
        .unwrap_or(0.0);

    Ok(ExportVideoResult {
        output_path: input.output_path,
        duration,
        file_size,
    })
}

fn get_duration_of_file(path: &str) -> Option<f64> {
    let ffprobe = ffprobe_binary();
    let output = std::process::Command::new(&ffprobe)
        .args(["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path])
        .output()
        .ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout.trim().parse().ok()
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportVideoResult {
    pub output_path: String,
    pub duration: f64,
    pub file_size: u64,
}
