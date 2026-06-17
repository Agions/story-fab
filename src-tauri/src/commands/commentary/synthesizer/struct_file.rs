//! Commentary Synthesizer Core — TTS 语音合成引擎

use std::env;
use tokio::fs;
use tokio::process::Command;

use super::types::{SynthesizeResult, VoiceInfo};

fn edge_tts_path() -> String {
    if let Ok(path) = env::var("CUTDECK_EDGE_TTS_PATH") {
        if !path.trim().is_empty() {
            return path;
        }
    }
    crate::binary::resolve_binary_path("edge-tts")
}

fn rate_string(speed: f32) -> String {
    let pct = ((speed - 1.0) * 100.0).round() as i32;
    if pct > 0 { format!("+{pct}%") } else { format!("{pct}%") }
}

/// Commentary Synthesizer（TTS 封装）
pub struct CommentarySynthesizer;

impl CommentarySynthesizer {
    pub async fn synthesize(
        text: &str,
        voice: &str,
        speed: f32,
        format: &str,
    ) -> Result<SynthesizeResult, String> {
        if text.trim().is_empty() {
            return Err("解说文本不能为空".to_string());
        }

        let mut tmp_audio = env::temp_dir();
        let ext = match format {
            "wav" | "audio/wav" => "wav",
            "ogg" | "audio/ogg" => "ogg",
            _ => "mp3",
        };
        tmp_audio.push(format!("commentary_tts_{}.{}", std::process::id(), ext));
        let tmp_audio_path = tmp_audio.display().to_string();

        let mut tmp_text = env::temp_dir();
        tmp_text.push(format!("commentary_input_{}.txt", std::process::id()));
        let tmp_text_path = tmp_text.display().to_string();

        fs::write(&tmp_text_path, text)
            .await
            .map_err(|e| format!("写入临时文件失败: {}", e))?;

        let output = Command::new(edge_tts_path())
            .arg("--file")
            .arg(&tmp_text_path)
            .arg("--voice")
            .arg(voice)
            .arg("--rate")
            .arg(&rate_string(speed))
            .arg("--write-media")
            .arg(&tmp_audio_path)
            .output()
            .await
            .map_err(|e| format!("edge-tts 启动失败: {}", e))?;

        let _ = fs::remove_file(&tmp_text_path).await;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("edge-tts 失败: {}", stderr));
        }

        let metadata = fs::metadata(&tmp_audio_path)
            .await
            .map_err(|e| format!("读取音频文件失败: {}", e))?;
        let file_size_bytes = metadata.len();

        let duration_secs = match ext {
            "wav" => file_size_bytes as f64 / 32000.0,
            _ => file_size_bytes as f64 / 16000.0,
        };

        Ok(SynthesizeResult { audio_path: tmp_audio_path, duration_secs })
    }

    pub async fn synthesize_batch(
        segments: Vec<(&str, &str, f32, &str)>,
    ) -> Vec<Result<SynthesizeResult, String>> {
        let mut results = Vec::with_capacity(segments.len());
        for (text, voice, speed, format) in segments {
            results.push(Self::synthesize(text, voice, speed, format).await);
        }
        results
    }

    pub async fn estimate_duration(
        text: &str,
        voice: &str,
        speed: f32,
    ) -> Result<f64, String> {
        if text.trim().is_empty() {
            return Err("文本不能为空".to_string());
        }

        let mut tmp_audio = env::temp_dir();
        tmp_audio.push(format!("edge_tts_estim_{}.mp3", std::process::id()));
        let tmp_audio_path = tmp_audio.display().to_string();

        let output = Command::new(edge_tts_path())
            .arg("--text")
            .arg(text)
            .arg("--voice")
            .arg(voice)
            .arg("--rate")
            .arg(&rate_string(speed))
            .arg("--write-media")
            .arg(&tmp_audio_path)
            .output()
            .await
            .map_err(|e| format!("edge-tts 启动失败: {}", e))?;

        let _ = fs::remove_file(&tmp_audio_path).await;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("edge-tts 失败: {}", stderr));
        }

        let duration = Command::new("ffprobe")
            .args(["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", &tmp_audio_path])
            .output()
            .await
            .map_err(|e| format!("ffprobe 执行失败: {}", e))?;

        let _ = fs::remove_file(&tmp_audio_path).await;

        let stdout = String::from_utf8_lossy(&duration.stdout);
        stdout.trim().parse::<f64>().map_err(|e| format!("解析时长失败: {}", e))
    }
}

/// 获取推荐音色列表
pub fn list_voices(style: Option<String>) -> Vec<VoiceInfo> {
    let voices = vec![
        VoiceInfo { id: "zh-CN-XiaoxiaoNeural".into(), name: "晓晓".into(), gender: "female".into(), style: "warm".into(), description: "温柔亲切，适合温情治愈类解说".into() },
        VoiceInfo { id: "zh-CN-YunxiNeural".into(), name: "云希".into(), gender: "male".into(), style: "serious".into(), description: "低沉有力，适合严肃正式类解说".into() },
        VoiceInfo { id: "zh-CN-YunyangNeural".into(), name: "云扬".into(), gender: "male".into(), style: "conversational".into(), description: "清晰自然，适合日常接地气类解说".into() },
        VoiceInfo { id: "zh-CN-XiaoyiNeural".into(), name: "晓伊".into(), gender: "female".into(), style: "humorous".into(), description: "活泼可爱，适合幽默风趣类解说".into() },
        VoiceInfo { id: "zh-CN-XiaobaiNeural".into(), name: "小白".into(), gender: "male".into(), style: "suspense".into(), description: "略带神秘感，适合悬疑紧张类解说".into() },
    ];

    match style.as_deref() {
        Some("humorous") => voices.into_iter().filter(|v| v.style == "humorous" || v.style == "conversational").collect(),
        Some("serious") => voices.into_iter().filter(|v| v.style == "serious").collect(),
        Some("conversational") => voices.into_iter().filter(|v| v.style == "conversational" || v.style == "warm").collect(),
        Some("suspense") => voices.into_iter().filter(|v| v.style == "suspense").collect(),
        Some("warm") => voices.into_iter().filter(|v| v.style == "warm").collect(),
        _ => voices,
    }
}