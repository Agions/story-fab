//! Commentary Synthesizer — 解说配音合成模块
//!
//! 负责将解说文案通过 TTS 合成音频，并处理音画对齐

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 合成选项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SynthesizeOptions {
    /// 解说文本
    pub text: String,
    /// TTS 音色名称
    pub voice: String,
    /// 语速（1.0 = 正常）
    pub speed: f32,
    /// 格式：mp3 / wav / ogg
    pub format: Option<String>,
    /// 输出路径（可选，不提供则写入临时文件）
    pub output_path: Option<String>,
    /// 音量（0.0-1.0）
    pub volume: Option<f32>,
}

/// 合成结果
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SynthesizeResult {
    /// 音频文件路径
    pub audio_path: String,
    /// 音频时长（秒）
    pub duration_secs: f64,
}

/// Commentary Synthesizer（TTS 封装）
pub struct CommentarySynthesizer;

impl CommentarySynthesizer {
    /// 使用 Edge TTS 合成解说音频
    ///
    /// 返回合成后的音频路径和时长
    pub async fn synthesize(
        text: &str,
        voice: &str,
        speed: f32,
        format: &str,
    ) -> Result<SynthesizeResult, String> {
        if text.trim().is_empty() {
            return Err("解说文本不能为空".to_string());
        }

        let mut tmp_audio = std::env::temp_dir();
        let ext = match format {
            "wav" | "audio/wav" => "wav",
            "ogg" | "audio/ogg" => "ogg",
            _ => "mp3",
        };
        tmp_audio.push(format!("commentary_tts_{}.{}", std::process::id(), ext));
        let tmp_audio_path = tmp_audio.display().to_string();

        // 写入临时文本文件（edge-tts --file 模式）
        let mut tmp_text = std::env::temp_dir();
        tmp_text.push(format!("commentary_input_{}.txt", std::process::id()));
        let tmp_text_path = tmp_text.display().to_string();

        tokio::fs::write(&tmp_text_path, text)
            .await
            .map_err(|e| format!("写入临时文件失败: {}", e))?;

        let edge_path = edge_tts_path();
        let rate = {
            let pct = ((speed - 1.0) * 100.0).round() as i32;
            if pct > 0 {
                format!("+{pct}%")
            } else {
                format!("{pct}%")
            }
        };

        let output = tokio::process::Command::new(&edge_path)
            .arg("--file")
            .arg(&tmp_text_path)
            .arg("--voice")
            .arg(voice)
            .arg("--rate")
            .arg(&rate)
            .arg("--write-media")
            .arg(&tmp_audio_path)
            .output()
            .await
            .map_err(|e| format!("edge-tts 启动失败: {}", e))?;

        let _ = tokio::fs::remove_file(&tmp_text_path).await;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("edge-tts 失败: {}", stderr));
        }

        let metadata = tokio::fs::metadata(&tmp_audio_path)
            .await
            .map_err(|e| format!("读取音频文件失败: {}", e))?;
        let file_size_bytes = metadata.len();

        let duration_secs = match ext {
            "wav" => file_size_bytes as f64 / 32000.0,
            _ => file_size_bytes as f64 / 16000.0,
        };

        Ok(SynthesizeResult {
            audio_path: tmp_audio_path,
            duration_secs,
        })
    }

    /// 批量合成多个片段
    pub async fn synthesize_batch(
        segments: Vec<(&str, &str, f32, &str)>, // (text, voice, speed, format)
    ) -> Vec<Result<SynthesizeResult, String>> {
        let mut results = Vec::with_capacity(segments.len());
        for (text, voice, speed, format) in segments {
            results.push(Self::synthesize(text, voice, speed, format).await);
        }
        results
    }

    /// 估算 TTS 音频时长（不生成文件，只合成后取 ffprobe 时长）
    pub async fn estimate_duration(
        text: &str,
        voice: &str,
        speed: f32,
    ) -> Result<f64, String> {
        if text.trim().is_empty() {
            return Err("文本不能为空".to_string());
        }

        let mut tmp_audio = std::env::temp_dir();
        tmp_audio.push(format!("edge_tts_estim_{}.mp3", std::process::id()));
        let tmp_audio_path = tmp_audio.display().to_string();

        let rate = {
            let pct = ((speed - 1.0) * 100.0).round() as i32;
            if pct > 0 {
                format!("+{pct}%")
            } else {
                format!("{pct}%")
            }
        };

        let output = tokio::process::Command::new(edge_tts_path())
            .arg("--text")
            .arg(text)
            .arg("--voice")
            .arg(voice)
            .arg("--rate")
            .arg(&rate)
            .arg("--write-media")
            .arg(&tmp_audio_path)
            .output()
            .await
            .map_err(|e| format!("edge-tts 启动失败: {}", e))?;

        let _ = tokio::fs::remove_file(&tmp_audio_path).await;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("edge-tts 失败: {}", stderr));
        }

        // 用 ffprobe 读取真实时长
        let duration = tokio::process::Command::new("ffprobe")
            .args([
                "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                &tmp_audio_path,
            ])
            .output()
            .await
            .map_err(|e| format!("ffprobe 执行失败: {}", e))?;

        let _ = tokio::fs::remove_file(&tmp_audio_path).await;

        let stdout = String::from_utf8_lossy(&duration.stdout);
        stdout
            .trim()
            .parse::<f64>()
            .map_err(|e| format!("解析时长失败: {}", e))
    }
}

