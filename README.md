<div align="center">

<img src="assets/logo-horizontal.svg" alt="StoryFab" width="480"/>

<br/>

# StoryFab · AI 影视解说创作工坊

**从一段原始素材到一段专业解说，AI 全程陪你一气呵成。**

<br/>

[![Version](https://img.shields.io/github/v/release/Agions/story-fab?style=flat-square&color=0EA5E9)](https://github.com/Agions/story-fab/releases)
[![License](https://img.shields.io/github/license/Agions/story-fab?style=flat-square&color=22C55E)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Agions/story-fab?style=flat-square&color=FACC15)](https://github.com/Agions/story-fab/stargazers)
[![Forks](https://img.shields.io/github/forks/Agions/story-fab?style=flat-square&color=8B5CF6)](https://github.com/Agions/story-fab/network/members)
[![Issues](https://img.shields.io/github/issues/Agions/story-fab?style=flat-square&color=EF4444)](https://github.com/Agions/story-fab/issues)

<br/>

[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.77%2B-DEA584?style=flat-square&logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![Platform](https://img.shields.io/badge/Platform-Win%20%7C%20macOS%20%7C%20Linux-8B5CF6?style=flat-square)](https://github.com/Agions/story-fab/releases)

<br/>

[**📚 在线文档**](https://agions.github.io/story-fab/) &nbsp;·&nbsp; [**⬇️ 下载安装**](https://github.com/Agions/story-fab/releases) &nbsp;·&nbsp; [**🐛 报告问题**](https://github.com/Agions/story-fab/issues/new) &nbsp;·&nbsp; [**💡 功能建议**](https://github.com/Agions/story-fab/discussions)

</div>

---

## 📑 目录

- [它是什么？](#它是什么)
- [核心能力](#核心能力)
- [快速开始](#快速开始)
- [架构概览](#架构概览)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [开发命令](#开发命令)
- [参与贡献](#参与贡献)
- [文档导航](#文档导航)
- [Roadmap](#roadmap)
- [致谢](#致谢)
- [License](#license)

---

## 它是什么？

**StoryFab** 是一款**本地优先**的 AI 影视创作工坊，基于 **Tauri 2.x**（Rust + React + TypeScript）构建。
专为**影视解说、短剧二创、直播高光**场景设计 —— 把传统的「剪辑 → 写稿 → 配音」三步流水线，压缩到**一杯咖啡的时间**。

### 核心卖点

| 能力 | 描述 |
|---|---|
| 🤖 **智能拆条** | 自动识别高光片段，精准切片；适配直播回放、会议记录、游戏集锦 |
| ✍️ **导演 Agent** | 多轮对话式策划，把控解说节奏、停顿、语气 |
| 🎙️ **本地语音链路** | Whisper 离线字幕 + Edge TTS 配音，**零云端依赖**、**隐私零外泄** |
| 📦 **多比例导出** | 一键生成 9:16 / 1:1 / 16:9 硬字幕烧录成片 |

> **目标用户**：影视解说博主、短剧二创作者、直播高光剪辑师、MCN 内容运营团队。

---

## 核心能力

<table>
  <tr>
    <th align="center">🤖 双模式工作流</th>
    <th align="center">🧠 多 LLM 解说生成</th>
    <th align="center">🎙️ 本地语音链路</th>
  </tr>
  <tr>
    <td align="center" valign="top">
      <b>剪辑模式</b>：直播回放、会议记录、游戏集锦 — 智能高光检测<br/>
      <b>解说模式</b>：短剧、电影、综艺 — 语义分段 + 导演 Agent
    </td>
    <td align="center" valign="top">
      接入 <b>5 家 LLM</b>（OpenAI · DeepSeek · Qwen · Gemini · Anthropic），理解剧情结构，输出专业解说文案
    </td>
    <td align="center" valign="top">
      <code>faster-whisper</code> 离线转字幕 + Edge TTS / Azure TTS 多音色合成
    </td>
  </tr>
  <tr>
    <th align="center">🎬 Rust 渲染管线</th>
    <th align="center">🎭 导演 Agent</th>
    <th align="center">🔌 可扩展架构</th>
  </tr>
  <tr>
    <td align="center" valign="top">
      FFmpeg 底层调用，多轨时间线精准合成；9:16 / 1:1 / 16:9 多比例硬字幕烧录
    </td>
    <td align="center" valign="top">
      多轮对话式策划 — 你定义风格（幽默 / 严肃 / 接地气），AI 把控节奏、停顿、语气
    </td>
    <td align="center" valign="top">
      Tauri 2.x IPC 解耦前后端，新 LLM / TTS 引擎只需实现 <code>trait</code> 即可接入
    </td>
  </tr>
</table>

---

## 快速开始

### 方式一：下载预编译安装包（推荐）

前往 [**Releases**](https://github.com/Agions/story-fab/releases) 页面下载对应平台安装包：

| 平台 | 架构 | 文件 |
|------|------|------|
| 🪟 Windows | x64 | `StoryFab_x.x.x_x64-setup.exe` |
| 🍎 macOS | Apple Silicon | `StoryFab_x.x.x_aarch64.dmg` |
| 🍎 macOS | Intel | `StoryFab_x.x.x_x64.dmg` |
| 🐧 Linux | x64 | `StoryFab_x.x.x_amd64.AppImage` |

### 方式二：从源码构建

**前置依赖**：Node.js ≥ 18 · pnpm · Rust ≥ 1.77 · FFmpeg

```bash
git clone https://github.com/Agions/story-fab.git
cd story-fab
pnpm install
pnpm tauri dev      # 启动开发模式（Vite + Tauri 热重载）
```

**生产构建：**

```bash
pnpm tauri build                            # 当前平台
pnpm tauri build --target x86_64-pc-windows-msvc   # 跨平台
```

> 💡 详细构建说明、CI 产物下载、签名验证：[**📖 构建与发布文档**](https://agions.github.io/story-fab/dev/build.html)

---

## 架构概览

### 系统组件

```
┌─────────────────────────────────────────────────────────────────┐
│                     前端 (React 18 + TS)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  UI 组件     │  │  Zustand     │  │  多轨时间线          │   │
│  │  StoryFab /  │  │  状态管理    │  │  MultiTrackTimeline  │   │
│  │  Commentary  │  │              │  │                      │   │
│  └──────┬───────┘  └──────────────┘  └──────────┬───────────┘   │
└─────────┼────────────────────────────────────────┼──────────────┘
          │              Tauri IPC (invoke)        │
          ▼                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       后端 (Rust)                               │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  FFmpeg  │  │ Whisper  │  │   LLM    │  │     TTS      │    │
│  │  转码    │  │ 语音识别 │  │ 5 个     │  │  Edge /      │    │
│  │ 混音/烧字│◄─┤  本地    │  │ Provider │  │  Azure       │    │
│  └──────────┘  └──────────┘  └────┬─────┘  └──────┬───────┘    │
│                                   │               │            │
│                              ┌────▼───────────────▼────┐       │
│                              │   Director Agent         │       │
│                              │   多轮交互策划           │       │
│                              └──────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流向

```
视频源 ──► 智能拆条 ──► 语义分段 ──► Director Agent (多轮)
                                       │
                                       ▼
                                LLM Provider (5 选 1)
                                       │
                                       ▼
                                  解说词脚本
                                       │
                                       ▼
                                TTS Provider (2 选 1)
                                       │
                                       ▼
                              FFmpeg 混音 + 烧字幕
                                       │
                                       ▼
                                   成片导出
```

> 💡 想看更详细的架构（含模块依赖、状态机、错误处理）？  
> 👉 [系统架构 v3.0 完整文档](https://agions.github.io/story-fab/dev/architecture.html)

---

## 技术栈

| 层 | 技术 |
|---|---|
| **前端** | [React 18](https://react.dev/) · [TypeScript 5](https://www.typescriptlang.org/) · [Vite](https://vitejs.dev/) · [TailwindCSS](https://tailwindcss.com/) · [Zustand](https://zustand-demo.pmnd.rs/) |
| **后端** | [Rust](https://www.rust-lang.org/) · [Tauri 2.x](https://tauri.app/) · tokio 异步运行时 |
| **AI 能力** | [faster-whisper](https://github.com/SYSTRAN/faster-whisper)（离线语音识别）· 5 LLM Provider · 2 TTS Provider |
| **媒体处理** | [FFmpeg](https://ffmpeg.org/)（视频转码 / 混音 / 硬字幕烧录） |

---

## 项目结构

```
story-fab/
├── src/                          # 前端源码
│   ├── components/
│   │   ├── StoryFab/             # 工作流核心组件
│   │   ├── CommentaryPanel/      # 解说模式面板
│   │   └── MultiTrackTimeline/   # 多轨时间线
│   ├── core/
│   │   ├── services/             # 视频/音频服务
│   │   └── workflow/             # 工作流定义
│   ├── hooks/                    # 自定义 Hooks
│   ├── store/                    # Zustand 状态
│   └── pages/                    # 页面入口
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── commands/             # Tauri IPC 命令
│       │   ├── commentary/       # 解说模式（director / script_generator / synthesizer）
│       │   ├── render/           # 渲染 / 智能拆条
│       │   ├── llm/              # LLM Provider 实现
│       │   └── subtitle/         # Whisper 字幕
│       ├── video_processor.rs    # 视频处理核心
│       └── binary.rs             # FFmpeg/Whisper 二进制管理
├── docs/                         # VitePress 文档
│   ├── guide/                    # 用户指南
│   └── dev/                      # 开发文档
├── assets/                       # 品牌资源（logo / favicon）
└── public/                       # 静态资源
```

---

## 开发命令

```bash
# 前端
pnpm dev                 # Vite 开发服务器
pnpm build               # 生产构建
pnpm preview             # 预览构建产物
pnpm test                # Vitest 单元测试
pnpm lint                # ESLint --max-warnings 0
pnpm type-check          # tsc --noEmit

# Tauri
pnpm tauri dev           # 启动 Tauri 开发模式（带 Rust 热重载）
pnpm tauri build         # 构建桌面应用

# 文档
pnpm docs:dev            # VitePress 文档开发
pnpm docs:build          # 构建文档站点
```

---

## 参与贡献

我们欢迎任何形式的贡献 —— Bug 报告、功能建议、文档改进、代码 PR。

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 [Pull Request](https://github.com/Agions/story-fab/pulls)

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

| 类型 | 用途 |
|---|---|
| `feat` | 添加新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能）|
| `refactor` | 重构（既非 feat 也非 fix）|
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链相关 |

### 添加新的 LLM / TTS Provider

所有 Provider 只需实现对应 trait 即可接入 —— 详见 [`docs/dev/provider-development.md`](docs/dev/)。

---

## 文档导航

| 文档 | 说明 |
|------|------|
| [📖 用户指南](https://agions.github.io/story-fab/guide/) | 功能介绍与操作流程 |
| [🚀 快速开始](https://agions.github.io/story-fab/guide/quick-start.html) | 5 分钟上手 |
| [🏗️ 架构设计](https://agions.github.io/story-fab/dev/architecture.html) | 系统架构详解 |
| [🔌 Tauri 命令](https://agions.github.io/story-fab/dev/tauri-commands.html) | 前后端通信接口 |
| [🤖 Provider 开发](https://agions.github.io/story-fab/dev/provider-development.html) | 接入新 LLM / TTS |
| [🛠️ 构建发布](https://agions.github.io/story-fab/dev/build.html) | 跨平台构建与签名验证 |

---

## Roadmap

### 已完成 ✅
- 剪辑模式 / 解说模式双工作流
- 5 大 LLM Provider（OpenAI / DeepSeek / Qwen / Gemini / Anthropic）
- Edge TTS / Azure TTS 双引擎
- 多比例导出（9:16 / 1:1 / 16:9）

### 规划中 🚧
- 云端协作（剧本云端同步）
- 移动端预览 App
- AI 自动封面图生成
- 多语言 UI（i18n 国际化）

查看完整路线图 → [GitHub Projects](https://github.com/Agions/story-fab/projects)

---

## 致谢

StoryFab 的诞生离不开以下开源项目：

- [**Tauri**](https://tauri.app/) — 桌面应用框架
- [**FFmpeg**](https://ffmpeg.org/) — 视频处理引擎
- [**faster-whisper**](https://github.com/SYSTRAN/faster-whisper) — 本地语音识别
- [**React**](https://react.dev/) · [**Vite**](https://vitejs.dev/) · [**TailwindCSS**](https://tailwindcss.com/)
- [**shadcn/ui**](https://ui.shadcn.com/) · [**Radix UI**](https://www.radix-ui.com/) · [**Zustand**](https://zustand-demo.pmnd.rs/)
- [**Edge TTS**](https://github.com/rany2/edge-tts) · 多家 LLM API

---

## License

本项目基于 [**MIT License**](LICENSE) 开源。

Copyright © 2024–present [**Agions**](https://github.com/Agions) · Made with ❤️ and 🐱 in the open source community.

<div align="center">
  <sub>如果 StoryFab 对你有帮助，欢迎 ⭐ Star 支持！</sub>
</div>
