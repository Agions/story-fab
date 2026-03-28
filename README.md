# StoryForge

<p align="center">
  <img src="./public/logo.svg" alt="StoryForge" width="128" />
</p>

<h2 align="center">🎬 AI 驱动的智能视频叙事创作平台</h2>
<h4 align="center">面向影视创作者和内容创作者，让每一个故事都被精准讲述</h4>

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
· 项目概述
· 核心特性
· 技术架构
· 快速开始
· 剪辑模式详解
· 技术栈
· 贡献指南
· 更新日志
· 许可证
```

---

## 🎯 项目概述

**StoryForge** 是一款面向影视创作者和内容创作者的 AI 视频内容创作平台。

不同于传统的视频编辑器，StoryForge 能够**理解视频中的故事**——它可以分析叙事结构、检测情感节点、识别剧情转折点，并自动生成保留叙事完整性的智能剪辑。

无论你是纪录片剪辑师、Vlog 创作者，还是影视从业者，StoryForge 都能帮助你将素材快速转化为有感染力的叙事作品。

---

## ✨ 核心特性

### 🎭 智能剪辑模式

| 模式 | 说明 |
|------|------|
| **🎬 AI 解说模式** | 上传素材 → AI 分析内容 → 生成专业解说词 → 合成配音 → 导出成片 |
| **🔥 智能混剪** | AI 识别高光时刻（掌声、笑点、动作高潮）→ 自动生成精彩集锦 |
| **📝 第一人称视角** | 将第三人称素材转化为个人叙事体验，AI 重构视角 |
| **🔄 视频重混** | 智能重组视频，保留叙事逻辑同时确保内容独特性 |
| **🎭 剧情分析模式** ✨ 新增 | 理解叙事结构，分析剧情节点，生成故事驱动的智能剪辑 |

### 🤖 AI 能力底座

| 能力 | 说明 |
|------|------|
| 🎬 **场景检测** | 自动识别镜头边界，精准切分场景 |
| 🔊 **音频峰值识别** | 检测掌声、笑声、音乐高潮等关键声音节点 |
| 🏃 **运动分析** | 理解镜头内的动作强度变化 |
| 😊 **情感识别** | 追踪画面情感色调变化（喜悦/悲伤/紧张/平静） |
| 🎤 **语音转写 (ASR)** | 高精度带时间戳的语音转文字 |
| 🔍 **OCR 文字提取** | 从画面中提取可见文字 |

### 🎵 制作工具

- **智能字幕** — 自动生成、多语言翻译、样式自定义
- **自动配乐** — 根据视频情绪 AI 匹配背景音乐
- **多模型支持** — OpenAI GPT / Claude / Gemini / 通义千问 / 智谱 GLM / DeepSeek / Kimi

### 💻 桌面原生体验

- **本地处理** — 所有数据留在本地，隐私安全
- **轻量高效** — Tauri (Rust + WebView) 构建，体积小运行快
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
│  │  剧情分析  │ │  智能剪辑  │ │  视觉分析  │ │  ASR/OCR │ │
│  │  Service  │ │  Service   │ │  Service   │ │ Service │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │  AI 模型   │ │  字幕生成  │ │  自动配乐  │ │  导出   │ │
│  │  适配器    │ │  Service   │ │  Service   │ │ Service │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Tauri 运行时层                          │
│              Rust (文件系统 / FFmpeg / 系统集成)              │
└─────────────────────────────────────────────────────────────┘
```

### 剧情分析数据流

```
视频输入
    ↓
场景检测（Scene Detection）
    ↓
关键帧提取（Keyframe Extraction）
    ↓
音频转写（ASR）→ 对话内容
    ↓
情感分析（Emotion Recognition）
    ↓
LLM 剧情理解 → 剧情结构 / 主题 / 角色
    ↓
剧情图谱（Plot Timeline）
    ↓
剪辑建议（Clip Suggestions）→ 故事驱动剪辑
```

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Node.js | ≥ 18 |
| npm / pnpm | ≥ 9 |
| Rust | 最新稳定版（仅开发 Tauri 时需要）|
| FFmpeg | 必须安装并加入 PATH |

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/Agions/StoryForge.git
cd StoryForge

# 安装依赖
npm install

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
| `npm run docs:dev` | 文档服务器 |

---

## 🎬 剪辑模式详解

### 🎭 剧情分析模式（新增）

全新上线的叙事优先剪辑方式：

```
用户上传视频
       ↓
AI 全量分析（场景 / 对话 / 情感 / 角色）
       ↓
生成「剧情图谱」—— 标注每个剧情节点的时间戳
       ↓
用户选择想要的叙事元素：
  ✦ 高光时刻（Highlight Moments）
  ✦ 情感转折（Emotional Turns）
  ✦ 剧情高潮（Plot Climax）
       ↓
AI 自动生成故事驱动的剪辑版本
       ↓
输出选项：
  📼 剧情完整版（Full Narrative）
  ✂️ 精华集锦（Highlights Reel）
  ⚡ 高能混剪（Intense Mix）
```

**适用场景：**
- 纪录片剪辑，保留叙事完整性
- 活动视频，需要故事结构的快速剪辑
- 访谈类内容，保持逻辑连贯性
- 剧情类视频，需要理解叙事逻辑的剪辑

---

### 🎬 AI 解说模式

上传素材 → AI 分析内容 → 生成专业解说词 → 合成语音 → 导出成片

适合：知识类视频、产品介绍、纪录片旁白

---

### 🔥 智能混剪模式

上传素材 → AI 检测高光（掌声 / 笑点 / 动作）→ 自动生成精彩集锦 → 手动微调 → 导出

适合：活动回顾、综艺片段、体育高光

---

### 📝 第一人称视角模式

将第三人称素材转化为具有个人叙事感的视角体验，AI 自动重构叙述角度

适合：Vlog、旅拍、个人故事类内容

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

**提交规范：**

```
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
perf:     性能优化
test:     测试相关
chore:    构建/工具链变更
```

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
