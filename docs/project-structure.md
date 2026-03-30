---
title: 项目结构
description: StoryForge 项目目录结构详解，帮助你快速了解项目代码组织方式。
---

# 项目结构

StoryForge 使用 React + TypeScript + Vite + Tauri 构建。

## 整体目录结构

```
StoryForge/
├── src/                        # React 前端源码
│   ├── components/             # React UI 组件
│   ├── core/                  # 核心逻辑
│   ├── pages/                 # 页面组件
│   ├── hooks/                 # 自定义 Hooks
│   ├── styles/                # 全局样式
│   ├── utils/                 # 工具函数
│   ├── App.tsx               # 应用入口
│   ├── main.tsx              # React 入口
│   └── index.css             # 全局 CSS
│
├── src-tauri/                 # Tauri 后端 (Rust)
│   ├── src/
│   │   └── main.rs           # Rust 入口
│   ├── Cargo.toml            # Rust 依赖
│   ├── tauri.conf.json       # Tauri 配置
│   └── icons/                # 应用图标
│
├── public/                    # 静态资源
│   └── logo.svg              # Logo
│
├── docs/                      # 项目文档 (VitePress)
│   ├── .vitepress/           # VitePress 配置
│   │   ├── config.mts        # 主配置文件
│   │   └── style.css         # 自定义样式
│   ├── guide/                # 指南文档
│   ├── index.md              # 首页
│   └── *.md                  # 其他文档
│
├── package.json              # npm 依赖
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 配置
├── index.html                # HTML 入口
└── SPEC.md                   # 项目规格说明
```

---

## src/ 目录详解

```
src/
├── components/                # UI 组件库
│   ├── AIClipPanel/          # AI 剪辑面板
│   │   ├── index.tsx
│   │   └── index.module.css
│   ├── AIPanel/             # AI 功能面板
│   │   ├── index.tsx
│   │   └── index.module.css
│   ├── Dashboard/            # 仪表板
│   │   ├── index.tsx
│   │   └── index.module.css
│   ├── VideoAnalyzer/        # 视频分析组件
│   │   ├── index.tsx
│   │   └── index.module.css
│   ├── VideoSelector/         # 视频选择器
│   ├── VideoProcessingController/  # 处理控制器
│   └── VideoInfo/            # 视频信息展示
│
├── core/                     # 核心逻辑
│   ├── services/             # 服务层
│   │   ├── ai.service.ts     # AI 模型调用服务
│   │   ├── video.service.ts  # 视频处理服务
│   │   ├── vision.service.ts # 视觉分析服务
│   │   └── workflow.service.ts # 工作流引擎
│   ├── types/                # TypeScript 类型定义
│   │   ├── ai.ts            # AI 相关类型
│   │   ├── video.ts         # 视频相关类型
│   │   └── index.ts         # 类型导出
│   └── constants/            # 常量定义
│       └── index.ts          # 全局常量
│
├── pages/                    # 页面级组件
│   └── Landing/              # 主落地页
│       ├── index.tsx
│       └── index.module.css
│
├── hooks/                    # 可复用 Hooks
│   ├── useAI.ts             # AI 交互 Hook
│   ├── useVideo.ts          # 视频操作 Hook
│   └── useWorkflow.ts        # 工作流 Hook
│
├── styles/                   # 样式资源
│   ├── global.css           # 全局样式
│   └── vintage-film.css     # 复古胶片风格
│
├── utils/                    # 工具函数
│   ├── format.ts            # 格式化工具
│   └── storage.ts           # 本地存储
│
├── App.tsx                  # 应用根组件
├── main.tsx                 # React DOM 入口
└── index.css                # 全局 CSS
```

---

## src-tauri/ 目录详解

```
src-tauri/
├── src/
│   └── main.rs              # Rust 后端入口
├── Cargo.toml               # Rust 依赖配置
├── tauri.conf.json          # Tauri 主配置
├── build.rs                 # 构建脚本
└── icons/                   # 应用图标
```

---

## 主要模块说明

### components/

UI 组件库，包含所有可复用的界面组件。每个组件都有独立的目录，使用 CSS Modules 进行样式隔离。

| 组件 | 说明 |
|------|------|
| `AIClipPanel` | AI 剪辑面板，核心交互界面 |
| `AIPanel` | AI 功能控制面板 |
| `Dashboard` | 主仪表板视图 |
| `VideoAnalyzer` | 视频分析结果显示 |
| `VideoSelector` | 素材选择器 |
| `VideoProcessingController` | 视频处理进度控制 |

### core/services/

核心服务层，负责与 AI 服务和视频处理后端通信。

| 服务 | 说明 |
|------|------|
| `ai.service.ts` | AI 模型调用服务，统一管理各 AI 提供商 |
| `video.service.ts` | 视频处理服务，封装 FFmpeg/Tauri IPC |
| `vision.service.ts` | 视觉分析服务 |
| `workflow.service.ts` | 工作流引擎，管理剪辑流程 |

### core/types/

TypeScript 类型定义，确保全项目类型安全。

| 类型文件 | 说明 |
|----------|------|
| `ai.ts` | AI 相关类型（模型、响应、配置） |
| `video.ts` | 视频相关类型（元数据、剪辑点） |
| `index.ts` | 类型统一导出 |

### hooks/

可复用的 React Hooks 逻辑。

| Hook | 说明 |
|------|------|
| `useAI` | AI 交互封装（调用 AI 服务） |
| `useVideo` | 视频操作封装（导入、分析、剪辑） |
| `useWorkflow` | 工作流状态管理 |

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| UI 框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 桌面框架 | Tauri 2.x |
| UI 库 | Ant Design 5 |
| 样式 | CSS Modules + Less |
| 状态管理 | React Context + useReducer |
| 路由 | React Router 6 |
| 文档 | VitePress |
| 后端 | Rust (via Tauri) |

---

## 相关文档

- [架构概览](./architecture.md) — 系统架构说明
- [安全设计](./security.md) — 安全机制说明
- [AI 模型配置](./ai-config.md) — AI 服务集成
