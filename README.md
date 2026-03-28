# 🎬 StoryForge

<p align="center">
  <img src="https://raw.githubusercontent.com/Agions/StoryForge/main/public/logo.svg" width="120" alt="StoryForge" onerror="this.style.display='none'" />
</p>

<h2 align="center">AI 驱动的专业智能视频剪辑工具</h2>
<p align="center">
  智能混剪 · 剧情分析 · AI 解说 · 字幕生成 · 本地处理<br/>
  <strong>面向创作者的视频 AI 工作流，从未如此简单</strong>
</p>

<p align="center">

  <!-- Version & License -->
  <a href="https://github.com/Agions/StoryForge/releases">
    <img src="https://img.shields.io/github/v/release/Agions/StoryForge?include_prereleases&logo=github&label=Release" alt="Release"/>
  </a>
  <img src="https://img.shields.io/badge/license-MIT-green.svg?logo=opensourceinitiative&logoColor=white" alt="License"/>
  
  <!-- Tech Stack -->
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tauri-2.x-FFC107?logo=tauri&logoColor=black" alt="Tauri"/>
  <img src="https://img.shields.io/badge/Rust-1.75+-CE422B?logo=rust&logoColor=white" alt="Rust"/>

  <!-- CI & Community -->
  <a href="https://github.com/Agions/StoryForge/stargazers">
    <img src="https://img.shields.io/github/stars/Agions/StoryForge?logo=github" alt="Stars"/>
  </a>
  <a href="https://github.com/Agions/StoryForge/network/members">
    <img src="https://img.shields.io/github/forks/Agions/StoryForge?logo=github" alt="Forks"/>
  </a>
  <a href="https://github.com/Agions/StoryForge/issues">
    <img src="https://img.shields.io/github/issues/Agions/StoryForge" alt="Issues"/>
  </a>
</p>

---

## ✨ 为什么选择 StoryForge

| 传统剪辑 | StoryForge |
|---------|-----------|
| 逐帧手工操作，效率低 | AI 自动理解内容，一键生成初稿 |
| 需要逐个高光手动标记 | 音频峰值 + 运动分析自动捕捉高光 |
| 多人协作困难 | 本地处理，隐私安全 |
| 多工具切换 | 剪辑 / 字幕 / 配音 / 导出，一站式完成 |

---

## 🎯 核心功能

### 五种剪辑模式

| 模式 | 能力 | 适用场景 |
|------|------|---------|
| 🔥 **智能混剪** | AI 识别高光时刻（掌声/笑点/动作高潮），一键生成精彩集锦 | 活动回顾、体育高光、综艺片段 |
| 🎭 **剧情分析** | 理解叙事结构，生成剧情图谱，支持故事驱动的智能剪辑 | 纪录片、访谈、活动视频、剧情内容 |
| 🎤 **AI 解说** | 分析内容自动生成解说词，支持多种音色合成配音 | 知识视频、产品介绍、纪录片旁白 |
| 📝 **第一人称视角** | 将第三人称素材转化为个人叙事体验，视角自动重构 | Vlog、旅拍、个人故事 |
| 🔄 **视频重混** | 智能重组，保留叙事逻辑同时确保内容原创性 | 二次创作、素材重组、内容聚合 |

### 🤖 AI 能力底座

```
┌─────────────────────────────────────────────────────────────┐
│  视觉分析          音频处理           文本生成              │
│  ─────────         ─────────         ─────────              │
│  🎬 场景检测       🎤 ASR 转写       ✍️  解说生成          │
│  😊 情感识别       🔊 峰值检测       🎵  配乐匹配          │
│  🏃 运动分析       📝 字幕提取       🔍  OCR 文字          │
└─────────────────────────────────────────────────────────────┘
```

| 能力 | 说明 |
|------|------|
| 场景检测 | 精准切分镜头边界 |
| 情感识别 | 追踪画面色调变化（喜悦/悲伤/紧张）|
| 运动分析 | 理解镜头内动作强度 |
| ASR 语音转写 | 高精度带时间戳 |
| 音频峰值检测 | 笑声、掌声、音乐高潮 |
| OCR 文字提取 | 画面可见文字识别 |

### 🎵 制作工具集

