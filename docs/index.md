---
title: CutDeck - AI 驱动的专业智能视频剪辑
description: 长视频自动拆条 · 多格式导出 · 本地 Whisper 字幕 · Rust 渲染管线
---

<div class="home-hero">

# 🎬 CutDeck

> **AI 驱动的专业智能视频剪辑工具** — 长视频自动拆条 · 多格式导出 · 本地 Whisper 字幕 · Rust 渲染管线

[快速开始 →](/guide/quick-start) · [GitHub](https://github.com/Agions/CutDeck)

</div>

## 🏗️ 系统架构

从视频输入到成品导出，每一层都由成熟开源技术驱动：

| 层级 | 技术 | 说明 |
|------|------|------|
| 🎬 视频处理 | FFmpeg | H.264/H.265/VP9 等全部主流格式，多轨合流与转码 |
| 🧠 AI 高光检测 | Rust (scdet) | 场景检测 + 音频能量分析，无需模拟数据 |
| 🎙️ Whisper 字幕 | faster-whisper | 本地推理，精准语音识别 + 时间轴对齐 |
| 🛠️ AI 剪辑引擎 | DeepSeek / GPT | 剧本生成、解说词、自动混剪 |
| ⚡ 渲染导出 | Rust + Tauri | 原生性能，跨平台桌面应用 |

## ✨ 核心功能

### 🤖 AI 智能拆条
6维 AI 评分驱动，自动识别精彩片段，一键分发 **抖音 / 小红书 / B站**

### 🎞️ 多轨时间轴剪辑
FFmpeg 专业渲染管线，多轨道编辑，**12+ 视频特效**，开箱即用

### 🎙️ 本地 Whisper 字幕
faster-whisper 本地推理，精准语音识别与时间轴对齐，**断网可用**

### ⚡ AI 剧本生成
DeepSeek / GPT 生成剪辑脚本与解说词，自动合成视频

### 🔒 本地优先
全部运行在本地，无需上传云端，**隐私安全，断网可用**

### 📦 Tauri 桌面端
Tauri 2 + React 18，原生性能体验，轻量安装包

## 🚀 快速开始

### 安装

```bash
# macOS
brew install cutdeck

# Windows
winget install cutdeck

# 或直接下载二进制
https://github.com/Agions/CutDeck/releases
```

### 使用

1. **导入长视频** — 拖拽或点击上传，支持 MP4 / MKV / MOV / AVI / WebM，最大分辨率 4K
2. **AI 分析** — 自动检测场景、高光片段、字幕轨道
3. **导出短片段** — 选择目标平台，AI 自动生成多个 9:16 竖屏片段

```bash
# 自动生成 9:16 竖屏片段
cutdeck split --platform douyin --min-duration 30s

# 导出所有片段
cutdeck export --format mp4 --quality high
```

[查看完整文档 →](/guide/quick-start)

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Zustand + Ant Design 5 + OKLCH 色彩系统
- **桌面**: Tauri 2.x (Rust 后端)
- **AI**: DeepSeek / GPT / faster-whisper
- **渲染**: FFmpeg + Rust 渲染管线
