# ClipFlow 文档

> ClipFlow - 智能 AI 视频创作平台

## 概述

ClipFlow 是一款面向影视创作者和内容创作者的专业 AI 视频内容创作平台，提供智能脚本生成、视频分析和混剪功能。

## 主要特性

| 特性 | 说明 |
|------|------|
| 🎬 智能剪辑 | AI 自动识别场景、智能剪辑 |
| 📝 脚本生成 | 多模型 AI 自动生成解说脚本 |
| 🎭 特效滤镜 | 丰富的视频特效和滤镜 |
| 🔊 音画同步 | 自动音视频同步校正 |
| 📄 字幕支持 | 语音转字幕、多语言支持 |
| 🎤 语音合成 | 文字转语音、配音功能 |

## 快速开始

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/Agions/clip-flow.git
cd clip-flow

# 安装依赖
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:1420

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
clip-flow/
├── src/
│   ├── components/     # React 组件
│   ├── core/
│   │   └── services/   # 核心服务
│   ├── pages/          # 页面组件
│   └── ...
├── docs/               # 文档
├── public/             # 静态资源
└── package.json
```

## 核心服务

- **ClipWorkflowService** - 智能剪辑
- **CommentaryMixService** - 解说混剪
- **AudioVideoSyncService** - 音画同步
- **SubtitleService** - 字幕生成
- **VoiceSynthesisService** - 语音合成
- **VideoEffectService** - 视频特效

## 技术栈

- React 18 + TypeScript
- Ant Design 5
- Vite
- Zustand
- Tauri (桌面端)

## 相关链接

- [GitHub](https://github.com/Agions/clip-flow)
- [问题反馈](https://github.com/Agions/clip-flow/issues)
- [Star](https://github.com/Agions/clip-flow) ⭐
