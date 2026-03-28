# StoryForge

<p align="center">
  <img src="./public/logo.svg" alt="StoryForge" width="128" />
</p>

<h2 align="center">🤖 AI 驱动的专业智能视频剪辑工具</h2>
<h4 align="center">智能混剪 · 剧情分析 · 字幕生成 · 自动配音 · 素材分析</h4>

<p align="center">
  <a href="https://github.com/Agions/StoryForge/releases">
    <img src="https://img.shields.io/github/v/release/Agions/StoryForge?include_prereleases&label=latest" alt="Release" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tauri-2.x-FFC107?logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/AI-GPT%2BClaude-Gold?logo=openai" alt="AI Models" />
  <a href="https://github.com/Agions/StoryForge/stargazers">
    <img src="https://img.shields.io/github/stars/Agions/StoryForge" alt="Stars" />
  </a>
  <a href="https://github.com/Agions/StoryForge/network/members">
    <img src="https://img.shields.io/github/forks/Agions/StoryForge" alt="Forks" />
  </a>
</p>

---

## 📑 目录

```
· 项目定位
· 核心功能
· 技术架构
· 快速开始
· 功能详解
· 技术栈
· 贡献指南
· 更新日志
· 许可证
```

---

## 🎯 项目定位

**StoryForge** 是一款面向创作者的 **AI 智能视频剪辑工具**。

传统剪辑软件依赖人工逐帧操作，StoryForge 通过 AI 理解视频内容——自动识别高光片段、分析场景结构、生成字幕配音——将剪辑效率提升数倍，让你把精力集中在创意本身。

无论你是影视剪辑师、Vlog 创作者、运营运营人员，还是内容团队，StoryForge 都能显著加速你的视频生产流程。

---

## ✨ 核心功能

### 🎬 五大剪辑模式

| 模式 | 说明 |
|------|------|
| **🔥 智能混剪** | AI 自动识别高光时刻（掌声、笑点、动作高潮），一键生成精彩集锦 |
| **🎭 剧情分析模式** | AI 理解视频叙事结构，生成剧情图谱，支持故事驱动的智能剪辑 |
| **🎤 AI 解说模式** | 分析视频内容，自动生成解说词并合成配音 |
| **📝 第一人称视角** | 将第三人称素材转化为个人叙事体验 |
| **🔄 视频重混** | 智能重组视频，保留叙事逻辑同时确保内容独特性 |

### 🤖 AI 能力底座

| 能力 | 说明 |
|------|------|
| 🎬 **场景检测** | 自动识别镜头边界，精准切分场景 |
| 🔊 **音频峰值识别** | 检测掌声、笑声、音乐高潮等关键声音节点 |
| 🏃 **运动分析** | 理解镜头内的动作强度变化 |
| 😊 **情感识别** | 追踪画面情感色调变化（喜悦/悲伤/紧张/平静）|
| 🎤 **语音转写 (ASR)** | 高精度带时间戳的语音转文字 |
| 🔍 **OCR 文字提取** | 从画面中提取可见文字 |

### 🎵 制作工具集

- **智能字幕** — 自动生成、多语言翻译、样式自定义
- **自动配音** — AI 合成语音解说，支持多种音色
- **自动配乐** — 根据视频情绪 AI 匹配背景音乐
- **素材分析** — 快速理解素材内容，节省审片时间
- **多模型支持** — OpenAI GPT / Claude / Gemini / 通义千问 / 智谱 GLM / DeepSeek / Kimi

### 💻 桌面原生体验

