# FAQ

## General

### What is ClipFlow?

ClipFlow is an AI-powered desktop video editing application that automatically transforms long videos into short, shareable clips optimized for social media platforms like TikTok, YouTube Shorts, and Instagram Reels.

### Is ClipFlow free?

Yes. ClipFlow is open-source under the MIT License and is free to use for personal and commercial purposes.

### What platforms does ClipFlow support?

ClipFlow runs on Windows 10/11, macOS 12+ (both Apple Silicon and Intel), and Linux.

### Does ClipFlow require an internet connection?

**No.** ClipFlow is designed to work fully offline. The only optional online features are AI script generation (which requires an API key from OpenAI, Anthropic, or DeepSeek). Whisper transcription and voice synthesis run entirely locally.

---

## Installation

### The installer won't open on macOS

macOS may block apps from unidentified developers. Right-click the `.dmg` file and select **Open**, then click **Open** in the dialog. Or run:

```bash
sudo xattr -rd com.apple.quarantine "/Applications/ClipFlow.app"
```

### FFmpeg not found

ClipFlow requires FFmpeg to be installed. See [Installation → FFmpeg](/reference/config#ffmpeg-installation) for installation instructions.

If FFmpeg is installed but in a non-standard location, set the `CUTDECK_FFMPEG_PATH` environment variable.

---

## AI Features

### How does highlight detection work?

ClipFlow analyzes audio energy, visual scene changes, and speech patterns to score segments. Higher-scoring segments are more likely to be engaging moments. See [AI Analysis](/guide/ai-analysis) for details.

### Which AI provider should I use?

| Provider | Best For | Cost |
|---|---|---|
| DeepSeek | Best value, good quality | Very low |
| OpenAI GPT-4o | Highest quality | High |
| Anthropic Claude | Balanced quality/safety | Medium |

All three are free to set up with your own API key. ClipFlow does not charge for AI usage.

### Can I run Whisper without an internet connection?

Yes. Whisper runs entirely locally using the `faster-whisper` Rust crate. No internet required.

---

## Export

### Why is the exported video so large?

Use a lower quality preset (Settings → Export → Quality → Low). This increases the CRF value, resulting in smaller files with slightly reduced quality.

### Can I export with subtitles only (no voice-over)?

Yes. In the export dialog, leave **Script** disabled and enable **Burn Subtitles**. This will embed the Whisper-generated subtitles directly into the video.

### What video formats are supported?

**Input:** MP4, MOV, AVI, MKV, WebM  
**Output:** MP4 (H.264 + AAC)

---

## Troubleshooting

### ClipFlow crashes on startup

Check the logs at:
- **Windows:** `%APPDATA%\ClipFlow\logs\`
- **macOS:** `~/Library/Application Support/ClipFlow/logs/`
- **Linux:** `~/.local/share/ClipFlow/logs/`

File a bug report at [GitHub Issues](https://github.com/Agions/ClipFlow/issues) with the log output.

### Video processing is very slow

- Use a GPU-enabled Whisper model (if you have an NVIDIA GPU with CUDA)
- Close other resource-heavy applications
- Reduce the number of concurrent tasks
- Use a faster Whisper model (e.g., `tiny` instead of `medium`)
