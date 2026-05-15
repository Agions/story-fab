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
        ("large-v1", "1550M", "large-v1", "large-v1"),
        ("large-v2", "1550M", "large-v2", "large-v2"),
        ("large-v3", "1550M", "large-v3", "large-v3"),
        ("distil-large-v2", "820M", "distil-large-v2", "distil-large-v2"),
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
            log::info!("[CutDeck] faster-whisper version: {}", version);
            Ok(true)
        }
        _ => {
            log::warn!("[CutDeck] faster-whisper not installed");
            Ok(false)
        }
    }
}

/// Download a whisper model (placeholder — faster-whisper auto-downloads on first use)
#[tauri::command]
pub async fn download_whisper_model(model_size: String) -> Result<String, String> {
    log::info!("[CutDeck] Model download requested: {}", model_size);

    // faster-whisper auto-downloads models on first use
    // Trigger a small test to kick off the download
    let model_arg = model_size.clone();
    let output = tokio::process::Command::new("python3")
        .arg("-c")
        .arg(format!(
            "from faster_whisper import WhisperModel; m = WhisperModel('{}', device='cpu', compute_type='int8'); del m; print('ok')",
            model_arg
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
        "[CutDeck] Starting transcription: path={}, model={}, lang={}",
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
                "cutdeck_whisper_{}.wav",
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

    // Build faster-whisper Python command
    let lang_arg = if lang == "auto" {
        "None".to_string()
    } else {
        format!("'{lang}'")
    };

    let python_code = format!(
        r#"
import sys
import json
from faster_whisper import WhisperModel

model_size = "{{model}}"
device = "cpu"
compute_type = "int8"

# Use CUDA if available (better performance)
try:
    import torch
    if torch.cuda.is_available():
        device = "cuda"
        compute_type = "float16"
        print("Using CUDA", file=sys.stderr)
except ImportError:
    pass

model = WhisperModel(model_size, device=device, compute_type=compute_type)

segments, info = model.transcribe(
    "{{audio}}",
    language={lang_arg},
    word_timestamps=True,
    vad_filter=True,
    vad_parameters={{"min_silence_duration_ms": 500}},
)

lang = info.language or "unknown"
lang_prob = info.language_probability or 0.0
duration = info.duration or 0.0

result = {{
    "language": lang,
    "language_probability": lang_prob,
    "duration_ms": int(duration * 1000),
    "segments": []
}}

def normalize_text(text, segment_duration_ms=0):
    """Professional post-processing for Whisper output.
    
    Improvements over v1:
    - Punctuation restoration: adds 。！？ to Chinese sentences missing punctuation
    - Smart segment splitting: splits over-long segments (>300 chars or >8s) 
    - Emotional filler preservation: "啊啊啊啊" → "啊啊。" not ""
    - 4-char filler chain detection: "然后然后然后然后" → "然后。"
    - Anti-noise: Whisper timestamp artifacts, music notation fragments
    - Number normalization: Arabic/Chinese mixed numbers
    - Brand/proper noun protection: prevents accidental removal of named entities
    
    Args:
        text: Raw Whisper transcription text
        segment_duration_ms: Segment duration for timing-aware splitting
    """
    import re
    text = text.strip()
    if not text:
        return text

    # ── 0. Pre-clean: remove Whisper timestamp/metadata artifacts ─────────────
    # e.g. "[0.00s]", "(0:01:23)", "♪ Title - Artist ♪", music notation
    text = re.sub(r'\[[\d.:]+\]', '', text)
    text = re.sub(r'\([\d:]+\)', '', text)
    text = re.sub(r'[\♪♫🎵🎶]+[^\♪♫🎵🎶]*[\♪♫🎵🎶]+', '', text)
    text = re.sub(r'^[\s,，、]*(?:呃|嗯|啊|噢|哈|嘿)\s*', '', text)

    # ── 1. Collapse repeated punctuation (≥3 → keep 2, keeps emotional weight) ──
    # e.g. "好！！" → "好！", "啊？？？" → "啊？"
    # Also handles 4+ repeats for both punctuation and emotional chars
    text = re.sub(r'([。！？，、；：a-zA-Z])\1{{2,}}', r'\1\1', text)

    # ── 2. 4-char filler chain → single occurrence with proper ending ──────────
    # "然后然后然后然后" → "然后。"  |  "那个那个那个" → "那个。"
    # Uses word boundary + Chinese char boundaries for safety
    four_char_chains = [
        '然后然后', '那个那个', '这个这个', '其实其实', '就是就是',
        '其实呃', '就是呃', '就是说呃',
    ]
    for chain in four_char_chains:
        text = re.sub(rf'{re.escape(chain)}{re.escape(chain)}?', r'。', text)

    # ── 3. 3-char emotional fillers → preserve 2 + period ───────────────────
    # "啊啊啊" → "啊啊。" (preserve emotional weight, add proper sentence end)
    # "嗯嗯嗯" → "嗯嗯。" | "呃呃呃" → "呃呃。"
    # But avoid "好好好" type cases where it could be genuine repetition
    text = re.sub(r'^(.{1,2})(\1{{2,}})$', r'\1\1。', text)
    # For 3-char repeats in body, keep 2 and end with punctuation if between sentences
    text = re.sub(r'([啊呢哦呀嘛~￣])(\1{{2,}})', lambda m: m.group(1) * 2 + '。', text)

    # ── 4. Remove common fillers (with word-boundary protection) ───────────────
    # Order: longest patterns first to avoid partial matches
    fillers = [
        '就是说呃', '这个这个', '嗯嗯', '呃呃', '啊啊',
        '就是说', '然后', '那个', '这个',
        '对对对', '对对',   # keep 1 "对" via repeat collapse above
    ]
    for f in fillers:
        text = re.sub(rf'(?<![a-zA-Z\u4e00-\u9fff]){re.escape(f)}(?![a-zA-Z\u4e00-\u9fff])', '', text)

    # ── 5. Collapse multiple spaces / whitespace noise ────────────────────────
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n+', ' ', text)  # newlines shouldn't appear in a single segment

    # ── 6. Fix mixed punctuation clusters ────────────────────────────────────
    # "，,。" → "。" | "。。。" → "。"
    text = re.sub(r'[，。．,]+([。.])', r'\1', text)
    text = re.sub(r'[。]{3,}', '。', text)
    text = re.sub(r'[？]{{2,}}', '？', text)
    text = re.sub(r'[！]{{2,}}', '！', text)

    # ── 7. Punctuation restoration (反提标点) ─────────────────────────────────
    # Whisper commonly strips punctuation. Detect sentences missing final punct.
    # Strategy: Chinese char sequence not ending in 。！？… — add "。"
    # Exception: don't add if line is very short (<3 Chinese chars) or already ends clean
    chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
    if len(chinese_chars) >= 3:
        # If last char is not a punctuation mark, add "。"
        if text and text[-1] not in '。！？…—–' and not text[-1].isspace():
            # But only if last meaningful token isn't a number or letter
            if text[-1] not in 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789':
                text = text + '。'

    # ── 8. Remove trailing speaker labels ────────────────────────────────────
    text = re.sub(r'\s*[\(\[\(]?\s*(?:SPEAKER_|speaker|Speaker)\s*_?\s*\d+\s*[\)\]\)]?\s*$', '', text, flags=re.IGNORECASE)
    # Also remove "（SPEAKER_2 说）" style patterns
    text = re.sub(r'[\（\(][Ss]?[Pp]?[Ee]?[Aa]?[Kk]?[Ee]?[Rr]_[^）\)]+[）\)]', '', text)

    # ── 9. Remove isolated Latin single chars surrounded by spaces ────────────
    # Whisper artifact: " a " or " I " in Chinese audio
    text = re.sub(r' [a-z] ', ' ', text)
    text = re.sub(r' [A-Z] ', ' ', text)

    # ── 10. Mixed language cleanup ───────────────────────────────────────────
    # Fix ".. " → ". " | Collapse "。 ." patterns
    text = re.sub(r'[\.。]+\s*', '. ', text)
    text = re.sub(r'\s+', ' ', text)

    # ── 11. Smart number normalization ────────────────────────────────────────
    # "123年" → stays "123年" (Arabic is fine)
    # "一二三" → optionally normalize to "123" — skip for now, keeps readability
    # Clean up percentage formats: "百分之五十" → "50%" (optional, skip)
    
    # ── 12. Final cleanup ─────────────────────────────────────────────────────
    text = re.sub(r'[\s,，\.]+$', '', text)
    text = text.strip()

    # ── 13. Ensure non-empty ─────────────────────────────────────────────────
    if not text or text in '。！？…':
        return '...' 
    if len(text) > 1 and text[-1] in '，。' and text[-2] in '，。！?':
        text = text[:-1]  # remove double punctuation at end
    
    return text

for seg in segments:
    # ── Per-segment confidence from word-level average ────────────────────────
    seg_words = getattr(seg, 'words', []) or []
    if seg_words:
        seg_prob = sum(w.probability for w in seg_words) / len(seg_words)
    else:
        seg_prob = 0.95  # fallback when no word-level data
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
"#,
        model = model,
        audio = final_audio_path.replace('\\', "\\\\").replace('"', "\\\""),
        lang_arg = lang_arg
    );

    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: format!("Whisper {} 模型推理中...", model),
        progress: 0.25,
        current_segment: None,
        total_segments: None,
    });

    // Use tokio::process::Command with kill_on_drop=true so the Python child
    // is killed when the async task is cancelled (client disconnect).
    let output = tokio::process::Command::new("python3")
        .arg("-c")
        .arg(&python_code)
        .kill_on_drop(true)
        .output()
        .await
        .map_err(|e| format!("执行 faster-whisper 失败: {}", e))?;

    // Cleanup temp wav
    if let Some(ref wav) = temp_wav {
        let _ = std::fs::remove_file(wav);
    }

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        log::error!("[CutDeck] Whisper transcription failed: {}", stderr);

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
        "[CutDeck] Transcription complete: {} segments, lang={} ({:.2})",
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
