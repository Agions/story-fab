<div align="center">

<img src="assets/logo-horizontal.svg" alt="StoryFab" width="540"/>

<br/>
<br/>

# StoryFab

**本地优先的 AI 影视解说创作工坊 — 一杯咖啡的时间，从素材到成片。**

<br/>

[![Release](https://img.shields.io/github/v/release/Agions/story-fab?style=flat-square&color=FF6B35&logo=tauri&logoColor=black)](https://github.com/Agions/story-fab/releases)
[![License](https://img.shields.io/github/license/Agions/story-fab?style=flat-square&color=22C55E)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Agions/story-fab?style=flat-square&color=FACC15)](https://github.com/Agions/story-fab/stargazers)
[![Forks](https://img.shields.io/github/forks/Agions/story-fab?style=flat-square&color=8B5CF6)](https://github.com/Agions/story-fab/network/members)
[![Issues](https://img.shields.io/github/issues/Agions/story-fab?style=flat-square&color=EF4444)](https://github.com/Agions/story-fab/issues)

<br/>

[![CI](https://img.shields.io/github/actions/workflow/status/Agions/story-fab/main.yml?branch=main&style=flat-square&label=CI&logo=github-actions&logoColor=white)](https://github.com/Agions/story-fab/actions/workflows/main.yml)
[![Release Build](https://img.shields.io/github/actions/workflow/status/Agions/story-fab/release.yml?style=flat-square&label=Release&logo=tauri&logoColor=white)](https://github.com/Agions/story-fab/actions/workflows/release.yml)
[![Docs](https://img.shields.io/github/actions/workflow/status/Agions/story-fab/deploy-docs.yml?style=flat-square&label=Docs&logo=vitepress&logoColor=white)](https://agions.github.io/story-fab/)

<br/>

[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust 1.77+](https://img.shields.io/badge/Rust-1.77+-DEA584?style=flat-square&logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)

</div>

---

## 📑 目录

- [它是什么？](#它是什么)
- [核心能力](#核心能力)
- [快速访问](#快速访问)
- [工作流示例](#工作流示例)
- [为什么选择 StoryFab](#为什么选择-storyfab)
- [下载安装](#下载安装)
- [常见安装问题](#常见安装问题)
- [从源码构建](#从源码构建)
- [架构概览](#架构概览)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [开发命令](#开发命令)
- [参与贡献](#参与贡献)
- [文档导航](#文档导航)
- [路线图](#路线图)
- [社区与支持](#社区与支持)
- [致谢](#致谢)
- [许可证](#许可证)

---

## 它是什么？

**StoryFab** 是一款**本地优先**的 AI 影视创作工坊，基于 **Tauri 2.x**（Rust + React + TypeScript）构建。专为**影视解说、短剧二创、直播高光**场景设计 —— 把传统的「剪辑 → 写稿 → 配音」三步流水线，压缩到**一杯咖啡的时间**。

**全链路本地处理**：原始视频、字幕草稿、解说文案 100% 不离开你的设备 —— Whisper 离线转字幕、Edge TTS 离线配音，**隐私零外泄**。

> **目标用户**：影视解说博主 · 短剧二创作者 · 直播高光剪辑师 · MCN 内容运营团队

---

## 核心能力

<table>
  <tr>
    <th align="center" width="33%">🤖 双模式工作流</th>
    <th align="center" width="33%">🧠 多 LLM 联合解说</th>
    <th align="center" width="33%">🎙️ 本地语音链路</th>
  </tr>
  <tr>
    <td align="left" valign="top">
      <b>剪辑模式</b>：直播回放、会议记录、游戏集锦 — 智能高光检测<br/><br/>
      <b>解说模式</b>：短剧、电影、综艺 — 语义分段 + 5 步 Agent Pipeline
    </td>
    <td align="left" valign="top">
      接入 <b>5 家 LLM</b>（OpenAI · DeepSeek · Qwen · Gemini · Anthropic）<br/><br/>
      Director Agent 多轮对话式策划，把控节奏、停顿、语气
    </td>
    <td align="left" valign="top">
      <code>faster-whisper</code> 离线转字幕 + Edge TTS / Azure TTS 双引擎<br/><br/>
      <b>零云端</b> · <b>隐私零外泄</b>
    </td>
  </tr>
  <tr>
    <th align="center">🎬 Rust 渲染管线</th>
    <th align="center">🎭 5 步 Agent Pipeline</th>
    <th align="center">🔌 可扩展架构</th>
  </tr>
  <tr>
    <td align="left" valign="top">
      FFmpeg 底层调用，多轨时间线精准合成；9:16 / 1:1 / 16:9 多比例硬字幕烧录
    </td>
    <td align="left" valign="top">
      <code>director</code> → <code>visual</code> → <code>narration</code> → <code>timing</code> → <code>overlay</code><br/><br/>
      累积式 state chain，类型安全 + 单元测试覆盖
    </td>
    <td align="left" valign="top">
      Tauri 2.x IPC 解耦前后端；新 LLM / TTS 引擎只需实现 <code>trait</code> 即可接入
    </td>
  </tr>
</table>

---

## 快速访问

| 入口 | 链接 |
|---|---|
| **⬇️ 桌面应用下载** | [GitHub Releases](https://github.com/Agions/story-fab/releases) · Windows / macOS / Linux |
| **📚 在线文档** | [agions.github.io/story-fab](https://agions.github.io/story-fab/) |
| **🐛 报告问题** | [GitHub Issues](https://github.com/Agions/story-fab/issues/new) |
| **💡 功能建议** | [GitHub Discussions](https://github.com/Agions/story-fab/discussions) |
| **🔒 安全漏洞** | [Security Advisories](https://github.com/Agions/story-fab/security/advisories/new) |
| **📦 历史版本** | [25 个 release tag](https://github.com/Agions/story-fab/tags) |

---

## 工作流示例

> 把一段 60 分钟的电影素材变成 5 分钟的解说成片，全过程 < 10 分钟。

```
┌──────────────────────────────────────────────────────────────────┐
│  Step 1  导入素材         拖入视频文件 (mp4 / mov / mkv)         │
│           ↓                                                       │
│  Step 2  智能拆条         Whisper 离线转字幕 + 场景语义分段      │
│           ↓                                                       │
│  Step 3  Director Agent  多轮对话策划 — 风格 / 节奏 / 段落优先级 │
│           ↓                                                       │
│  Step 4  LLM 解说生成    5 家 LLM 任选 — Director → Visual →    │
│                          Narration → Timing → Overlay 5 步流水线  │
│           ↓                                                       │
│  Step 5  TTS 配音合成    Edge TTS / Azure TTS 多音色试听         │
│           ↓                                                       │
│  Step 6  FFmpeg 渲染     9:16 / 1:1 / 16:9 硬字幕烧录导出        │
│           ↓                                                       │
│  🎬 成片          5 分钟解说视频 · 含字幕 · 含配音               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 为什么选择 StoryFab

| 痛点 | StoryFab 解法 |
|---|---|
| 写解说词耗时数小时 | 多 LLM 联合生成 + Director Agent 把控节奏、语气、停顿 |
| 配音需要专业设备 | Edge TTS / Azure TTS 双引擎，几十种音色任选 |
| 字幕需要人工听写 | `faster-whisper` 离线转字幕，**零云端依赖** |
| 多平台适配难 | 一键导出 9:16 / 1:1 / 16:9，硬字幕烧录成片 |
| 隐私顾虑 | 全链路本地处理，**原始视频与脚本零上传** |
| 部署门槛高 | 桌面原生（Tauri）双击即用，**无 streamlit / 无 Web 服务** |
| 无法脚本化 | 完整的 Node + Rust API，可接入 AI Agent 自动化工作流 |

---

## 下载安装

前往 [**Releases**](https://github.com/Agions/story-fab/releases) 页面下载对应平台安装包：

| 平台 | 架构 | 安装包 | 大小（约） |
|------|------|--------|----------|
| 🪟 Windows | x64 | `StoryFab_x.x.x_x64-setup.exe` | ~30 MB |
| 🍎 macOS | Apple Silicon | `StoryFab_x.x.x_aarch64.dmg` | ~25 MB |
| 🍎 macOS | Intel | `StoryFab_x.x.x_x64.dmg` | ~25 MB |
| 🐧 Linux | x64 | `StoryFab_x.x.x_amd64.AppImage` | ~28 MB |

> **跨平台编译产物 + 签名验证**：[构建与发布文档](https://agions.github.io/story-fab/dev/build.html)

---

## 常见安装问题

<details>
<summary><b>macOS 提示"无法打开，因为无法验证开发者"</b></summary>

StoryFab **未购买 Apple 开发者证书**，所以 macOS Gatekeeper 会拦截。两种解决方式：

**方式 1（推荐）**：右键 app → **打开** → 弹出对话框再点 **打开**

**方式 2**：系统设置 → 隐私与安全性 → 点 **仍要打开**

详细图文：[macOS 安装指南](https://agions.github.io/story-fab/guide/install-mac.html)
</details>

<details>
<summary><b>Windows SmartScreen 提示"未知发布者"</b></summary>

StoryFab 安装包未签名（企业签名年费 $400+）。点击 **更多信息** → **仍要运行** 即可。

后续版本会接入代码签名，详见 [release 路线图](https://github.com/Agions/story-fab/projects)。
</details>

<details>
<summary><b>Linux AppImage 启动失败</b></summary>

AppImage 需要 `libfuse2`。Ubuntu 22.04+ 默认不装：

```bash
sudo apt install libfuse2
```

或改用 `.deb` 包（无需 FUSE）。详见 [Linux 安装指南](https://agions.github.io/story-fab/guide/install-linux.html)。
</details>

<details>
<summary><b>启动时报 "Failed to load FFmpeg/Whisper binary"</b></summary>

Tauri 首次启动会下载 FFmpeg / Whisper 二进制。**网络问题**会导致失败。解决：

1. 设置代理或使用 VPN
2. 或手动放置二进制到 `~/.config/story-fab/bin/`
3. 或从 [Release 资产](https://github.com/Agions/story-fab/releases) 下载预编译二进制
</details>

---

## 从源码构建

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
pnpm tauri build --target x86_64-pc-windows-msvc   # Windows 跨平台
```

**一键安装脚本**（macOS / Linux）：

```bash
curl -fsSL https://raw.githubusercontent.com/Agions/story-fab/main/install.sh | bash
```

---

## 架构概览

### 系统组件

```
┌──────────────────────────────────────────────────────────────────┐
│  前端 (React 18 + TypeScript + Vite)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐     │
│  │ UI Layer │ │ Zustand  │ │  Hooks   │ │ MultiTrackTime-  │     │
│  │ (shadcn) │ │  Stores  │ │          │ │      line        │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘     │
│       └────────────┴────────────┴─────────────────┘               │
│                          │ Tauri IPC (invoke)                    │
└──────────────────────────┼───────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  后端 (Rust + Tauri 2.x)                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│  │ FFmpeg │ │Whisper │ │  LLM   │ │  TTS   │ │  Core  │         │
│  │ 转码/  │ │  离线  │ │ 5 家   │ │ Edge / │ │Pipeline│         │
│  │ 烧字幕 │ │  字幕  │ │Provider│ │ Azure  │ │ (5 步) │         │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘         │
│      └──────────┴──────────┴──────────┴──────────┘               │
│                          │                                       │
│                          ▼                                       │
│              Director Agent (5 步流水线)                         │
└──────────────────────────────────────────────────────────────────┘
```

### 数据流向

```
视频源 ──► 智能拆条 ──► 语义分段 ──► Director Agent
                                       │
                                       ▼
                                LLM Provider × 5
                                       │
                                       ▼
                                  解说词脚本
                                       │
                                       ▼
                                TTS Provider × 2
                                       │
                                       ▼
                              FFmpeg 混音 + 烧字幕
                                       │
                                       ▼
                                   成片导出
```

> **完整架构详解**：[系统架构文档](https://agions.github.io/story-fab/dev/architecture-optimization.html)（含 ADR-101/102/103）

---

## 技术栈

| 层 | 技术 |
|---|---|
| **前端框架** | [React 18](https://react.dev/) · [TypeScript 5](https://www.typescriptlang.org/) · [Vite](https://vitejs.dev/) |
| **UI 组件** | [shadcn/ui](https://ui.shadcn.com/) · [Radix UI](https://www.radix-ui.com/) · [TailwindCSS](https://tailwindcss.com/) |
| **状态管理** | [Zustand](https://zustand-demo.pmnd.rs/) · 5 个领域 store |
| **桌面框架** | [Tauri 2.x](https://tauri.app/) · Rust 1.77+ · tokio 异步运行时 |
| **AI 能力** | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) · 5 LLM Provider · 2 TTS Provider |
| **媒体处理** | [FFmpeg](https://ffmpeg.org/) · 视频转码 / 混音 / 硬字幕烧录 |
| **测试** | [Vitest](https://vitest.dev/) · 17+ 单元测试覆盖 5 步 Pipeline |
| **CI/CD** | GitHub Actions · 5 阶段质量门禁（type-check / lint / test / verify:all / build） |

---

## 项目结构

```
story-fab/
├── src/                          # 前端源码
│   ├── components/
│   │   ├── VideoProcessingController/  # 工作流核心
│   │   ├── ai/                   # Agent 相关组件
│   │   └── ui/                   # shadcn/ui 基础组件
│   ├── core/                     # 核心业务层（ADR-101 双服务层）
│   │   ├── pipeline/             # 5 步 Pipeline (ADR-103)
│   │   │   └── steps/commentary/ # Commentary 模式 5 agent
│   │   ├── services/             # 业务服务
│   │   ├── workflow/             # 工作流编排
│   │   └── types/                # 全局类型
│   ├── store/                    # Zustand 状态管理
│   ├── shared/                   # 共享工具
│   └── styles/                   # 全局样式
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── commands/             # Tauri IPC 命令
│       │   ├── commentary/       # 解说模式 (director / script / synth)
│       │   ├── render/           # 渲染 / 智能拆条
│       │   ├── llm/              # LLM Provider 实现
│       │   └── subtitle/         # Whisper 字幕
│       ├── video_processor.rs    # 视频处理核心
│       └── binary.rs             # FFmpeg / Whisper 二进制管理
├── docs/                         # VitePress 文档站
├── assets/                       # 品牌资源
│   ├── logo-horizontal.svg       # README / 文档头
│   └── logo-mark.svg             # 方形 monogram
├── public/                       # 静态资源
│   ├── favicon.svg
│   └── logo.svg
├── scripts/                      # 构建 / 验证脚本
│   ├── verify-no-tag.mjs
│   ├── check-antd.mjs
│   ├── check-naming.mjs
│   └── hooks/                    # Git hooks
└── .github/workflows/            # CI/CD
    ├── main.yml                  # 主 CI
    ├── release.yml               # 多平台构建
    ├── deploy-docs.yml           # 文档站部署
    └── verify-standards.yml      # 项目规范校验
```

---

## 开发命令

```bash
# 前端开发
pnpm dev                  # Vite 开发服务器
pnpm build                # 生产构建
pnpm preview              # 预览构建产物
pnpm test                 # Vitest 单元测试
pnpm test:coverage        # 测试覆盖率
pnpm lint                 # ESLint --max-warnings 0
pnpm type-check           # tsc --noEmit

# Tauri 桌面开发
pnpm tauri dev            # 启动 Tauri 开发模式（带 Rust 热重载）
pnpm tauri build          # 构建桌面应用

# 文档
pnpm docs:dev             # VitePress 文档开发
pnpm docs:build           # 构建文档站点

# 验证脚本（CI 同样执行）
pnpm verify:no-tag        # 禁止本地打 tag
pnpm verify:no-antd       # 禁止 antd 引用
pnpm verify:no-ai-byline  # 禁止 AI byline
pnpm verify:all           # 一键运行所有验证
```

---

## 参与贡献

我们欢迎任何形式的贡献 —— Bug 报告、功能建议、文档改进、代码 PR。

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改（**遵循 Conventional Commits**）
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 [Pull Request](https://github.com/Agions/story-fab/pulls)

### Commit 规范

| 类型 | 用途 | 示例 |
|---|---|---|
| `feat` | 添加新功能 | `feat(pipeline): commentary 5-step pipeline` |
| `fix` | 修复 Bug | `fix(ci): make verify-no-tag CI-compatible` |
| `docs` | 文档更新 | `docs(readme): professional redesign` |
| `refactor` | 重构（既非 feat 也非 fix） | `refactor(arch): v2.0 → v2.1 optimization` |
| `perf` | 性能优化 | `perf(render): cache keyframe extraction` |
| `test` | 测试相关 | `test(commentary): add 17 unit tests` |
| `chore` | 构建 / 工具链 | `chore(deps): bump tauri 2.1 → 2.2` |

### 添加新的 LLM / TTS Provider

所有 Provider 只需实现对应 trait 即可接入 —— 详见 [`docs/dev/provider-development.md`](docs/dev/provider-development.md)。

### 行为准则

请阅读 [贡献者公约](CODE_OF_CONDUCT.md)（待补充）。本项目致力于为所有人提供友好、包容的贡献环境。

---

## 文档导航

| 文档 | 说明 |
|------|------|
| [📖 用户指南](https://agions.github.io/story-fab/guide/) | 功能介绍与操作流程 |
| [🚀 快速开始](https://agions.github.io/story-fab/guide/quick-start.html) | 5 分钟上手 |
| [🏗️ 系统架构](https://agions.github.io/story-fab/dev/architecture.html) | 完整架构设计 (v3.0) |
| [🎯 架构优化 v2.1](https://agions.github.io/story-fab/dev/architecture-optimization.html) | 双服务层 + State 边界 (ADR-101/102) |
| [🔌 Tauri 命令](https://agions.github.io/story-fab/dev/tauri-commands.html) | 前后端通信接口 |
| [🤖 Provider 开发](https://agions.github.io/story-fab/dev/provider-development.html) | 接入新 LLM / TTS |
| [🛠️ 构建发布](https://agions.github.io/story-fab/dev/build.html) | 跨平台构建与签名验证 |

---

## 路线图

### 已完成 ✅

- 剪辑模式 / 解说模式双工作流
- 5 大 LLM Provider（OpenAI / DeepSeek / Qwen / Gemini / Anthropic）
- Edge TTS / Azure TTS 双引擎
- 多比例导出（9:16 / 1:1 / 16:9）
- faster-whisper 离线字幕
- Director Agent 多轮对话策划
- 双服务层架构（v2.1 优化，ADR-101/102）
- 5 步 Agent Pipeline (v2.2 commentary, ADR-103)
- CI/CD 5 阶段质量门禁
- 文档站自动部署
- 25 个 release tag，1004+ commits

### 规划中 🚧

- 云端协作（剧本云端同步 + 多端编辑）
- 移动端预览 App（iOS / Android）
- AI 自动封面图生成
- 多语言 UI（i18n 国际化）
- 视频素材市场
- 团队协作权限管理

查看完整路线图 → [GitHub Projects](https://github.com/Agions/story-fab/projects)

---

## 社区与支持

- 🐛 **报告 Bug**：[GitHub Issues](https://github.com/Agions/story-fab/issues/new)
- 💡 **功能建议**：[GitHub Discussions](https://github.com/Agions/story-fab/discussions)
- 📖 **使用问题**：[文档站 FAQ](https://agions.github.io/story-fab/guide/faq.html)
- 🔒 **安全漏洞**：[Security Advisories](https://github.com/Agions/story-fab/security/advisories/new)

---

## 致谢

StoryFab 的诞生离不开以下开源项目：

| 项目 | 用途 |
|---|---|
| [**Tauri**](https://tauri.app/) | 桌面应用框架 |
| [**FFmpeg**](https://ffmpeg.org/) | 视频处理引擎 |
| [**faster-whisper**](https://github.com/SYSTRAN/faster-whisper) | 本地语音识别 |
| [**React**](https://react.dev/) · [**Vite**](https://vitejs.dev/) | 前端框架 |
| [**shadcn/ui**](https://ui.shadcn.com/) · [**Radix UI**](https://www.radix-ui.com/) | UI 组件 |
| [**TailwindCSS**](https://tailwindcss.com/) | 样式方案 |
| [**Zustand**](https://zustand-demo.pmnd.rs/) | 状态管理 |
| [**Edge TTS**](https://github.com/rany2/edge-tts) | 语音合成 |
| **OpenAI** · **DeepSeek** · **Qwen** · **Gemini** · **Anthropic** | LLM 能力 |

---

## 许可证

本项目基于 [**MIT License**](LICENSE) 开源。

Copyright © 2024–present [**Agions**](https://github.com/Agions)

<div align="center">
  <sub>⭐ 如果 StoryFab 对你有帮助，欢迎 Star 支持本项目！</sub>
</div>
