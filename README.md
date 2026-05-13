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
  AI 驱动的专业视频剪辑工具 · 长视频一键智能剪辑 · 多平台分发
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

## 🎯 解决的问题

**传统视频剪辑的最大痛点**：一个长视频，想剪成多个精彩短片段分发到不同平台，需要人工反复观看、逐个标记、手动导出。

CutDeck 用 AI 把这个过程自动化：

```
长视频（直播回放 / 会议录像 / 讲座）
    → AI 智能分析
    → 精彩短片段
    → 多格式导出
    → 一键发布
```

| 场景 | 传统方式 | CutDeck |
|------|---------|---------|
| 抖音创作者 | 人工选段 + 导出 | AI 识别高光 + 一键 9:16 导出 |
| 知识付费 | 逐帧标记 | AI 识别关键内容 + SEO 生成 |
| 会议记录 | 手动截取 | AI 自动分段 + 多格式输出 |

---

## ✨ 核心功能

### 🤖 AI 智能拆条（7 步管道）

```
① 导入视频 → ② AI 分析 → ③ 高光检测 → ④ 候选构建 → ⑤ 多维评分 → ⑥ SEO 生成 → ⑦ 多格式导出
```

- **6 维 AI 评分**：笑声密度 / 情感峰值 / 内容完整度 / 静默比 / 节奏感 / 关键词权重
- **Rust 高光检测**：音频能量峰值 + 场景切换联合识别
- **多平台 SEO 元数据**：自动生成标题 / 描述 / Hashtags，平台原生适配

### 🎬 多格式导出

- **9:16** 竖屏（抖音 / 快手）
- **1:1** 方屏（Instagram）
- **16:9** 横屏（YouTube / B站）
- 一键批量导出，自定义分辨率、帧率、码率

### 🎙️ 本地 Whisper 字幕

faster-whisper 本地推理，精准语音识别 + 毫秒级时间轴对齐，**断网可用**。

> 未安装 faster-whisper 时自动降级为模拟结果，不影响使用流程。

### ⌨️ 专业剪辑体验

- 多轨道时间轴（视频 / 音频 / 字幕独立轨道）
- 20+ 全局快捷键（`空格` 播放 / `I`/`O` 入出点 / `J`-`K`-`L` 逐帧 / `⌘Z` 撤销）
- Timeline 虚拟化（100+ clips 无卡顿）

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI 层 (React 18)                              │
│  Landing  ·  Dashboard  ·  Projects  ·  VideoEditor  ·  Settings       │
├─────────────────────────────────────────────────────────────────────────┤
│  组件层 (src/components/)                                               │
│  AIClip · AIVideoPreview · CutDeck · Layout · ModelSelector ·          │
│  ScriptEditor · Settings                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  核心业务层 (src/core/)                                                 │
│  services/ · pipeline/ · hooks/ · video/ · config/ · types/           │
├─────────────────────────────────────────────────────────────────────────┤
│  状态层 (src/store/)                                                    │
│  Zustand v5 持久化 stores（app · project · editor · timeline）          │
├─────────────────────────────────────────────────────────────────────────┤
│  Tauri Bridge 层 (src/core/tauri/)                                     │
│  TauriBridge — 统一封装所有 Rust IPC 调用                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Rust 后端层 (src-tauri/src/)                                           │
│  commands/ · highlight_detector · smart_segmenter · subtitle ·         │
│  video_processor · lib_optimized                                        │
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

### 目录结构

```
src/                              # React 前端
├── core/                         # 核心业务逻辑
│   ├── services/                 # 服务层
│   │   ├── ai/                   # AI 模型适配（多提供商）
│   │   ├── aiClip/               # AI 剪辑分析
│   │   ├── clip-pipeline/       # 剪辑管道（7步）
│   │   ├── editor/               # 编辑器操作
│   │   ├── export/               # 导出服务（剪映/Jianying）
│   │   ├── subtitle/             # 字幕服务
│   │   ├── providers/            # API 提供商（OpenAI/Anthropic/...）
│   │   └── video/                # 视频处理
│   ├── pipeline/                 # Step 模式管道
│   ├── hooks/                    # React Hooks
│   ├── config/                   # AI 模型 / 平台预设配置
│   ├── types/                    # 共享类型（Jianying/Timeline）
│   ├── video/                    # 视频抽象层（TauriVideoProcessor）
│   └── tauri/                    # TauriBridge 封装
├── components/                   # React 组件
│   ├── AIClip/                   # AI 剪辑面板
│   ├── CutDeck/                  # 主工作流组件
│   ├── Layout/                   # 布局
│   ├── ModelSelector/            # 模型选择器
│   ├── ScriptEditor/             # 脚本编辑器
│   ├── Settings/                 # 设置页
│   └── common/                   # 通用组件
├── pages/                        # 路由页面
│   ├── Projects/                 # 项目列表
│   ├── ScriptDetail/             # 脚本详情
│   ├── Settings/                 # 设置页
│   └── VideoEditor/              # 视频编辑器
├── store/                        # Zustand 状态管理
├── shared/                       # 跨层共享工具
│   ├── types/                    # 共享类型
│   └── utils/                    # 工具函数
└── theme/                        # 主题色彩

src-tauri/src/                    # Rust 后端
├── commands/                     # Tauri IPC 命令
│   ├── ai.rs                     # AI 高光检测 / TTS / 翻译
│   ├── ffprobe.rs                # 视频元数据分析
│   ├── project.rs                # 项目文件 CRUD
│   └── render.rs                 # 渲染 / 导出 / 预览
├── highlight_detector.rs         # 高光检测（音频能量）
├── smart_segmenter.rs            # 智能分段（场景/静默/对话）
├── subtitle.rs                   # Whisper 字幕转录
├── video_processor.rs            # 视频裁剪处理
├── binary.rs                     # FFmpeg/FFprobe 路径解析
├── utils.rs                      # 工具函数
└── lib.rs                        # Tauri 应用入口 + 命令注册

docs/                             # 项目文档
├── ARCHITECTURE.md               # 深度架构文档
└── DEVELOPER_GUIDE.md            # 开发者指南
```

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