// ─── Tauri 命令 ─────────────────────────────────────────────────────────

/// 合成单条解说音频
#[tauri::command]
pub async fn synthesize_commentary_audio(
    text: String,
    voice: String,
    speed: f32,
    format: Option<String>,
    output_path: Option<String>,
) -> Result<SynthesizeResult, String> {
    let format = format.unwrap_or_else(|| "mp3".to_string());
    let result = CommentarySynthesizer::synthesize(&text, &voice, speed, &format).await?;

    // 如果指定了输出路径，复制过去
    if let Some(dest) = output_path {
        let src = PathBuf::from(&result.audio_path);
        tokio::fs::copy(&src, &dest)
            .await
            .map_err(|e| format!("复制音频文件失败: {}", e))?;

        return Ok(SynthesizeResult {
            audio_path: dest,
            duration_secs: result.duration_secs,
        });
    }

    Ok(result)
}

/// 估算 TTS 音频时长
#[tauri::command]
pub async fn estimate_tts_duration(
    text: String,
    voice: String,
    speed: f32,
) -> Result<f64, String> {
    CommentarySynthesizer::estimate_duration(&text, &voice, speed).await
}

/// 获取推荐音色列表
#[tauri::command]
pub fn list_commentary_voices(style: Option<String>) -> Vec<VoiceInfo> {
    let voices = vec![
        VoiceInfo {
            id: "zh-CN-XiaoxiaoNeural".to_string(),
            name: "晓晓".to_string(),
            gender: "female".to_string(),
            style: "warm".to_string(),
            description: "温柔亲切，适合温情治愈类解说".to_string(),
        },
        VoiceInfo {
            id: "zh-CN-YunxiNeural".to_string(),
            name: "云希".to_string(),
            gender: "male".to_string(),
            style: "serious".to_string(),
            description: "低沉有力，适合严肃正式类解说".to_string(),
        },
        VoiceInfo {
            id: "zh-CN-YunyangNeural".to_string(),
            name: "云扬".to_string(),
            gender: "male".to_string(),
            style: "conversational".to_string(),
            description: "清晰自然，适合日常接地气类解说".to_string(),
        },
        VoiceInfo {
            id: "zh-CN-XiaoyiNeural".to_string(),
            name: "晓伊".to_string(),
            gender: "female".to_string(),
            style: "humorous".to_string(),
            description: "活泼可爱，适合幽默风趣类解说".to_string(),
        },
        VoiceInfo {
            id: "zh-CN-XiaobaiNeural".to_string(),
            name: "小白".to_string(),
            gender: "male".to_string(),
            style: "suspense".to_string(),
            description: "略带神秘感，适合悬疑紧张类解说".to_string(),
        },
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

/// 音色信息
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceInfo {
    pub id: String,
    pub name: String,
    pub gender: String,
    pub style: String,
    pub description: String,
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────

fn edge_tts_path() -> String {
    if let Ok(path) = std::env::var("CUTDECK_EDGE_TTS_PATH") {
        if !path.trim().is_empty() {
            return path;
        }
    }
    crate::binary::resolve_binary_path("edge-tts")
}