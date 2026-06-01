//! Audio transcription via faster-whisper — split from subtitle.rs

use crate::binary::resolve_binary_path;
use crate::subtitle::types::{SubtitleResult, TranscribeProgress};
use crate::utils::cmd_err;
use std::path::Path;
use std::process::Command;
use tauri::Emitter;

/// Extract audio from video file to a temporary WAV (16kHz mono) for whisper
pub fn extract_audio_to_wav(video_path: &str, output_wav: &Path) -> Result<(), String> {
    let ffmpeg = resolve_binary_path("ffmpeg");
    if ffmpeg.is_empty() {
        return Err("无法定位 ffmpeg，请设置 CUTDECK_FFMPEG_PATH 环境变量".to_string());
    }
    let output = Command::new(&ffmpeg)
        .args([
            "-y", "-i", video_path, "-vn", "-acodec", "pcm_s16le",
            "-ar", "16000", "-ac", "1", "-f", "wav",
            output_wav.to_str().unwrap_or(""),
        ])
        .output()
        .map_err(|e| format!("运行 ffmpeg 提取音频失败: {}", e))?;

    if !output.status.success() {
        return Err(cmd_err("ffmpeg 音频提取失败", &output));
    }
    Ok(())
}

/// Transcribe audio using faster-whisper
#[tauri::command]
pub async fn transcribe_audio(
    app: tauri::AppHandle,
    audio_path: String,
    model_size: Option<String>,
    language: Option<String>,
) -> Result<SubtitleResult, String> {
    let model = model_size.unwrap_or_else(|| "base".into());
    let lang = language.unwrap_or_else(|| "auto".into());

    log::info!("[StoryFab] Starting transcription: path={}, model={}, lang={}", audio_path, model, lang);

    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: "正在准备音频...".to_string(), progress: 0.05,
        current_segment: None, total_segments: None,
    });

    let input_ext = std::path::Path::new(&audio_path)
        .extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

    let audio_exts = ["wav", "mp3", "m4a", "flac", "ogg", "aac", "wma"];
    let temp_wav: Option<std::path::PathBuf> =
        if !audio_exts.contains(&input_ext.as_str()) {
            let wav_path = std::env::temp_dir().join(format!("story-fab_whisper_{}.wav", std::process::id()));
            extract_audio_to_wav(&audio_path, &wav_path).map_err(|e| format!("音频提取失败: {}", e))?;
            Some(wav_path)
        } else { None };

    let final_audio_path = temp_wav.as_ref().map(|p| p.display().to_string()).unwrap_or_else(|| audio_path.clone());

    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: "正在加载 Whisper 模型...".to_string(), progress: 0.15,
        current_segment: None, total_segments: None,
    });

    let lang_arg = if lang == "auto" { "None".to_string() } else { format!("'{}'", lang) };
    let audio_path_repr = format!("{:?}", &final_audio_path);

    let python_code = [
        r#"import sys
import json
from faster_whisper import WhisperModel

model_size=""#.to_string(), model.clone(),
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
        try:
            import openvino
            openvino_available = True
        except ImportError:
            openvino_available = False
        if openvino_available:
            device = "cpu"
            compute_type = "int8"
            print("Using OpenVINO (Intel GPU/CPU)", file=sys.stderr)
        else:
            batch_size = 16
            print("Using CPU with batch_size=16", file=sys.stderr)
except ImportError:
    pass

model = WhisperModel(model_size, device=device, compute_type=compute_type, num_workers=4, batch_size=batch_size)

segments, info = model.transcribe("#.to_string(), audio_path_repr,
        r#"", language="#.to_string(), lang_arg, r#"", word_timestamps=True, vad_filter=True, vad_parameters={"min_silence_duration_ms": 500})

lang = info.language or "unknown"
lang_prob = info.language_probability or 0.0
duration = info.duration or 0.0

result = {"language": lang, "language_probability": lang_prob, "duration_ms": int(duration * 1000), "segments": []}

def normalize_text(text, segment_duration_ms=0):
    import re
    text = text.strip()
    if not text:
        return text
    text = re.sub(r'\[[\d.:]+\]', '', text)
    text = re.sub(r'\([\d:]+\)', '', text)
    text = re.sub(r'[\♪♫🎵🎶]+[^\♪♫🎵🎶]*[\♪♫🎵🎶]+', '', text)
    text = re.sub(r'^[\s,，、]*(?:呃|嗯|啊|噢|哈|嘿)\s*', '', text)
    text = re.sub(r'([。！？，、；：a-zA-Z])\1{2,}', r'\1\1', text)
    four_char_chains = ['然后然后', '那个那个', '这个这个', '其实其实', '就是就是', '其实呃', '就是呃', '就是说呃']
    for chain in four_char_chains:
        escaped = re.escape(chain)
        text = re.sub(r'\B' + escaped + r'\B\B' + escaped + r'\B', r'。', text)
    text = re.sub(r'^(.{1,2})(\1{2,})$', r'\1\1。', text)
    text = re.sub(r'([啊呢哦呀嘛~￣])(\1{2,})', lambda m: m.group(1) * 2 + '。', text)
    fillers = ['就是说呃', '这个这个', '嗯嗯', '呃呃', '啊啊', '就是说', '然后', '那个', '这个', '对对对', '对对']
    for f in fillers:
        pat = r'(?<![a-zA-Z\u4e00-\u9fff])' + re.escape(f) + r'(?![a-zA-Z\u4e00-\u9fff])'
        text = re.sub(pat, '', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'[，。．,]+([。.])', r'\1', text)
    text = re.sub(r'[。.]{3,}', '。', text)
    text = re.sub(r'[？]{2,}', '？', text)
    text = re.sub(r'[！]{2,}', '！', text)
    chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
    if len(chinese_chars) >= 3:
        if text and text[-1] not in '。！？…—–' and not text[-1].isspace():
            if text[-1] not in 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789':
                text = text + '。'
    text = re.sub(r'\s*[\(\[\(]?\s*(?:SPEAKER_|speaker|Speaker)\s*_?\s*\d+\s*[\)\]\)]?\s*$', '', text, flags=re.IGNORECASE)
    text = re.sub(r'[\（\(][Ss]?[Pp]?[Ee]?[Aa]?[Kk]?[Ee]?[Rr]_[^）\)]+[）\)]', '', text)
    text = re.sub(r' [a-z] ', ' ', text)
    text = re.sub(r' [A-Z] ', ' ', text)
    text = re.sub(r'[\.。]+\s*', '. ', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[\s,，\.]+$', '', text)
    text = text.strip()
    if not text or text in '。！？…':
        return '...'
    if len(text) > 1 and text[-1] in '，。，' and text[-2] in '，。！？':
        text = text[:-1]
    return text

for seg in segments:
    seg_words = getattr(seg, 'words', []) or []
    seg_prob = sum(w.probability for w in seg_words) / len(seg_words) if seg_words else 0.95
    result["segments"].append({
        "start_ms": int(seg.start * 1000), "end_ms": int(seg.end * 1000),
        "text": normalize_text(seg.text),
        "words": [{"word": w.word, "start_ms": int(w.start * 1000), "end_ms": int(w.end * 1000), "probability": w.probability} for w in seg_words] if seg_words else [],
        "probability": round(seg_prob, 4),
    })

print(json.dumps(result, ensure_ascii=False))
"#.to_string()].join("");

    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: format!("Whisper {} 模型推理中... (这可能需要几分钟)", model), progress: 0.25,
        current_segment: None, total_segments: None,
    });

    let output = tokio::task::spawn_blocking(move || {
        std::process::Command::new("python3").arg("-c").arg(&python_code).output()
    })
    .await.map_err(|e| format!("执行 faster-whisper 失败: {}", e))?
    .map_err(|e| format!("执行 faster-whisper 失败: {}", e))?;

    if let Some(ref wav) = temp_wav {
        let _ = std::fs::remove_file(wav);
    }

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        log::error!("[StoryFab] Whisper transcription failed: {}", stderr);
        if stderr.contains("No module named") || stderr.contains("ModuleNotFoundError") {
            return Err("faster-whisper 未安装。请运行: pip install faster-whisper".to_string());
        }
        if stderr.contains("model not found") || stderr.contains("download") {
            return Err(format!("Whisper {} 模型未找到，faster-whisper 会自动下载。错误: {}", model, stderr));
        }
        return Err(format!("Whisper 转录失败: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: SubtitleResult = serde_json::from_str(&stdout).map_err(|e| format!("解析 Whisper 输出失败: {}", e))?;

    let seg_count = result.segments.len();
    log::info!("[StoryFab] Transcription complete: {} segments, lang={} ({:.2})", seg_count, result.language, result.language_probability);

    let _ = app.emit("whisper-progress", TranscribeProgress {
        stage: "转录完成".to_string(), progress: 1.0,
        current_segment: Some(seg_count as u32), total_segments: Some(seg_count as u32),
    });

    Ok(result)
}