### 模型速查

#### OpenAI（旗舰：GPT-5.5）
- 🏆 **GPT-5.5** — 最新旗舰（2026-04），最强多模态，支持视频理解与 agentic 工作流
- **GPT-5.5-Pro** — 高端推理版，最复杂决策与规划
- **GPT-5.4-nano** — 轻量高速，性价比最高，适合批量脚本生成
- **GPT-4o** — 成熟旗舰（2024），多模态均衡
- **o3/o3-mini** — 推理专项，适合镜头匹配、时间轴修正

#### DeepSeek（旗舰：V4-Pro）
- **V4-Pro** — 复杂推理与代码任务首选
- **V4-Flash** — 高性价比，快速响应
- **R1 / R1-0528** — 推理模型，适合判别类任务

#### Anthropic（旗舰：Claude Opus 4.7）
- **Opus 4.7** — 最高智能（2026-04），复杂视频语义分析与高质量脚本
- **Sonnet 4.6** — 长文本组织与风格润色
- **Haiku 4.5** — 轻量高速，批量分析

#### Google（旗舰：Gemini 3.1 Pro）
- **Gemini 3.1 Pro** — 最新旗舰（2026-02），1M token 上下文，推理能力 2x+ 提升，适合超长视频分析
- **Gemini 3.1 Flash** — 高性价比，多模态日常任务
- **Gemini 3.1 Flash-Lite** — 最快最便宜的轻量选择

#### 阿里云（旗舰：Qwen3.6-Max）
- **Qwen3.6-Max** — 旗舰推理，中文创作能力最强
- **Qwen3.6-Plus** — 高性价比均衡选择
- **Qwen3.6-Flash** — 快速响应，批量脚本改写

#### 月之暗面（旗舰：Kimi K2.6）
- **Kimi K2.6**（2026-04）— 当前旗舰，开源模型中 SWE-Bench 顶级，262K 上下文
- ⚠️ Kimi K2 系列将于 2026-05-25 停止维护，推荐迁移至 K2.6

#### 智谱AI（旗舰：GLM-5）
- **GLM-5** — 旗舰模型，中文多模态与长上下文
- **GLM-5-Turbo** — 高性价比均衡选择

#### 讯飞 Spark
- **Spark 4.0** — 最新语音相关任务
- **Spark 3.5** — 成熟稳定选项

> 📝 模型列表由 `src/core/config/aiModels.config.ts` 统一管理，每次版本更新后请同步该文件。

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE](./docs/ARCHITECTURE.md) | 深度架构文档（Rust 层、AI 管道、渲染流程） |
| [DEVELOPER_GUIDE](./docs/DEVELOPER_GUIDE.md) | 开发者指南（调试、测试、发布） |
| [CHANGELOG](./CHANGELOG.md) | 版本更新记录 |

### 关键模块速查

| 模块 | 路径 | 职责 |
|------|------|------|
| AI 剪辑管道 | `src/core/services/clip-pipeline/` | 7 步 AI 拆条流水线 |
| Rust 命令 | `src-tauri/src/commands/` | FFmpeg/FFprobe/Render/AI IPC |
| 高光检测 | `src-tauri/src/highlight_detector.rs` | 音频能量 + 场景切换检测 |
| 智能分段 | `src-tauri/src/smart_segmenter.rs` | 静默/对话/镜头切换分段 |
| Whisper 字幕 | `src-tauri/src/subtitle.rs` | 本地语音识别 |
| 多格式导出 | `src/core/services/clip-pipeline/multiExport.ts` | 9:16 / 1:1 / 16:9 |
| Tauri Bridge | `src/core/tauri/TauriBridge.ts` | Rust IPC 统一封装 |

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
