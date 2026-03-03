```
  ____ _ _       _____ _
 / ___| (_)_ __ |  ___| | _____      __
| |   | | | '_ \| |_  | |/ _ \ \ /\ / /
| |___| | | |_) |  _| | | (_) \ V  V /
 \____|_|_| .__/|_|   |_|\___/ \_/\_/
           |_|
```

<p align="center">
  <strong>ClipFlow — AI 驱动的专业视频内容创作平台</strong>
</p>

<p align="center">

[![版本](https://img.shields.io/badge/version-1.0.0--beta-blue.svg)](https://github.com/agions/clipflow)
[![许可证](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC107?logo=tauri)](https://tauri.app)

</p>

---

## 简介

ClipFlow 是一款面向影视创作者和内容创作者的专业 AI 视频内容创作平台。通过深度整合前沿大语言模型，ClipFlow 为用户提供 **智能脚本生成**、**视频分析** 和 **智能混剪** 等核心功能，大幅提升视频创作效率。

---

## 核心功能

| 功能 | 描述 |
|------|------|
| 🎬 **AI 智能剪辑** | 自动识别精彩片段，智能生成剪辑方案 |
| 🎙️ **AI 智能解说** | 支持 AI 自动生成专业解说文案，多种音色可选 |
| 👤 **AI 第一人称解说** | 第一人称视角叙述，像主播一样与观众互动 |
| ✂️ **AI 混剪** | 多素材智能合成，自动匹配节奏 |
| 🔍 **视频分析** | OCR 文字识别、语音转写、场景检测、关键帧提取 |

### 完整工作流程

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   创建项目  │    │  上传视频   │    │ AI 分析    │    │ 生成脚本   │
│  Project  │ ─▶ │   Video    │ ─▶ │ (场景、OCR) │ ─▶ │  Script   │
└────────────┘    └────────────┘    │  关键帧)   │    └────────────┘
                                   └────────────┘            │
                                                               ▼
      ▲                                              ┌────────────┐
      │                                              │  视频合成   │
      │                                              │ Synthesis │
      │                                              └────────────┘
      │                                                    │
      └─────────────────── 导出 ◀──────────────────────────┘
```

---

## 快速开始

### 环境要求

| 要求 | 版本 |
|------|------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |
| Rust | 最新稳定版 (可选) |

### 安装

```bash
# 克隆项目
git clone https://github.com/agions/clipflow.git
cd clipflow

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建桌面应用

```bash
npm run tauri build
```

---

## 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                        前端技术栈                              │
├─────────────────────────────────────────────────────────────┤
│  React 18  │  TypeScript 5  │  Ant Design 5.x            │
│  Zustand   │  LESS + CSS    │  Framer Motion             │
├─────────────────────────────────────────────────────────────┤
│                       桌面应用                                │
├─────────────────────────────────────────────────────────────┤
│                          Tauri 2.x                           │
├─────────────────────────────────────────────────────────────┤
│                       构建工具                               │
├─────────────────────────────────────────────────────────────┤
│                           Vite                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 支持的 AI 模型

| 厂商 | 模型 | 适用场景 |
|------|------|----------|
| **OpenAI** | GPT-5.3, GPT-4o | 综合文本生成 |
| **Anthropic** | Claude 4.6 Opus, Claude 4 Sonnet | 长文本分析 |
| **Google** | Gemini 3 Ultra, Gemini 3 Pro | 多模态理解 |
| **DeepSeek** | DeepSeek R1, DeepSeek V3 | 推理任务 |
| **阿里云** | Qwen 3.5, Qwen Max | 中文内容 |
| **智谱** | GLM-5 | 多任务处理 |
| **月之暗面** | Kimi k2.5, Kimi k2 | 长文本处理 |

---

## 项目结构

```
clipflow/
├── src/
│   ├── components/       # React 组件
│   │   ├── AIPanel/    # AI 功能面板
│   │   ├── common/     # 通用组件
│   │   └── editor/     # 编辑器组件
│   ├── core/           # 核心服务
│   │   ├── services/   # 业务服务
│   │   ├── hooks/      # 自定义 Hooks
│   │   ├── store/      # 状态管理
│   │   └── types/      # 类型定义
│   ├── pages/          # 页面组件
│   ├── layouts/        # 布局组件
│   ├── styles/         # 全局样式
│   └── utils/          # 工具函数
├── docs/               # 项目文档
└── src-tauri/          # Tauri 后端
```

---

## 文档

| 文档 | 描述 |
|------|------|
| [快速开始](docs/getting-started.md) | 环境配置和安装 |
| [功能特性](docs/features.md) | 详细功能介绍 |
| [工作流程](docs/workflow.md) | AI 创作流程 |
| [常见问题](docs/faq.md) | FAQ 解答 |
| [更新日志](docs/CHANGELOG.md) | 版本更新记录 |

---

## 科技暗黑主题

ClipFlow 采用精心设计的科技暗黑风格：

- 🌑 **深邃黑背景** — #0a0a0f 主色调
- ✨ **霓虹发光** — 紫色/青色/粉色光效
- 💎 **玻璃拟态** — 现代半透明组件
- 🎬 **流畅动画** — 丝滑过渡效果

---

## 许可证

MIT License - 自由使用和修改

---

<p align="center">
  <strong>Made with ❤️ by Agions</strong>
</p>
