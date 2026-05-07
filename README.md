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

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Rust 1.75+（用于 Tauri 后端编译）
- FFmpeg（系统安装或通过 Tauri 自动下载）

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
# 安装 Rust（已有可跳过）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 构建 Tauri 应用
npm run tauri build
```

产物位于 `src-tauri/target/release/`（或 `target/bundle/` 下各平台安装包）。

---

## 🤖 支持的 AI 模型

只需配置**一个** API Key 即可使用全部 AI 功能：

| 提供商 | 模型 | 适用场景 |
|--------|------|----------|
| DeepSeek | V4-Flash（推荐）、V4-Pro（推理） | 🏆 性价比最高，Clip Script 生成 |
| OpenAI | GPT-4o、o3、o3-mini | 剧情分析、内容理解 |
| Anthropic | Claude 3.5 Sonnet、Claude 3 Opus | 长文本分析 |
| 阿里云 | Qwen-Max、Qwen-Plus | 中文内容创作 |
| 月之暗面 | Kimi（moonshot-v1）| 长文本分析 |

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────────────────┐
│                        UI 层 (React 18)                     │
│     Landing · Dashboard · 编辑器 · AI 控制台                  │
├──────────────────────────────────────────────────────────────┤
│                      核心层 (src/core/)                      │
│   services/ · pipeline/ · hooks/ · video/ · types/           │
├──────────────────────────────────────────────────────────────┤
│                      状态层 (src/store/)                     │
│   Zustand v5 持久化 stores（app · project · editor）         │
├──────────────────────────────────────────────────────────────┤
│                      外部依赖层                               │
│        FFmpeg · Tauri IPC (Rust) · AI APIs                  │
└──────────────────────────────────────────────────────────────┘
```

### 目录结构

```
CutDeck/
├── public/                     # 静态资源
│   ├── logo.svg                # 应用 Logo
│   └── favicon.svg             # Favicon
├── src/                        # React 前端
│   ├── core/                   # 核心业务模块（域驱动）
│   │   ├── types.ts            # 全局类型定义
│   │   ├── video/              # 视频处理管道
│   │   ├── services/           # 业务服务（AI · Vision · ASR · 字幕 · 导出）
│   │   ├── pipeline/           # AI 剪辑工作流（Step 架构）
│   │   │   └── steps/          # BuildCandidates · ScoreClips · GenerateSEO · PrepareExport
│   │   └── hooks/              # React Hooks
│   ├── store/                  # Zustand Stores（app · project · editor）
│   ├── components/             # React UI 组件
│   ├── pages/                  # 页面组件（Landing · Dashboard · Editor · Settings）
│   ├── context/                # React Context（Settings · Theme · Toast）
│   ├── hooks/                  # 通用 Hooks（useLocalStorage · useSettings · useModel）
│   ├── services/               # 外部服务抽象（Tauri IPC · AI API）
│   ├── shared/                 # 共享工具（常量 · 工具函数 · 通知系统）
│   └── styles/                 # 全局样式与主题
├── src-tauri/                  # Tauri 后端 (Rust)
│   └── src/
│       ├── commands/           # FFmpeg · 高光检测 · 智能分段 · 字幕
│       ├── lib.rs              # 命令注册入口
│       ├── highlight_detector.rs
│       ├── smart_segmenter.rs
│       ├── subtitle.rs
│       └── utils.rs
└── scripts/                    # 构建与部署脚本
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 + Vite 6 |
| 状态管理 | Zustand v5（持久化） |
| UI 组件 | shadcn/ui + Tailwind CSS 4 |
| 桌面运行时 | Tauri v2 |
| 后端语言 | Rust |
| 视频处理 | FFmpeg |
| 语音识别 | faster-whisper |

---

## 📖 文档导航

| 文档 | 说明 |
|------|------|
| [CHANGELOG](./CHANGELOG.md) | 版本更新记录 |
| 快速开始 | 5 分钟上手（见上文 🚀 快速开始） |
| AI 剪辑指南 | ClipRepurposing Pipeline 完整说明 |
| Whisper 字幕 | ASR 字幕生成 |
| 多格式导出 | 9:16 / 1:1 / 16:9 导出说明 |

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
