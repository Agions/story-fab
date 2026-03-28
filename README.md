# StoryForge

<p align="center">
  <img src="./public/logo.svg" alt="StoryForge" width="128" />
</p>

<h3 align="center">AI-Powered Video Storytelling Platform</h3>
<h4 align="center">面向影视创作者和内容创作者的智能视频叙事平台</h4>

<p align="center">
  <a href="https://github.com/agions/storyforge/releases">
    <img src="https://img.shields.io/github/v/release/agions/storyforge?include_prereleases&label=latest" alt="Release" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tauri-2.x-FFC107?logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/AI-GPT%2BClaude-Gold?logo=openai" alt="AI Models" />
  <img src="https://img.shields.io/github/stars/agions/storyforge" alt="Stars" />
  <img src="https://img.shields.io/github/forks/agions/storyforge" alt="Forks" />
</p>

---

## 📖 Table of Contents

- [About](#about)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🎬 Editing Modes](#-editing-modes)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## About

**StoryForge** is a professional AI-powered video content creation platform designed for filmmakers and content creators. It provides intelligent script generation, video analysis, and smart editing capabilities — all powered by cutting-edge AI models.

Unlike traditional video editors, StoryForge understands the **story** within your footage. It can analyze narrative structures, detect emotional beats, identify plot points, and automatically generate edits that preserve the integrity of your storytelling.

---

## ✨ Features

### 🎭 Intelligent Editing Modes

| Mode | Description |
|------|-------------|
| **🎬 AI Narration** | Auto-generate professional voice-over narration scripts |
| **🔥 Smart Clip** | AI identifies best moments, generates highlight reels |
| **📝 First-Person POV** | Transform videos into personal narrative experiences |
| **🔄 Video Remix** | Intelligent video recombination with uniqueness checking |
| **🎭 Plot Analysis** *(New!)* | Understand narrative structure, analyze plot points, generate story-driven edits |

### 🤖 AI-Powered Core

- **Scene Detection** — Automatic scene boundary identification
- **Audio Peak Recognition** — Detect applause, laughter, music moments
- **Motion Analysis** — Understand action intensity throughout footage
- **Emotion Recognition** — Track emotional tone changes in scenes
- **Speech-to-Text (ASR)** — Accurate transcription with timestamps
- **OCR** — Extract visible text from footage

### 🎵 Production Tools

- **Smart Subtitles** — Auto-generate, translate, and style subtitles
- **Auto Music** — AI-matched background music based on video mood
- **Multi-Model Support** — OpenAI GPT, Claude, Gemini, Qwen, GLM, DeepSeek, Kimi

### 💻 Desktop Native

- **Local Processing** — All data stays on your machine
- **Lightweight** — Built with Tauri (Rust + WebView)
- **Cross-Platform** — Windows, macOS, Linux ready

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Rust | Latest stable (optional for dev) |
| FFmpeg | Required for video processing |

### Installation

```bash
# Clone the repository
git clone https://github.com/agions/storyforge.git
cd storyforge

# Install dependencies
npm install

# Start development
npm run dev
```

### Build

```bash
# Frontend only
npm run build

# Full Tauri desktop app
npm run tauri dev    # Development mode
npm run tauri build  # Production build
```

### Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend development server |
| `npm run build` | Production build |
| `npm run tauri dev` | Tauri development mode |
| `npm run tauri build` | Build desktop app |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint validation |
| `npm run test` | Run test suite |
| `npm run docs:dev` | Documentation server |

---

## 🎬 Editing Modes

### 🎭 Plot Analysis Mode (New)

The newest addition to StoryForge — a narrative-first editing approach:

```
User uploads video
       ↓
AI analyzes content (scenes, dialogue, emotions)
       ↓
Generates "Plot Timeline" with tagged story beats
       ↓
User selects desired story elements:
  • "Highlight Moments"
  • "Emotional Turns"
  • "Plot Climax"
       ↓
AI auto-generates story-driven edit
       ↓
Output versions:
  📼 Full Narrative (complete story)
  ✂️ Highlights Reel (best moments)
  ⚡ Intense Mix (action-packed)
```

**Use cases:**
- Documentary editing with narrative preservation
- Event videos that need story structure
- Interview compilations with coherent flow
- Cinematic content requiring plot-aware cuts

### 🎬 AI Narration Mode

Upload footage → AI analyzes content → Generate professional narration script → Synthesize voice-over → Export

### 🔥 Smart Clip Mode

Upload footage → AI detects peaks (applause, laughter, action) → Auto-generate highlight reel → Manual fine-tune → Export

### 📝 First-Person POV Mode

Transform third-person footage into personal narrative experiences with AI-generated perspective shifts.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│   React 18 + TypeScript + Ant Design + Zustand (State)      │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                            │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ PlotAnalysis │  AIClip      │  Vision      │            │
│  │ Service      │  Service     │  Service     │            │
│  └──────────────┴──────────────┴──────────────┘            │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ ASR Service  │  Subtitle    │  Export      │            │
│  │              │  Service     │  Service     │            │
│  └──────────────┴──────────────┴──────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                   AI Model Adapter Layer                      │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ OpenAI       │ Anthropic    │ Google       │            │
│  │ GPT-5        │ Claude 4     │ Gemini 3     │            │
│  └──────────────┴──────────────┴──────────────┘            │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ Qwen (Aliyun)│ GLM (Zhipu)  │ DeepSeek     │            │
│  └──────────────┴──────────────┴──────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                  Tauri Backend (Rust)                        │
│  FFmpeg Integration │ File System │ Native Dialogs         │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/core/services/
├── plotAnalysis.service.ts   # NEW: Narrative/story analysis
├── aiClip.service.ts         # Smart clipping
├── vision.service.ts        # Scene detection, keyframes
├── asr.service.ts           # Speech recognition
├── subtitle.service.ts      # Subtitle generation
├── ai.service.ts            # AI model adapter (unified)
└── ...

src/components/
├── AIPanel/                 # AI feature panels
│   ├── ClipFlow/            # Clip mode UI
│   └── ...
├── editor/                  # Timeline/track editor
└── common/                  # Shared components

src/core/types/              # TypeScript domain models
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 18 + TypeScript 5 |
| **UI Library** | Ant Design 5 |
| **State Management** | Zustand 5 |
| **Desktop Runtime** | Tauri 2.x (Rust) |
| **Build Tool** | Vite 6 |
| **Testing** | Vitest |
| **AI Services** | OpenAI, Anthropic, Google, Alibaba, Zhipu, DeepSeek, Moonshot |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/storyforge.git

# Create feature branch
git checkout -b feature/your-feature

# Install dependencies
npm install

# Develop
npm run dev

# Run tests
npm run test

# Lint
npm run lint

# Submit PR
git push origin feature/your-feature
```

---

## 📄 License

MIT License — free for personal and commercial use.

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) — Lightweight desktop framework
- [Ant Design](https://ant.design/) — UI component library
- [FFmpeg](https://ffmpeg.org/) — Video processing engine
- All contributing developers and beta testers

---

<p align="center">
  <strong>If this project helps you, please give it a ⭐ Star!</strong>
</p>
