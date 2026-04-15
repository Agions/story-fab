<div align="center">

<!-- Logo -->
<p>
  <img src="./docs/public/logo.svg" alt="CutDeck" width="120" />
</p>

<!-- Project Name -->
<h1 style="
  font-family: 'Syne', system-ui, sans-serif;
  font-size: 3.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #f8fafc 0%, #fcd34d 50%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0.5rem 0;
">CutDeck</h1>

<!-- Tagline -->
<p style="font-size: 1.15rem; color: #94a3b8; margin: 0 0 2rem;">
  AI 驱动的专业视频剪辑工具 &nbsp;·&nbsp; 长视频一键自动拆条 &nbsp;·&nbsp; 多平台分发
  <br>
  <span style="font-size: 0.95rem;">AI-Powered Professional Video Editor &nbsp;·&nbsp; One-Click Long Video Splitting &nbsp;·&nbsp; Multi-Platform Distribution</span>
</p>

<!-- Badges -->
<p>

[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square&logo=opensourceinitiative)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.75+-DEA584?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Agions/CutDeck/main.yml?style=flat-square&logo=github)](https://github.com/Agions/CutDeck/actions)
[![Stars](https://img.shields.io/github/stars/Agions/CutDeck?style=flat-square&logo=github&color=f59e0b)](https://github.com/Agions/CutDeck/stargazers)

</p>

</div>

---

## 🎯 解决的问题 | The Problem We Solve

传统视频剪辑的最大痛点：**一个长视频，想拆成多个短片段分发到不同平台，需要人工反复观看、逐个标记、手动导出。**

The biggest pain point in traditional video editing: **A long video needs to be split into multiple short clips for different platforms, requiring repeated manual viewing, marking, and exporting.**

CutDeck 用 AI 把这个过程自动化：

CutDeck automates this process with AI:

```
长视频（直播回放 / 会议录像 / 讲座）→ AI 自动分析 → 多个精彩短片段 → 多格式导出 → 一键发布
Long Video (Live Replay / Meeting Recording / Lecture) → AI Analysis → Multiple Highlight Clips → Multi-Format Export → One-Click Publish
```

| 场景 Scenario | 传统方式 Traditional | CutDeck |
|------|---------|---------|
| 抖音创作者 Douyin Creator | 人工选段 + 导出 Manual selection + export | AI 识别高光 + 一键 9:16 导出 AI highlight detection + one-click 9:16 export |
| 知识付费 Knowledge Pay | 逐帧标记 Frame-by-frame marking | AI 识别关键内容 + SEO 生成 AI key content detection + SEO generation |
| 会议记录 Meeting Notes | 手动截取 Manual clipping | AI 自动分段 + 多格式输出 AI auto-segmentation + multi-format output |

---

## ✨ 核心功能 | Key Features

### 🎬 AI 智能拆条 | AI Smart Clipping (v1.9.1)

**长视频 → 多个精彩短片段，一键分发全平台**

**Long Video → Multiple Highlight Clips, One-Click Distribution to All Platforms**

- **6 维 AI 评分**：笑声密度 / 情感峰值 / 内容完整度 / 静默比 / 节奏感 / 关键词权重
- **6-Dimensional AI Scoring**: Laughter density / Emotional peaks / Content completeness / Silence ratio / Rhythm / Keyword weight
- **SEO 元数据**：自动生成标题 / 描述 / Hashtags，平台原生适配
- **SEO Metadata**: Auto-generated titles / descriptions / hashtags, platform-native adaptation
- **多格式导出**：9:16 竖屏（抖音）/ 1:1 方屏（小红书）/ 16:9 横屏（B站）
- **Multi-Format Export**: 9:16 portrait (Douyin) / 1:1 square (Xiaohongshu) / 16:9 landscape (Bilibili)
- **平台适配**：抖音 · 小红书 · B站 · YouTube Shorts · TikTok
- **Platform Support**: Douyin · Xiaohongshu · Bilibili · YouTube Shorts · TikTok

### 🎙️ Whisper 字幕 | Whisper Subtitles

本地 Whisper ASR 驱动，精准语音识别 + 毫秒级时间轴对齐，支持多语言。

Powered by local Whisper ASR, providing precise speech recognition + millisecond-level timestamp alignment, supporting multiple languages.

### 🎞️ Rust 渲染引擎 | Rust Rendering Engine

Tauri 2 + FFmpeg 原生渲染管线，无质量损失，跨平台桌面应用。

Tauri 2 + FFmpeg native rendering pipeline, lossless quality, cross-platform desktop application.

### ⌨️ 专业剪辑体验 | Professional Editing Experience

- 多轨道时间轴（视频 / 音频 / 字幕独立轨道）
- Multi-track timeline (video / audio / subtitle independent tracks)
- 20+ 全局快捷键（空格 / I-O 入出点 / J-K-L 逐帧 / ⌘Z 撤销）
- 20+ global shortcuts (Space / I-O in-out points / J-K-L frame-by-frame / ⌘Z undo)
- Timeline 虚拟化（100+ clips 无卡顿）
- Timeline virtualization (100+ clips without lag)

---

## 🚀 快速开始 | Quick Start

```bash
# 克隆项目 | Clone the project
git clone https://github.com/Agions/CutDeck.git
cd CutDeck

# 安装依赖 | Install dependencies
npm install

# 配置 AI（复制并编辑 .env）| Configure AI (copy and edit .env)
cp .env.example .env
# 填入 API Key（推荐 DeepSeek，性价比最高）| Fill in API Key (DeepSeek recommended, best cost-performance)

# 启动开发服务器 | Start development server
npm run dev
# 访问 | Visit http://localhost:1430
```

> 详细文档 | Detailed documentation: https://agions.github.io/CutDeck

---

## 🤖 支持的 AI 模型 | Supported AI Models

只需配置**一个** API Key 即可使用全部 AI 功能：

Only configure **one** API Key to use all AI features:

| 提供商 Provider | 推荐模型 Recommended Model | 适用场景 Use Case |
|--------|----------|----------|
| DeepSeek | V3.2 | 🏆 **性价比最高** Best cost-performance, clip script generation |
| OpenAI | GPT-4o | 剧情分析、内容理解 Plot analysis, content understanding |
| Anthropic | Claude Sonnet 4 | 长文本分析 Long text analysis |
| 阿里云 Aliyun | Qwen 2.5-Max | 中文内容创作 Chinese content creation |
| Kimi | K2.5 | 长文本分析 Long text analysis |

详细配置参考 | Detailed configuration: [AI 模型配置](./docs/ai-config.md)

---

## 🏗️ 技术架构 | Technical Architecture

```
CutDeck/
├── src/                          # React 18 前端 | React 18 frontend
│   ├── components/               # UI 组件 | UI components
│   │   ├── AIPanel/             # AI 功能面板 | AI function panel
│   │   ├── editor/              # 视频编辑器 | Video editor
│   │   └── common/             # 通用组件 | Common components
│   ├── core/                    # 核心业务逻辑 | Core business logic
│   │   ├── services/            # AI · 视频 · 剪辑 · 字幕服务 | AI · Video · Editing · Subtitle services
│   │   ├── hooks/              # 自定义 Hooks（含虚拟化）| Custom Hooks (with virtualization)
│   │   └── store/              # Zustand 状态管理 | Zustand state management
│   └── pages/                   # 页面路由 | Page routes
├── src-tauri/                   # Tauri 2.x 桌面应用 | Tauri 2.x desktop app
│   └── src/
│       ├── lib.rs              # Tauri 命令（Rust）| Tauri commands (Rust)
│       └── video_processor.rs  # FFmpeg 封装 | FFmpeg wrapper
├── docs/                       # VitePress 在线文档 | VitePress online documentation
│   ├── guide/                  # 使用指南 | User guides
│   └── public/                 # 静态资源 | Static assets
└── public/                     # Web 静态资源 | Web static assets
```

**技术栈 | Tech Stack：**

| 层级 Layer | 技术 Tech |
|------|------|
| 前端框架 Frontend | React 18 + TypeScript 5 |
| 状态管理 State | Zustand |
| UI 组件 UI | Ant Design 5 |
| 桌面运行时 Desktop | Tauri 2.x |
| 后端语言 Backend | Rust |
| 视频处理 Video | FFmpeg |
| 语音识别 ASR | faster-whisper |
| 构建工具 Build | Vite 6 |
| 测试 Testing | Vitest + Testing Library |

---

## 📖 文档 | Documentation

| 文档 Documentation | 说明 Description |
|------|------|
| [快速开始 Quick Start](https://agions.github.io/CutDeck/guide/quick-start) | 5 分钟上手 Get started in 5 minutes |
| [功能介绍 Features](https://agions.github.io/CutDeck/features) | 全部核心功能 All core features |
| [AI 智能拆条指南 AI Clipping Guide](https://agions.github.io/CutDeck/guide/clip-repurpose) | ClipRepurposing Pipeline 完整说明 Complete ClipRepurposing Pipeline guide |
| [Whisper 字幕 Whisper Subtitles](https://agions.github.io/CutDeck/guide/subtitle) | ASR 字幕生成 ASR subtitle generation |
| [多格式导出 Multi-Format Export](https://agions.github.io/CutDeck/guide/export) | 9:16 / 1:1 / 16:9 导出说明 9:16 / 1:1 / 16:9 export guide |
| [安装配置 Installation](https://agions.github.io/CutDeck/installation) | 详细安装与故障排查 Detailed installation & troubleshooting |
| [常见问题 FAQ](https://agions.github.io/CutDeck/faq) | FAQ |
| [贡献指南 Contributing](https://agions.github.io/CutDeck/contributing) | 如何参与贡献 How to contribute |

---

## 🤝 参与贡献 | Contributing

欢迎各种形式的贡献 | All forms of contributions are welcome:

| 方式 Way | 说明 Description |
|------|------|
| 🐛 报告 Bug Report Bug | [GitHub Issues](https://github.com/Agions/CutDeck/issues) |
| 📝 完善文档 Improve Docs | 直接提交 PR Submit PR directly |
| 💡 功能建议 Feature Request | [GitHub Issues](https://github.com/Agions/CutDeck/issues) |
| 🔧 提交代码 Submit Code | Fork → PR → Review |

---

## 📄 许可证 | License

[MIT License](LICENSE) · Copyright © 2025-2026 [Agions](https://github.com/Agions)

---

<div align="center">

如果你觉得有帮助，点一个 ⭐ | If you find this helpful, please give a ⭐

</div>
