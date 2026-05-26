# ClipFlow 🎬

> AI 影视/短剧解说创作工具 — 智能拆条 + 解说生成 + 配音合成

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**ClipFlow** 是一款本地 AI 驱动的视频创作工具，基于 Tauri 2.x（Rust + React + TypeScript）构建。支持**剪辑模式**和**解说模式**两种工作流，可满足从直播回放剪辑到电影解说等各种场景需求。

---

## ✨ 核心功能

### 🤖 双模式工作流

| 模式 | 适用场景 | 工作流 |
|------|---------|--------|
| **剪辑模式** | 直播回放、会议记录、游戏高光 | 视频 → AI 分析 → 高光检测 → 片段导出 |
| **解说模式** | 短剧解说、电影解说、综艺解说 | 视频 → 语义分段 → AI 导演 → 解说词 → TTS 配音 → 渲染成片 |

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
- **双引擎支持** — 支持 Azure TTS / Edge TTS 多种语音引擎
- **交互式创作** — 导演 Agent 多轮交互，精准把控解说质量

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────┐
│                   前端 (Web)                      │
│         React 18 + TypeScript + Vite             │
│              React Context 状态管理               │
└──────────────────────┬──────────────────────────┘
                       │ Tauri IPC
┌──────────────────────▼──────────────────────────┐
│                  后端 (Rust)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │  FFmpeg │ │ Whisper │ │  LLM    │            │
│  │ (转码/  │ │ (语音识 │ │ (脚本生 │            │
│  │  字幕)  │ │  别)    │ │  成)    │            │
│  └─────────┘ └─────────┘ └─────────┘            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │  TTS    │ │ 混音    │ │ 渲染引擎 │            │
│  │ (配音)  │ │ (多轨)  │ │ (合成)   │            │
│  └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────┘
```

---

## 📦 安装

### 前置要求

- **Node.js** ≥ 18
- **Rust** ≥ 1.70
- **FFmpeg**（系统路径下可用 `ffmpeg -version`）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/Agions/ClipFlow.git
cd ClipFlow

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm run tauri dev
```

> 首次运行会自动下载 Whisper 模型和 TTS 语音文件（约 100MB），请保持网络连接。

### 构建发布版

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

---

## 🚀 快速开始

### 创建项目

1. 启动应用后，点击 **创建项目**
2. 选择工作模式：**剪辑模式** 或 **解说模式**
3. 上传视频文件（支持 MP4、MKV、MOV 等常见格式）

### 剪辑模式流程

```
上传视频 → AI 分析 → 查看高光片段 → 选择导出片段 → 设置分辨率 → 导出视频
```

### 解说模式流程

```
上传视频 → AI 分析 + 字幕识别 → 语义分段 → AI 导演策划 → 生成解说词 → 选择音色 → 配音合成 → 渲染导出
```

---

## 🛠️ 开发指南

### 项目结构

```
ClipFlow/
├── src/                        # 前端源码
│   ├── components/              # React 组件
│   │   ├── ClipFlow/            # 工作流核心组件
│   │   └── CommentaryPanel/    # 解说模式面板
│   ├── core/                   # 核心业务逻辑
│   │   ├── services/           # 视频/音频服务
│   │   └── workflow/           # 工作流定义
│   ├── hooks/                  # 自定义 Hooks
│   └── pages/                  # 页面入口
├── src-tauri/                  # Rust 后端
│   └── src/commands/          # Tauri 命令
├── docs/                       # VitePress 文档
└── tests/                      # 测试文件
```

### 相关命令

```bash
npm run dev              # 前端开发服务器（Vite）
npm run tauri dev        # 启动 Tauri 开发模式
npm run tauri build     # 构建生产版本
npm run test             # 运行测试
npm run lint             # 代码检查
```

---

## 📚 文档

完整文档请访问 [ClipFlow Docs](https://github.com/Agions/ClipFlow/tree/main/docs)。

| 文档 | 说明 |
|------|------|
| [用户指南](docs/guide/index.md) | 功能介绍与操作流程 |
| [安装指南](docs/guide/installation.md) | 环境配置与安装 |
| [快速开始](docs/guide/quick-start.md) | 5 分钟上手教程 |
| [架构设计](docs/dev/architecture.md) | 系统架构详解 |
| [项目结构](docs/dev/project-structure.md) | 代码目录说明 |
| [Tauri 命令](docs/dev/tauri-commands.md) | 前后端通信接口 |

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