- **智能字幕** — 自动生成 / 多语言翻译 / 样式自定义
- **自动配音** — 多音色合成 / 语速调节
- **自动配乐** — 根据内容情绪匹配 BGM
- **多轨编辑** — 视频 / 音频 / 字幕 / 特效轨道
- **批量导出** — 队列式自动导出多个项目

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│  用户界面层                                                    │
│  React 18 + TypeScript + Ant Design 5 + Zustand               │
├─────────────────────────────────────────────────────────────┤
│  服务层                                                       │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐         │
│  │剧情分析  │ │智能剪辑   │ │视觉分析│ │ASR/OCR│         │
│  └─────────┘ └──────────┘ └────────┘ └────────┘         │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐         │
│  │AI 模型  │ │字幕生成  │ │自动配音│ │ 导出  │         │
│  └─────────┘ └──────────┘ └────────┘ └────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Tauri 运行时层                                               │
│  Rust（文件系统 / FFmpeg / 系统集成）                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | ≥ 18 |
| pnpm | ≥ 9 |
| FFmpeg | 必须安装并加入 PATH |
| Rust | 仅开发 Tauri 时需要 |

### 安装

```bash
# 克隆项目
git clone https://github.com/Agions/StoryForge.git
cd StoryForge

# 安装依赖
pnpm install

# 配置 AI 密钥
cp .env.example .env
# 编辑 .env，填入你的 API Key

# 启动
npm run dev        # 前端开发
npm run tauri dev   # 完整桌面应用
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 前端开发模式 |
| `npm run build` | 生产构建 |
| `npm run tauri dev` | Tauri 开发模式 |
| `npm run tauri build` | 构建安装包 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行测试 |

---

## 🤖 支持的 AI 模型

| 厂商 | 模型 | 适用场景 |
|------|------|---------|
| OpenAI | GPT-4o / GPT-4o-mini | 综合文本生成、多模态 |
| Anthropic | Claude 3.5 Sonnet / Haiku | 长文本分析、代码 |
| Google | Gemini 1.5 Pro / Flash | 多模态理解 |
| DeepSeek | DeepSeek Chat | 推理任务、中文内容 |
| 通义千问 | Qwen Turbo / Plus | 中文对话、中文内容 |
| 智谱 AI | GLM-4 / GLM-4V | 多任务、视觉理解 |
| Kimi | Moonshot V1 | 超长上下文处理 |

---

## 📦 支持的格式

### 输入

| 格式 | 说明 |
|------|------|
| MP4 | 推荐格式 |
| MOV | macOS 原生 |
| WebM | Web 优化 |
| AVI / MKV | 传统格式 |

### 输出

| 格式 | 分辨率 | 编码 |
|------|--------|------|
| MP4 | 720p / 1080p / 4K | H.264 / H.265 |
| WebM | 720p / 1080p | VP8 / VP9 |
| MOV | 1080p / 4K | H.264 |

---

## 🌟 特色亮点

| 亮点 | 说明 |
|------|------|
| 🛡️ **本地处理** | 所有文件不离本地，隐私安全 |
| 💻 **跨平台** | Windows / macOS / Linux 原生应用 |
| ⚡ **轻量高效** | Tauri 构建，体积小启动快 |
| 🔌 **插件化 AI** | 支持接入任意兼容的 LLM API |
| ⌨️ **快捷操作** | 完整键盘快捷键支持 |
| 💾 **自动保存** | 防止编辑内容丢失 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

**Commit 类型：**

```
feat     新功能
fix      修复 bug
docs     文档更新
refactor 代码重构
perf     性能优化
test     测试相关
chore    构建/工具链变更
```

详细规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 许可证

[MIT License](./LICENSE) — 可自由使用、修改和分发。

---

## 🔗 相关链接

<p align="center">

  **[⭐ Star this repo](https://github.com/Agions/StoryForge)** &nbsp;·&nbsp;
  **[🐛 Bug Report](https://github.com/Agions/StoryForge/issues)** &nbsp;·&nbsp;
  **[💡 Feature Request](https://github.com/Agions/StoryForge/discussions)** &nbsp;·&nbsp;
  **[📖 文档](https://github.com/Agions/StoryForge#readme)**

  **[📋 CHANGELOG](./CHANGELOG.md)** &nbsp;·&nbsp;
  **[🏗️ 开发规范](./docs/naming-convention.md)**

</p>
