# CutDeck

<div align="center">

<p><img src="./public/logo.svg" alt="CutDeck" width="120" /></p>

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

<p style="font-size: 1.15rem; color: #94a3b8; margin: 0 0 2rem;">
  AI 驱动的专业视频剪辑工具 · 长视频一键智能剪辑 · AI 影视解说创作
</p>

<p>

[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square&logo=opensourceinitiative)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.75+-DEA584?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Zustand](https://img.shields.io/badge/Zustand-5-3F2E1E?style=flat-square&logo=zustand)](https://zustand-demo.pmnd.rs)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Agions/CutDeck/main.yml?style=flat-square&logo=github)](https://github.com/Agions/CutDeck/actions)
[![Stars](https://img.shields.io/github/stars/Agions/CutDeck?style=flat-square&logo=github&color=f59e0b)](https://github.com/Agions/CutDeck/stargazers)

</p>

</div>

---

## 🎯 两种工作模式

### Clip Mode — 快速剪辑（原有）
长视频 → AI 分析 → 高光检测 → 多格式导出，适合直播回放、会议记录等。

```
视频 → AI 分析 → 高光检测 → 片段选择 → 多格式导出
```

### Commentary Mode — AI 影视解说（🆕 v3.0）
视频 → 完整解说视频（带文案、配音、字幕），适合短剧、电影、综艺解说。

```
视频 → AI 分析 → 语义分段 → AI Director → 解说词生成 → TTS 配音 → 渲染成片
```

| 场景 | 传统方式 | CutDeck Clip Mode | CutDeck Commentary Mode |
|------|---------|-------------------|------------------------|
| 抖音创作者 | 人工选段 + 导出 | AI 识别高光 + 一键 9:16 | AI 理解剧情 + 生成解说 + 配音 |
| 知识付费 | 逐帧标记 | AI 识别关键内容 + SEO 生成 | — |
| 短剧解说 | 手动剪辑 + 写文案 + 配音 | — | 全自动解说创作 |
| 会议记录 | 手动截取 | AI 自动分段 + 多格式输出 | — |

---

## ✨ 核心功能

### 🤖 AI 智能拆条（7 步管道）

```
① 导入视频 → ② AI 分析 → ③ 高光检测 → ④ 候选构建 → ⑤ 多维评分 → ⑥ SEO 生成 → ⑦ 多格式导出
```

- **6 维 AI 评分**：笑声密度 / 情感峰值 / 内容完整度 / 静默比 / 节奏感 / 关键词权重
- **Rust 高光检测**：音频能量峰值 + 场景切换联合识别
- **多平台 SEO 元数据**：自动生成标题 / 描述 / Hashtags，平台原生适配
- **智能速度推荐**：基于音频能量比率自动推荐 1x–6x 播放速度（空白/过渡→6x，低能量→4x，正常→2x，高光→1x）
- **自动转场建议**：30+ 规则矩阵根据片段类型 + 时长 + 内容密度推荐最佳转场特效

### 🎙️ 本地 Whisper 字幕

faster-whisper 本地推理，精准语音识别 + 毫秒级时间轴对齐，**断网可用**。

> 未安装 faster-whisper 时自动降级为模拟结果，不影响使用流程。

### 🎤 TTS 配音混音

- **多音轨合成**：TTS 配音（volume=1.0）叠加原音轨背景音（volume=0.3）
- **FFmpeg filter_complex 混音**：专业级音频处理
- **实时进度反馈**：配音合成实时进度回调

### 🎬 多格式导出

- **9:16** 竖屏（抖音 / 快手）
- **1:1** 方屏（Instagram）
- **16:9** 横屏（YouTube / B站）
- 一键批量导出，自定义分辨率、帧率、码率

### ⌨️ 专业剪辑体验

- 多轨道时间轴（视频 / 音频 / 字幕独立轨道）
- 20+ 全局快捷键（`空格` 播放 / `I`/`O` 入出点 / `J`-`K`-`L` 逐帧 / `⌘Z` 撤销）
- Timeline 虚拟化（100+ clips 无卡顿）

### 📦 批量多视频处理

支持多视频批量工作流，各视频独立路径、独立参数，批量导入→分析→导出一次完成。

---

## 🆕 Commentary Mode（解说模式）详解

### AI Director Agent

多轮状态机，管理从视频分析到成片输出的全流程，支持用户审核和修改。

```
分析 → 规划 → 审核 → 修改 → 执行 → 完成
```

### 解说风格预设

| 风格 | 描述 | 适用场景 |
|------|------|---------|
| 幽默版 | 诙谐有趣，添加网络梗 | 喜剧/搞笑视频 |
| 接地气版 | 口语化，像和朋友聊天 | 情感/生活类 |
| 震惊版 | 夸张震惊，制造悬念 | 悬疑/复仇类短剧 |
| 感动版 | 温情脉脉，情感共鸣 | 爱情/亲情类 |
| 专业版 | 客观冷静，纪录片风格 | 纪录片/科教类 |

### LLM 解说词生成

基于语义理解生成文案，支持：
- 开场抓眼球（悬念/震惊/好奇）
- 全局连贯性（角色不重复介绍）
- 朗读时长约束（自动适配视频片段）
- 质量检查（重复/偏离/时长偏差）

---

## 🏗️ 系统架构 v3.0

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI 层 (React 18)                              │
│  Landing  ·  Dashboard  ·  Projects  ·  VideoEditor  ·  Settings         │
├─────────────────────────────────────────────────────────────────────────┤
│  组件层 (src/components/)                                               │
│  AIClip · AIVideoPreview · CutDeck · Layout · ModelSelector ·          │
│  CommentaryPanel · ScriptEditor                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  核心业务层 (src/core/)                                                 │
│  services/ · pipeline/ · hooks/ · video/ · config/ · types/            │
│  ├── commentary/（🆕 解说服务）                                         │
│  │   ├── DirectorAgent.ts     AI 导演状态机                            │
│  │   ├── ScriptGenerator.ts    LLM 解说词生成                          │
│  │   └── CommentarySynth.ts    TTS 配音合成                            │
├─────────────────────────────────────────────────────────────────────────┤
│  状态层 (src/store/)                                                    │
│  Zustand v5 持久化 stores（app · project · editor · timeline）          │
├─────────────────────────────────────────────────────────────────────────┤
│  Tauri Bridge 层 (src/core/tauri/)                                     │
│  TauriBridge — 统一封装所有 Rust IPC 调用                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Rust 后端层 (src-tauri/src/)                                           │
│  commands/ · highlight_detector · smart_segmenter · subtitle ·         │
│  llm_proxy.rs（🆕 LLM 代理） · commentary.rs（🆕 解说命令）             │
└─────────────────────────────────────────────────────────────────────────┘
                              ↕ FFmpeg / Whisper / TTS / 文件系统
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript 5 + Vite 6 | SPA 桌面应用 |
| 状态管理 | Zustand v5（持久化） | 原子化 stores |
| UI 组件 | shadcn/ui + Tailwind CSS 4 | OKLCH 色彩空间 |
| 桌面运行时 | Tauri v2 | WebView2 / WebKit |
| 后端语言 | Rust 2021 edition | 高性能视频处理 |
| 视频处理 | FFmpeg | 编解码 / 裁剪 / 转码 |
| 语音识别 | faster-whisper | 本地 ASR，断网可用 |
| AI 模型 | OpenAI 兼容 API | 多提供商统一抽象 |

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 前端构建 |
| Rust | 1.75+ | Tauri 后端编译（`src-tauri/`） |
| FFmpeg | 系统安装 | 视频编解码（命令行工具） |

### 安装运行

```bash
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
npm install
npm run dev
```

访问 **http://localhost:1430**

### 构建桌面应用

```bash
# 使用 Tauri CLI 构建
npm run tauri build
```

产物位于 `src-tauri/target/release/`（或 `target/bundle/` 下各平台安装包）。

> 💡 首次构建 Tauri 会自动下载 Rust 工具链，无需手动安装。

---

## 🤖 支持的 AI 模型

只需配置**一个** API Key 即可使用全部 AI 功能。所有模型数据由 `src/core/config/aiModels.config.ts` 统一维护（验证日期：2026-05）。

### Commentary Mode 推荐模型

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 解说词生成 | **DeepSeek V4-Pro** | 性价比最高，中文创作能力强 |
| 语义分段 | DeepSeek V4-Flash | 速度快，批量处理 |
| 高质量创作 | GPT-5.5 | 推理能力最强 |
| 中文长文本 | Qwen3.6-Max | 中文创作最佳 |

### 按提供商

| 提供商 | 推荐模型 | 适用场景 |
|--------|----------|----------|
| **DeepSeek** | V4-Pro（推荐）、V4-Flash | 🏆 性价比最高，Clip Script 生成、复杂推理 |
| **OpenAI** | GPT-5.5（旗舰）、GPT-5.5-Pro、GPT-5.4-nano | 多模态视频理解、高质量脚本生成 |
| **Anthropic** | Claude Opus 4.7（旗舰）、Claude Sonnet 4.6、Claude Haiku 4.5 | 长文本分析与脚本创作、风格稳定 |
| **Google** | Gemini 3.1 Pro（旗舰）、Gemini 3.1 Flash、Gemini 3.1 Flash-Lite（性价比） | 多模态理解、1M 上下文 |
| **阿里云** | Qwen3.6-Max（旗舰）、Qwen3.6-Plus、Qwen3.6-Flash | 中文内容创作、编程能力 |
| **月之暗面** | Kimi K2.6（推荐）、Kimi K2.5 | 中文长文本分析、视频语义 |
| **智谱AI** | GLM-5（旗舰）、GLM-5-Turbo、GLM-4.7 | 中文多模态、高上下文 |
| **科大讯飞** | Spark 4.0、Spark 3.5 | 语音相关任务、TTS 前置处理 |

---

## 📦 下载安装

桌面应用预构建包在 [GitHub Releases](https://github.com/Agions/CutDeck/releases) 页面下载：

| 平台 | 文件名 |
|------|--------|
| Windows | `CutDeck-{version}-windows-x64-setup.exe` |
| macOS (Apple Silicon) | `CutDeck-{version}-macos-arm64.dmg` |
| macOS (Intel) | `CutDeck-{version}-macos-x64.dmg` |
| Linux | `CutDeck-{version}-linux-x64.deb` |

> **macOS 首次运行被拦截？** 右键 → **打开** → 确认。或运行：
> ```bash
> sudo xattr -rd com.apple.quarantine "/Applications/CutDeck.app"
> ```

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [用户指南](./docs/guide/) | 快速开始、AI 分析、导出等 |
| [开发者文档](./docs/dev/) | 架构、命令、API 等 |
| [Commentary Mode](./docs/guide/commentary-mode.md) | 解说模式完整指南 |
| [Script Generation](./docs/guide/script-generation.md) | 解说词生成详解 |

---

## 🤝 参与贡献

| 方式 | 说明 |
|------|------|
| 🐛 报告 Bug | [GitHub Issues](https://github.com/Agions/CutDeck/issues) |
| 📝 完善文档 | 直接提交 PR |
| 💡 功能建议 | [GitHub Issues](https://github.com/Agions/CutDeck/issues) |
| 🔧 提交代码 | Fork → 开发 → PR → Review |

---

## 📄 许可证

[MIT License](./LICENSE) · Copyright © 2025-2026 [Agions](https://github.com/Agions)

---

<div align="center">

觉得有帮助？给一个 ⭐

</div>