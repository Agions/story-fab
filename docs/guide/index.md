# Introduction

CutDeck is an **AI-driven professional video editing desktop application** built with Tauri 2.x (Rust + React + TypeScript). It transforms long videos into engaging short clips or full narration commentary videos — driven by local AI models, no uploads required.

## Two Modes: Clip Mode & Commentary Mode

CutDeck supports two distinct workflows:

### Clip Mode — 快速剪辑（原有）
将长视频自动剪辑成多个精彩片段，适合直播回放、会议记录等场景。

```
视频 → AI 分析 → 高光检测 → 片段选择 → 多格式导出
```

### Commentary Mode — AI 影视解说（🆕 v3.0）
将视频自动转化为完整的解说视频（带文案、配音、字幕），适合短剧、电影、综艺解说。

```
视频 → AI 分析 → 语义分段 → AI Director → 解说词生成 → 配音合成 → 渲染成片
```

## Why CutDeck?

| Scenario | Traditional Workflow | CutDeck Clip Mode | CutDeck Commentary Mode |
|---|---|---|---|
| Find highlights | Watch entire video manually | AI detects top moments automatically | AI understands plot, selects best segments |
| Create script | Write manually | — | LLM generates engaging commentary |
| Add narration | Record yourself | — | Edge TTS synthesizes voice-over |
| Create subtitles | Upload to cloud service | Local Whisper, zero upload | Local Whisper, zero upload |
| Format for social | Manual aspect ratio editing | One-click 9:16 / 1:1 / 16:9 | One-click 9:16 / 1:1 / 16:9 |

## Core Features

### 🤖 AI Analysis
Upload a long video, CutDeck uses **OpenAI Whisper** (running locally) to transcribe audio, then applies highlight detection algorithms to identify the most engaging segments.

### 🎬 Commentary Mode（🆕 v3.0）

**AI Director** — Multi-round agent that plans the narration structure, allows user review and modification.

**Script Generation** — LLM generates engaging commentary scripts based on plot understanding. Supports multiple styles (幽默/接地气/震惊/感动/专业).

**Commentary Synthesis** — Edge TTS synthesizes voice-over narration, automatically aligned with video timeline.

### ✍️ Script Generation
CutDeck generates concise, engaging scripts for each detected highlight using AI, and can synthesize voice-over narration via **Edge TTS**.

### 📐 Multi-Format Export
Export your clips in any aspect ratio optimized for each platform:

- **9:16** — TikTok, Instagram Reels, YouTube Shorts
- **1:1** — Instagram Feed
- **16:9** — YouTube, Twitter/X

### 🔤 Subtitle Burn-in
Burn accurate, synced subtitles directly into the exported video. All processing is local.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            WebView (React 18 SPA)                   │
│                                                     │
│  UI Layer → State (Zustand) → Services → IPC Bridge │
│                                                     │
│  Services:                                         │
│  ├── Clip Pipeline（7步剪辑，已有）                  │
│  └── Commentary Pipeline（🆕 解说管道）              │
│       ├── DirectorAgent（状态机）                   │
│       ├── ScriptGenerator（LLM 文案）               │
│       └── CommentarySynth（TTS 配音）               │
└──────────────────────┬──────────────────────────────┘
                       │ Tauri IPC
┌──────────────────────▼──────────────────────────────┐
│              Tauri Backend (Rust)                   │
│                                                     │
│  FFmpeg · Whisper · Edge TTS · LLM Proxy            │
└─────────────────────────────────────────────────────┘
```

## Supported Platforms

- **Windows** 10/11 (x64)
- **macOS** 12+ (Apple Silicon & Intel)
- **Linux** (AppImage / .deb)

## Commentary Style Examples

| Style | Description | Best For |
|-------|-------------|----------|
| 幽默版 | 诙谐有趣，添加网络梗 | 喜剧/搞笑视频 |
| 接地气版 | 口语化，像和朋友聊天 | 情感/生活类视频 |
| 震惊版 | 夸张震惊，制造悬念 | 悬疑/复仇类短剧 |
| 感动版 | 温情脉脉，情感共鸣 | 爱情/亲情类视频 |
| 专业版 | 客观冷静，纪录片风格 | 纪录片/科教类 |

## License

CutDeck is open-source under the [MIT License](https://github.com/Agions/CutDeck/blob/main/LICENSE).