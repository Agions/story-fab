# Introduction

CutDeck is an **AI-driven professional video editing desktop application** built with Tauri 2.x (Rust + React + TypeScript). It transforms long videos into engaging short clips with one click — driven by local AI models, no uploads required.

## Why CutDeck?

| Scenario | Traditional Workflow | CutDeck |
|---|---|---|
| Find highlights | Watch entire video manually | AI detects top moments automatically |
| Create subtitles | Upload to cloud service | Local Whisper, zero upload |
| Format for social | Manual aspect ratio editing | One-click 9:16 / 1:1 / 16:9 |
| Edit pacing | Frame-by-frame cutting | AI script generation with TTS |

## Core Features

### AI Analysis
Upload a long video, CutDeck uses **OpenAI Whisper** (running locally) to transcribe audio, then applies highlight detection algorithms to identify the most engaging segments.

### Script Generation
CutDeck generates concise, engaging scripts for each detected highlight using AI, and can synthesize voice-over narration via **Edge TTS**.

### Multi-Format Export
Export your clips in any aspect ratio optimized for each platform:

- **9:16** — TikTok, Instagram Reels, YouTube Shorts
- **1:1** — Instagram Feed
- **16:9** — YouTube, Twitter/X

### Subtitle Burn-in
Burn accurate, synced subtitles directly into the exported video. All processing is local.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            WebView (React 18 SPA)                   │
│                                                     │
│  UI Layer → State (Zustand) → Services → IPC Bridge │
└──────────────────────┬──────────────────────────────┘
                       │ Tauri IPC
┌──────────────────────▼──────────────────────────────┐
│              Tauri Backend (Rust)                   │
│                                                     │
│  FFmpeg · Whisper · Edge TTS · FileSystem           │
└─────────────────────────────────────────────────────┘
```

## Supported Platforms

- **Windows** 10/11 (x64)
- **macOS** 12+ (Apple Silicon & Intel)
- **Linux** (AppImage / .deb)

## License

CutDeck is open-source under the [MIT License](https://github.com/Agions/CutDeck/blob/main/LICENSE).
