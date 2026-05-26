# StoryFab 🎬

> AI 影视/短剧解说创作工具 — 智能拆条 + 解说生成 + 配音合成，一站式本地完成

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-gray?style=flat-square)]()

**StoryFab** 是一款本地 AI 驱动的视频创作工具，基于 Tauri 2.x（Rust + React + TypeScript）构建。支持**剪辑模式**和**解说模式**两种工作流，帮你从直播回放、游戏高光一路搞定到电影解说。

---

## ✨ 核心功能

### 🤖 双模式工作流

| 模式 | 适用场景 | 工作流 |
|------|---------|--------|
| **剪辑模式** | 直播回放、会议记录、游戏高光 | 视频 → AI 分析 → 高光检测 → 片段导出 |
| **解说模式** | 短剧解说、电影解说、综艺解说 | 视频 → 语义分段 → AI 导演 → 解说词 → TTS 配音 → 成片 |

### 🎯 主要能力

- 🧠 **AI 智能拆条** — 自动识别高光片段，精准切分长视频
- 📝 **AI 解说生成** — LLM 理解剧情结构，生成专业解说文案
- 🎙️ **本地 Whisper 字幕** — 无需上传云端，本地语音转文字
- 🎭 **导演 Agent** — 多轮交互式策划解说结构与风格
- 🔊 **TTS 配音合成** — Edge TTS 本地合成自然流畅的配音
- 📐 **多比例导出** — 支持 9:16、1:1、16:9 等多分辨率

### 💡 技术亮点

- **本地优先** — 所有 AI 处理均在本地完成，保护隐私
- **Rust 性能** — Tauri 底层调用 FFmpeg，性能高效
- **双引擎支持** — Azure TTS / Edge TTS 多种语音引擎
- **交互式创作** — 导演 Agent 多轮交互，精准把控解说质量

---

## 🚀 快速开始

### 前置要求

- **Node.js** ≥ 18
- **Rust** ≥ 1.70
- **FFmpeg**（系统路径下可用 `ffmpeg -version`）

### 安装 & 启动

```bash
# 克隆仓库
git clone https://github.com/Agions/story-fab.git
cd story-fab

# 安装依赖
npm install

# 启动开发模式
npm run tauri dev
```

> 首次运行会自动下载 Whisper 模型和 TTS 语音文件（约 100MB），请保持网络连接。

### 构建发布版

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────────┐
│                    前端 (Web)                        │
│              React 18 + TypeScript                   │
│           React Context 状态管理 · Vite               │
└───────────────────────┬──────────────────────────────┘
                        │ Tauri IPC (invoke)
┌───────────────────────▼──────────────────────────────┐
│                   后端 (Rust)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌────────┐  │
│  │  FFmpeg  │ │ Whisper  │ │   LLM    │  │  TTS   │  │
│  │ 转码/字幕│ │ 语音识别 │ │ 脚本生成 │  │ 配音   │  │
│  └──────────┘ └──────────┘ └──────────┘  └────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌────────┐  │
│  │ 混音合成 │ │ 智能拆条 │ │ 渲染引擎 │  │ 导演   │  │
│  │          │ │          │ │          │  │ Agent  │  │
│  └──────────┘ └──────────┘ └──────────┘  └────────┘  │
└──────────────────────────────────────────────────────┘
```

**前端**：React 18 + TypeScript + Vite，构建工具链完整  
**后端**：Rust + Tauri 2.x + tokio 异步运行时  
**AI**：Whisper 本地语音识别 + LLM 解说生成 + Edge TTS 配音

---

## 📂 项目结构

```
story-fab/
├── src/                          # 前端源码
│   ├── components/                # React 组件
│   │   ├── StoryFab/             # 工作流核心组件
│   │   └── CommentaryPanel/      # 解说模式面板
│   ├── core/                     # 核心业务逻辑
│   │   ├── services/            # 视频/音频服务
│   │   └── workflow/           # 工作流定义
│   ├── hooks/                   # 自定义 Hooks
│   ├── store/                   # 状态管理
│   └── pages/                  # 页面入口
├── src-tauri/                   # Rust 后端
│   └── src/
│       ├── commands/            # Tauri IPC 命令
│       │   ├── commentary/      # 解说模式指令
│       │   │   ├── director.rs          # 导演 Agent
│       │   │   ├── script_generator.rs  # 解说词生成
│       │   │   └── commentary_synthesizer.rs  # TTS 合成
│       │   ├── render/         # 渲染指令
│       │   └── template/       # 模板管理
│       ├── video_processor.rs # 视频处理核心
│       ├── smart_segmenter.rs  # AI 智能拆条
│       └── binary.rs          # 工具管理
├── docs/                        # VitePress 文档
│   ├── guide/                   # 用户指南
│   └── dev/                     # 开发文档
└── package.json
```

---

## 🛠️ 相关命令

```bash
npm run dev              # 前端开发服务器（Vite）
npm run tauri dev        # 启动 Tauri 开发模式
npm run tauri build     # 构建生产版本
npm run test            # 运行 Vitest 单元测试
npm run lint            # ESLint 代码检查
```

---

## 📚 文档

👉 **[在线文档站点](https://agions.github.io/story-fab/)** — 完整使用指南与开发文档

| 文档 | 说明 |
|------|------|
| [用户指南](https://agions.github.io/story-fab/guide/) | 功能介绍与操作流程 |
| [快速开始](https://agions.github.io/story-fab/guide/quick-start.html) | 5 分钟上手教程 |
| [架构设计](https://agions.github.io/story-fab/dev/architecture.html) | 系统架构详解 |
| [Tauri 命令](https://agions.github.io/story-fab/dev/tauri-commands.html) | 前后端通信接口 |

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 License

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。

Copyright © 2024-present [Agions](https://github.com/Agions)