- **本地处理** — 所有数据留在本地，隐私安全
- **轻量高效** — Tauri (Rust + WebView)，体积小运行快
- **跨平台** — Windows / macOS / Linux 全平台支持

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                           │
│            React 18 + TypeScript + Ant Design               │
│                    Zustand 状态管理                          │
├─────────────────────────────────────────────────────────────┤
│                        服务层                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │  智能混剪  │ │  剧情分析  │ │  视觉分析  │ │ ASR/OCR │ │
│  │  Service  │ │  Service   │ │  Service   │ │ Service │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │  AI 模型   │ │  字幕生成  │ │  自动配音  │ │  导出   │ │
│  │  适配器    │ │  Service   │ │  Service   │ │ Service │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Tauri 运行时层                          │
│              Rust (文件系统 / FFmpeg / 系统集成)              │
└─────────────────────────────────────────────────────────────┘
```

### 智能剪辑数据流

```
视频输入
    ↓
AI 全量分析（场景 / 音频峰值 / 运动 / 情感）
    ↓
智能决策（高光检测 / 剧情结构 / 叙事逻辑）
    ↓
多模式输出
  ├─ 智能混剪 → 高光集锦
  ├─ 剧情分析 → 故事驱动剪辑
  ├─ AI 解说 → 自动配音成片
  └─ 视频重混 → 原创重组内容
```

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Node.js | ≥ 18 |
| pnpm | ≥ 9 |
| Rust | 最新稳定版（仅开发 Tauri 时需要）|
| FFmpeg | 必须安装并加入 PATH |

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/Agions/StoryForge.git
cd StoryForge

# 安装依赖
pnpm install

# 启动开发服务器
npm run dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 前端开发模式 |
| `npm run build` | 生产构建 |
| `npm run tauri dev` | Tauri 开发模式（完整桌面应用）|
| `npm run tauri build` | 构建桌面安装包 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run test` | 运行测试 |

---

## 🎬 功能详解

### 🔥 智能混剪模式

上传素材 → AI 检测高光（掌声 / 笑点 / 动作）→ 自动生成精彩集锦 → 手动微调 → 导出

**适用场景：** 活动回顾、综艺片段、体育高光、直播精华

---

### 🎭 剧情分析模式

上传视频 → AI 分析场景、对话、情感变化 → 生成剧情图谱 → 选择剪辑策略 → 自动剪辑

**剧情图谱包含：**
- 每个剧情节点的时间戳、类型（开场/推进/高潮/回落/结局）
- 情感变化轨迹
- 剪辑建议（完整版 / 精华版 / 高能混剪版）

**适用场景：** 纪录片剪辑、活动视频、访谈整理、剧情类内容

---

### 🎤 AI 解说模式

上传素材 → AI 分析内容 → 生成专业解说词 → 选择音色合成配音 → 导出成片

**适用场景：** 知识类视频、产品介绍、纪录片旁白、Vlog 叙事

---

### 📝 第一人称视角模式

将第三人称素材转化为具有个人叙事感的视角体验，AI 自动重构叙述角度

**适用场景：** Vlog、旅拍、个人故事类内容

---

### 🔄 视频重混模式

智能重组视频，保留叙事逻辑同时确保内容独特性，支持原创性检测

**适用场景：** 二次创作、素材重组、内容聚合

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **桌面运行时** | Tauri v2 (Rust) |
| **前端框架** | React 18 + TypeScript |
| **UI 组件库** | Ant Design 5 |
| **状态管理** | Zustand |
| **路由** | React Router v6 |
| **国际化** | i18next |
| **构建工具** | Vite 6 |
| **AI 模型** | GPT / Claude / Gemini / 通义千问 / 智谱 GLM / DeepSeek / Kimi |
| **语音识别** | ASR (讯飞 / 腾讯等) |
| **视频处理** | FFmpeg |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

**Commit 规范：**

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链变更 |

详细规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)

---

## 📜 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<p align="center">
  <a href="https://github.com/Agions/StoryForge">⭐ Star</a>
  ·
  <a href="https://github.com/Agions/StoryForge/issues">Bug 反馈</a>
  ·
  <a href="https://github.com/Agions/StoryForge/pulls">提交 PR</a>
  ·
  <a href="https://github.com/Agions/StoryForge/discussions">讨论区</a>
</p>
