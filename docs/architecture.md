---
title: 架构概览
description: StoryForge 系统架构和技术设计的核心要点速查。
---

# 架构概览

本文档帮助你快速理解 StoryForge 的核心系统架构。

---

## 系统架构

StoryForge 采用 **分层模块化架构**：

```
┌──────────────────────────────────────────────────────────────┐
│                        UI 层 (React 18)                     │
│     主界面 · 素材面板 · 预览区域 · 时间线面板 · AI 控制台      │
├──────────────────────────────────────────────────────────────┤
│                       服务层 (Services)                      │
│   AI 服务 · 视频处理服务 · 音频服务 · 导出服务                 │
├──────────────────────────────────────────────────────────────┤
│                        核心层 (Core)                         │
│   配置管理 · 事件总线 · 状态管理 · 依赖注入                    │
├──────────────────────────────────────────────────────────────┤
│                        外部依赖层                             │
│        FFmpeg · Vite · Tauri IPC · AI APIs                 │
└──────────────────────────────────────────────────────────────┘
```

**设计原则**：UI 层与业务逻辑完全解耦，核心逻辑通过 Tauri IPC 与后端通信。

---

## 目录结构

```
StoryForge/
├── src/
│   ├── components/           # React UI 组件
│   │   ├── AIClipPanel/      # AI 剪辑面板
│   │   ├── AIPanel/          # AI 功能面板
│   │   ├── Dashboard/        # 仪表板
│   │   ├── VideoAnalyzer/    # 视频分析
│   │   └── editor/           # 编辑器组件
│   │
│   ├── core/                 # 核心逻辑
│   │   ├── services/          # 服务层
│   │   │   ├── ai.service.ts   # AI 模型调用
│   │   │   ├── video.service.ts # 视频处理
│   │   │   ├── vision.service.ts # 视觉分析
│   │   │   └── workflow.service.ts # 工作流引擎
│   │   ├── types/             # TypeScript 类型定义
│   │   └── constants/         # 常量定义
│   │
│   ├── pages/                # 页面组件
│   │   └── Landing/           # 主入口页面
│   │
│   ├── hooks/                # 自定义 React Hooks
│   │   └── useAI.ts          # AI 交互 Hook
│   │   └── useVideo.ts       # 视频操作 Hook
│   │
│   └── utils/                # 工具函数
│       ├── format.ts          # 格式化工具
│       └── storage.ts         # 本地存储
│
├── public/                   # 静态资源
├── docs/                     # 项目文档
├── src-tauri/               # Tauri 后端 (Rust)
│   ├── src/
│   │   └── main.rs           # Tauri 入口
│   └── Cargo.toml            # Rust 依赖
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 核心模块

### 1. AI Service

AI 服务的统一管理器，负责与各 AI 提供商通信。

| 方法 | 说明 |
|------|------|
| `analyze(videoPath)` | 视频内容分析 |
| `generateScript(context)` | 生成解说文案 |
| `transcribe(audioPath)` | 语音转文字 |
| `synthesize(text)` | 文字转语音 |

### 2. Video Service

视频处理服务，封装 FFmpeg 和 Tauri IPC 调用。

| 方法 | 说明 |
|------|------|
| `extractFrames(videoPath)` | 提取关键帧 |
| `getMetadata(videoPath)` | 获取视频元数据 |
| `trim(start, end)` | 视频裁剪 |
| `concat(clips)` | 视频拼接 |

### 3. Workflow Service

工作流引擎，管理 AI 剪辑的完整流程。

```
工作流状态机：
IDLE → ANALYZING → GENERATING → PREVIEW → EXPORT → COMPLETE
         ↓           ↓           ↓         ↓
       ERROR       ERROR       ERROR     ERROR
```

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| UI 框架 | **React 18** + TypeScript |
| 构建工具 | **Vite 6** |
| 桌面框架 | **Tauri 2.x** |
| UI 库 | **Ant Design 5** |
| 样式 | CSS Modules + Less |
| 状态管理 | React Context + useReducer |
| 路由 | React Router 6 |
| 文档 | VitePress |

---

## Tauri IPC 通信

StoryForge 使用 Tauri 的 IPC 机制进行前后端通信：

```typescript
// 前端调用 Rust 后端
import { invoke } from '@tauri-apps/api/tauri'

// 调用后端命令
const result = await invoke('get_video_metadata', {
  path: '/path/to/video.mp4'
})
```

---

## 相关文档

- 🔧 [安全设计](../security.md) — API 密钥和数据安全
- 🤖 [AI 模型配置](../ai-config.md) — AI 服务集成
- 🔌 [项目结构](../project-structure.md) — 详细目录说明
