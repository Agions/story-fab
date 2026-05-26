//! Whisper-based subtitle transcription module.
//!
//! Uses faster-whisper (Python) as the primary engine via subprocess,
//! with graceful fallback handling when the Python environment is unavailable.

use crate::binary::resolve_binary_path;
use crate::utils::cmd_err;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use tauri::Emitter;

// ============================================
// Types
// ============================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhisperWord {
    pub word: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub probability: f32,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
    pub probability: Option<f32>,
    #[serde(default)]
    pub words: Vec<WhisperWord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleResult {
    pub language: String,
    pub language_probability: f32,
    pub duration_ms: u64,
    pub segments: Vec<SubtitleSegment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhisperModelInfo {
    pub name: String,
    pub size: String,
    pub is_downloaded: bool,
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeProgress {
    pub stage: String,
    pub progress: f32,
    pub current_segment: Option<u32>,
    pub total_segments: Option<u32>,
}

// ============================================
// Model management
// ============================================

/// Returns the default model directory (~/.cache/whisper)
fn whisper_cache_dir() -> std::path::PathBuf {
    dirs::cache_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("whisper")
}

/// Lists available/found whisper models
#[tauri::command]
pub fn list_whisper_models() -> Vec<WhisperModelInfo> {
    let cache_dir = whisper_cache_dir();
    let known = vec![
        ("tiny", "39M", "tiny.en", "tiny"),
        ("base", "74M", "base.en", "base"),
        ("small", "244M", "small.en", "small"),
        ("medium", "769M", "medium.en", "medium"),
        ("large-v3", "1550M", "large-v3", "large-v3"),
        ("distil-large-v3", "820M", "distil-large-v3", "distil-large-v3"),
        ("distil-medium.en", "448M", "distil-medium.en", "distil-medium.en"),
        ("distil-small.en", "140M", "distil-small.en", "distil-small.en"),
    ];

    known
        .into_iter()
        .map(|(name, size, file, _)| {
            let path = cache_dir.join(file);
            WhisperModelInfo {
                name: name.to_string(),
                size: size.to_string(),
                is_downloaded: path.exists(),
                path: path.exists().then(|| path.display().to_string()),
            }
        })
        .collect()
}

/// Check if faster-whisper Python package is available
#[tauri::command]
pub fn check_faster_whisper() -> Result<bool, String> {
    let output = Command::new("python3")
        .arg("-c")
        .arg("import faster_whisper; print(faster_whisper.__version__)")
        .output();

    match output {
        Ok(result) if result.status.success() => {
            let version = String::from_utf8_lossy(&result.stdout).trim().to_string();
            log::info!("[StoryFab] faster-whisper version: {}", version);
            Ok(true)
        }
        _ => {
            log::warn!("[StoryFab] faster-whisper not installed");
            Ok(false)
        }
    }
}

/// Download a whisper model (placeholder — faster-whisper auto-downloads on first use)
#[tauri::command]
pub async fn download_whisper_model(model_size: String) -> Result<String, String> {
    log::info!("[StoryFab] Model download requested: {}", model_size);

    // Validate model name to prevent Python code injection
    if !model_size.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.') {
        return Err(format!("无效的模型名称: {}", model_size));
    }

    // Use Debug format (repr) to safely escape the model name — avoids manual escaping bugs
    let model_repr = format!("{:?}", model_size);
    let output = tokio::process::Command::new("python3")
        .arg("-c")
        .arg(format!(
            "from faster_whisper import WhisperModel; m = WhisperModel({}, device='cpu', compute_type='int8'); del m; print('ok')",
            model_repr
        ))
        .output()
        .await
        .map_err(|e| format!("启动下载进程失败: {e}"))?;

    if output.status.success() {
        Ok(format!("模型 {} 下载完成", model_size))
    } else {
        Err(cmd_err("模型下载失败", &output))
    }
}

// ============================================
// Audio extraction helper
// ============================================

/// Extract audio from video file to a temporary WAV (16kHz mono) for whisper
fn extract_audio_to_wav(video_path: &str, output_wav: &Path) -> Result<(), String> {
    let ffmpeg = resolve_binary_path("ffmpeg");
    if ffmpeg.is_empty() {
        return Err("无法定位 ffmpeg，请设置 CUTDECK_FFMPEG_PATH 环境变量".to_string());
    }
    let output = Command::new(&ffmpeg)
        .args([
            "-y",                      // overwrite
            "-i", video_path,          // input
            "-vn",                     // no video
            "-acodec", "pcm_s16le",   // 16-bit PCM
            "-ar", "16000",            // 16kHz sample rate
            "-ac", "1",                // mono
            "-f", "wav",               // WAV format
            output_wav.to_str().unwrap_or(""),
        ])
        .output()
        .map_err(|e| format!("运行 ffmpeg 提取音频失败: {e}"))?;

    if !output.status.success() {
        return Err(cmd_err("ffmpeg 音频提取失败", &output));
    }
    Ok(())
}

// ============================================
// Main transcription command
// ============================================

/// Transcribe audio using faster-whisper
///
/// Model sizes: tiny, base, small, medium, large-v2, large-v3, distil-whisper variants
#[tauri::command]
pub async fn transcribe_audio(
    app: tauri::AppHandle,
    audio_path: String,
    model_size: Option<String>,
    language: Option<String>,
) -> Result<SubtitleResult, String> {
    let model = model_size.unwrap_or_else(|| "base".into());
    let lang = language.unwrap_or_else(|| "auto".into());

    log::info!(
        "[StoryFab] Starting transcription: path={}, model={}, lang={}",
        audio_path,
        model,
        lang
    );

    // Emit initial progress
    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: "正在准备音频...".to_string(),
        progress: 0.05,
        current_segment: None,
        total_segments: None,
    });

    // Determine input: if it's a video, extract audio first
    let input_ext = std::path::Path::new(&audio_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let audio_exts = ["wav", "mp3", "m4a", "flac", "ogg", "aac", "wma"];
    let temp_wav: Option<std::path::PathBuf> =
        if !audio_exts.contains(&input_ext.as_str()) {
            // It's a video file — extract audio
            let wav_path = std::env::temp_dir().join(format!(
                "story-fab_whisper_{}.wav",
                std::process::id()
            ));
            extract_audio_to_wav(&audio_path, &wav_path)
                .map_err(|e| format!("音频提取失败: {e}"))?;
            Some(wav_path)
        } else {
            None
        };

    let final_audio_path = temp_wav
        .as_ref()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| audio_path.clone());

    // Emit progress: audio ready
    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: "正在加载 Whisper 模型...".to_string(),
        progress: 0.15,
        current_segment: None,
        total_segments: None,
    });

    let lang_arg = if lang == "auto" {
        "None".to_string()
    } else {
        format!("'{lang}'")
    };

    // Use Python repr() to safely escape the audio path — avoids manual escaping bugs
    let audio_path_repr = format!("{:?}", &final_audio_path);
    let python_code = [
        r#"import sys
import json
from faster_whisper import WhisperModel

model_size = ""#.to_string(),
        model.clone(),
        r#""
device = "cpu"
compute_type = "int8"
batch_size = 8

try:
    import torch
    if torch.cuda.is_available():
        device = "cuda"
        compute_type = "float16"
        print("Using CUDA with float16", file=sys.stderr)
    else:
        # Check for Intel GPU via OpenVINO
        try:
            import openvino
            openvino_available = True
        except ImportError:
            openvino_available = False
        if openvino_available:
            device = "cpu"
            compute_type = "int8"
            # OpenVINO is auto-activated when installed
            print("Using OpenVINO (Intel GPU/CPU)", file=sys.stderr)
        else:
            # CPU with larger batch
            batch_size = 16
            print("Using CPU with batch_size=16", file=sys.stderr)
except ImportError:
    pass

model = WhisperModel(
    model_size,
    device=device,
    compute_type=compute_type,
    num_workers=4,
    batch_size=batch_size,
)

segments, info = model.transcribe(
    r#"#.to_string(),
        audio_path_repr,
        r#"",
    language="#.to_string(),
        lang_arg,
        r#"",
    word_timestamps=True,
    vad_filter=True,
    vad_parameters={"min_silence_duration_ms": 500},
)

lang = info.language or "unknown"
lang_prob = info.language_probability or 0.0
duration = info.duration or 0.0

result = {
    "language": lang,
    "language_probability": lang_prob,
    "duration_ms": int(duration * 1000),
    "segments": []
}

def normalize_text(text, segment_duration_ms=0):
    """Professional post-processing for Whisper output.
    """
    import re
    text = text.strip()
    if not text:
        return text

    # ── 0. Pre-clean: remove Whisper timestamp/metadata artifacts ─────────────
    text = re.sub(r'\[[\d.:]+\]', '', text)
    text = re.sub(r'\([\d:]+\)', '', text)
    text = re.sub(r'[\♪♫🎵🎶]+[^\♪♫🎵🎶]*[\♪♫🎵🎶]+', '', text)
    text = re.sub(r'^[\s,，、]*(?:呃|嗯|啊|噢|哈|嘿)\s*', '', text)

    # ── 1. Collapse repeated punctuation (≥3 → keep 2) ──
    text = re.sub(r'([。！？，、；：a-zA-Z])\1{2,}', r'\1\1', text)

    # ── 2. 4-char filler chain ─
    four_char_chains = [
        '然后然后', '那个那个', '这个这个', '其实其实', '就是就是',
        '其实呃', '就是呃', '就是说呃',
    ]
    for chain in four_char_chains:
        escaped = re.escape(chain)
        text = re.sub(r'\B' + escaped + r'\B\B' + escaped + r'\B', r'。', text)

    # ── 3. 3-char emotional fillers → preserve 2 + period ─
    text = re.sub(r'^(.{1,2})(\1{2,})$', r'\1\1。', text)
    text = re.sub(r'([啊呢哦呀嘛~￣])(\1{2,})', lambda m: m.group(1) * 2 + '。', text)

    # ── 4. Remove common fillers ─
    fillers = [
        '就是说呃', '这个这个', '嗯嗯', '呃呃', '啊啊',
        '就是说', '然后', '那个', '这个',
        '对对对', '对对',
    ]
    for f in fillers:
        pat = r'(?<![a-zA-Z\u4e00-\u9fff])' + re.escape(f) + r'(?![a-zA-Z\u4e00-\u9fff])'
        text = re.sub(pat, '', text)

    # ── 5. Collapse whitespace ─
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n+', ' ', text)

    # ── 6. Fix mixed punctuation clusters ─
    text = re.sub(r'[，。．,]+([。.])', r'\1', text)
    text = re.sub(r'[。.]{3,}', '。', text)
    text = re.sub(r'[？]{2,}', '？', text)
    text = re.sub(r'[！]{2,}', '！', text)

    # ── 7. Punctuation restoration ─
    chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
    if len(chinese_chars) >= 3:
        if text and text[-1] not in '。！？…—–' and not text[-1].isspace():
            if text[-1] not in 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789':
                text = text + '。'

    # ── 8. Remove trailing speaker labels ─
    text = re.sub(r'\s*[\(\[\(]?\s*(?:SPEAKER_|speaker|Speaker)\s*_?\s*\d+\s*[\)\]\)]?\s*$', '', text, flags=re.IGNORECASE)
    text = re.sub(r'[\（\(][Ss]?[Pp]?[Ee]?[Aa]?[Kk]?[Ee]?[Rr]_[^）\)]+[）\)]', '', text)

    # ── 9. Remove isolated Latin single chars ─
    text = re.sub(r' [a-z] ', ' ', text)
    text = re.sub(r' [A-Z] ', ' ', text)

    # ── 10. Mixed language cleanup ─
    text = re.sub(r'[\.。]+\s*', '. ', text)
    text = re.sub(r'\s+', ' ', text)

    # ── 11. Final cleanup ─
    text = re.sub(r'[\s,，\.]+$', '', text)
    text = text.strip()

    # ── 12. Ensure non-empty ─
    if not text or text in '。！？…':
        return '...'
    if len(text) > 1 and text[-1] in '，。，' and text[-2] in '，。！？':
        text = text[:-1]

    return text

for seg in segments:
    seg_words = getattr(seg, 'words', []) or []
    if seg_words:
        seg_prob = sum(w.probability for w in seg_words) / len(seg_words)
    else:
        seg_prob = 0.95
    result["segments"].append({
        "start_ms": int(seg.start * 1000),
        "end_ms": int(seg.end * 1000),
        "text": normalize_text(seg.text),
        "words": [
            {"word": w.word, "start_ms": int(w.start * 1000), "end_ms": int(w.end * 1000), "probability": w.probability}
            for w in seg_words
        ] if seg_words else [],
        "probability": round(seg_prob, 4),
    })

print(json.dumps(result, ensure_ascii=False))
"#.to_string(),
    ]
    .join("");

    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: format!("Whisper {} 模型推理中... (这可能需要几分钟)", model),
        progress: 0.25,
        current_segment: None,
        total_segments: None,
    });

    // Use tokio::process::Command with kill_on_drop=true so the Python child
    // is killed when the async task is cancelled (client disconnect).
    // Wrap in spawn_blocking to avoid blocking the async executor on long-running process.
    let output = tokio::task::spawn_blocking(move || {
        std::process::Command::new("python3")
            .arg("-c")
            .arg(&python_code)
            .output()
    })
    .await
    .map_err(|e| format!("执行 faster-whisper 失败: {}", e))?
    .map_err(|e| format!("执行 faster-whisper 失败: {}", e))?;

    // Cleanup temp wav
    if let Some(ref wav) = temp_wav {
        let _ = std::fs::remove_file(wav);
    }

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        log::error!("[StoryFab] Whisper transcription failed: {}", stderr);

        // Provide helpful error message
        if stderr.contains("No module named") || stderr.contains("ModuleNotFoundError") {
            return Err("faster-whisper 未安装。请运行: pip install faster-whisper".to_string());
        }
        if stderr.contains("model not found") || stderr.contains("download") {
            return Err(format!(
                "Whisper {} 模型未找到，faster-whisper 会自动下载。错误: {}",
                model, stderr
            ));
        }
        return Err(format!("Whisper 转录失败: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: SubtitleResult = serde_json::from_str(&stdout)
        .map_err(|e| format!("解析 Whisper 输出失败: {e}"))?;

    let seg_count = result.segments.len();
    log::info!(
        "[StoryFab] Transcription complete: {} segments, lang={} ({:.2})",
        seg_count,
        result.language,
        result.language_probability
    );

    // Emit completion
    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: "转录完成".to_string(),
        progress: 1.0,
        current_segment: Some(seg_count as u32),
        total_segments: Some(seg_count as u32),
    });

    Ok(result)
}

/// Common languages supported by Whisper (code, name)
const WHISPER_LANGS: &[(&str, &str)] = &[
    ("auto", "自动检测"),
    ("zh", "中文"),
    ("en", "英语"),
    ("ja", "日语"),
    ("ko", "韩语"),
    ("fr", "法语"),
    ("de", "德语"),
    ("es", "西班牙语"),
    ("pt", "葡萄牙语"),
    ("it", "意大利语"),
    ("ru", "俄语"),
    ("ar", "阿拉伯语"),
    ("hi", "印地语"),
    ("id", "印尼语"),
    ("ms", "马来语"),
    ("th", "泰语"),
    ("vi", "越南语"),
];

/// Get supported languages for whisper transcription
#[tauri::command]
pub fn get_whisper_supported_languages() -> Vec<serde_json::Value> {
    WHISPER_LANGS
        .iter()
        .map(|(code, name)| serde_json::json!({"code": code, "name": name}))
        .collect()
}
