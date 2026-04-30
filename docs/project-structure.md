---
title: 项目结构
description: CutDeck 项目目录结构详解，帮助你快速了解项目代码组织方式。
---

# 项目结构

CutDeck 使用 React + TypeScript + Vite + Tauri 构建，采用分层模块化架构。

## 整体目录结构

```
CutDeck/
├── src/                        # React 前端源码
│   ├── components/             # React UI 组件
│   ├── core/                   # 核心业务模块（域驱动）
│   ├── store/                  # Zustand 状态管理
│   ├── pages/                  # 页面组件
│   ├── hooks/                  # 通用 Hooks
│   ├── services/               # 兼容层 Facade
│   └── styles/                 # 全局样式
│
├── src-tauri/                  # Tauri 后端 (Rust)
│   └── src/
│       ├── main.rs            # Rust 入口
│       ├── lib.rs             # 命令注册
│       ├── types.rs           # 输入/输出结构体
│       ├── commands/          # 命令模块
│       ├── video_effects.rs   # FFmpeg 滤镜
│       ├── subtitle.rs        # 字幕处理
│       ├── smart_segmenter.rs  # 智能分段
│       └── highlight_detector.rs # 高光检测
│
├── public/                     # 静态资源
├── docs/                       # VitePress 文档
├── package.json
├── tsconfig.json
├── vite.config.ts
└── SPEC.md
```

---

## 核心组件：CutDeck

CutDeck 是应用的主工作流组件，采用 Context Provider 架构管理状态。

```
src/components/CutDeck/
├── index.ts                      # 主入口，导出 CutDeck 组件
├── CutDeckProvider.tsx           # Context Provider（含 reducer 状态管理）
├── AIEditorContext.tsx           # AI 编辑器 Context（场景检测/高光分析）
├── types.ts                      # 类型定义（含 getNextStep/getPrevStep 工具函数）
├── reducer.ts                    # 统一 reducer（clipFlowReducer）
├── initialState.ts               # 初始状态
├── constants.ts                  # 常量（CUT_DECK_STEPS 等）
│
├── Workspace/                    # 工作区子组件
│   ├── Workspace.tsx            # 主容器（含 StepList 内联组件）
│   ├── VideoUpload.tsx          # 视频上传
│   ├── ProjectSetup.tsx         # 项目设置
│   ├── AIVisualizer.tsx         # AI 可视化分析
│   ├── ScriptWriting.tsx        # 脚本撰写
│   ├── VideoComposing.tsx       # 视频合成
│   ├── ClipRippling.tsx         # AI 拆条
│   ├── VideoExport.tsx          # 导出设置
│   ├── functionModeMap.ts       # 功能模式映射
│   └── HighlightList/           # 高光列表
│
├── ModeSelector/                # 模式选择器
│   ├── ModeSelector.tsx
│   └── ModeSelector.test.tsx
│
└── SimpleMode/                  # 简易模式
    ├── ClipListView.tsx
    └── ClipListView.test.tsx
```

### CutDeckProvider（主状态管理）

负责管理 CutDeck 工作流的核心状态（步骤流转、视频信息、脚本数据等）：

| 属性/方法 | 说明 |
|---------|------|
| `state: CutDeckState` | 状态对象（当前步骤、视频、分析结果等） |
| `dispatch: React.Dispatch` | reducer 分发 |
| `setStep(step)` | 跳转到指定步骤 |
| `setFeature(feature)` | 设置功能特性 |
| `setProject(project)` | 设置项目配置 |
| `goToNextStep() / goToPrevStep()` | 步骤导航 |

**实现要点**：
- Context value 必须使用 `useMemo` 包裹，避免不必要的重渲染
- 所有方法必须使用 `useCallback` 包装，确保引用稳定

### AIEditorContext（AI 分析状态）

负责管理 AI 分析相关状态（场景检测、高光检测、智能分段）：

```typescript
const { analysis, setAnalysis, detectHighlights, detectScenes } = useAIEditor();
```

---

## src/ 目录详解

```
src/
├── components/                # React UI 组件
│   └── CutDeck/               # CutDeck 主组件（含子组件）
│       ├── Workspace/         # 工作区（视频上传、项目设置、AI分析等）
│       ├── ModeSelector/      # 模式选择器
│       └── SimpleMode/        # 简易模式
│
├── core/                      # 核心业务模块（域驱动）
│   ├── types.ts              # 全局类型定义（唯一类型出口）
│   ├── video/                # 视频处理管道
│   │   ├── IVideoProcessor.ts   # 接口
│   │   ├── BaseVideoProcessor.ts # 基类（FFmpeg 缓存、错误归一化）
│   │   └── TauriVideoProcessor.ts # Tauri invoke 实现
│   ├── services/             # 业务服务
│   │   ├── ai.service.ts        # AI 模型调用
│   │   ├── vision.service.ts     # 场景/情绪/对象检测
│   │   ├── asr.service.ts       # Whisper ASR 集成
│   │   ├── subtitle.service.ts  # 字幕处理
│   │   ├── export.service.ts    # 导出服务
│   │   ├── aiClip.service.ts    # AI 剪辑分析
│   │   └── clipRepurposing/     # AI 拆条管道
│   │       ├── pipeline.ts      # 完整拆条流程
│   │       ├── clipScorer.ts    # 6维评分引擎
│   │       └── seoGenerator.ts  # 多平台 SEO 元数据
│   ├── hooks/                # React Hooks（CutDeck 专用）
│   │   ├── useVideo.ts
│   │   ├── useModel.ts
│   │   └── useEditorState.ts
│   └── constants/            # 常量定义（含 AI 模型列表）
│
├── store/                     # Zustand Stores（UI 状态）
│   ├── appStore.ts           # App 级（主题、侧边栏、通知）
│   ├── projectStore.ts       # 项目列表/筛选/排序
│   ├── editorStore.ts        # 编辑器状态（时间线、轨道）
│   └── mainStore.ts          # AI 模型设置
│
├── pages/                     # 页面组件
├── hooks/                     # 通用 Hooks（跨项目可用）
├── services/                  # 兼容层 Facade
└── styles/                    # 样式资源
```

---

## 核心服务详解

### services/ 业务服务层

| 服务 | 说明 |
|-----|------|
| `ai.service.ts` | AI 模型调用，统一管理多 Provider（OpenAI/Anthropic/Google/DeepSeek/Qwen/Kimi/智谱/Moonshot） |
| `vision.service.ts` | 视觉分析服务，场景/情绪/对象检测 |
| `asr.service.ts` | faster-whisper 本地 ASR 集成 |
| `subtitle.service.ts` | 字幕处理服务 |
| `export.service.ts` | 多格式导出服务 |
| `aiClip.service.ts` | AI 剪辑分析服务 |
| `clipRepurposing/pipeline.ts` | AI 拆条完整流程 |
| `clipRepurposing/clipScorer.ts` | 6维评分引擎 |
| `clipRepurposing/seoGenerator.ts` | 多平台 SEO 元数据生成 |

### video/ 视频处理管道

```
IVideoProcessor（接口）
    ↑
BaseVideoProcessor（基类） — FFmpeg 缓存、错误归一化、参数校验
    ↑
TauriVideoProcessor（实现） — 调用 Tauri invoke → Rust FFmpeg
```

---

## 类型定义

### 全局类型 (core/types.ts)

统一类型出口，定义所有核心类型：

| 类型 | 说明 |
|-----|------|
| `VideoMetadata` | 视频元数据（时长、分辨率、编码格式等） |
| `ClipSegment` | 剪辑片段（起始时间、结束时间、来源） |
| `AIAnalysisResult` | AI 分析结果（场景、高光、情绪） |
| `ProjectConfig` | 项目配置（输出格式、分辨率、帧率） |

### CutDeck 组件类型 (components/CutDeck/types.ts)

| 类型 | 说明 |
|-----|------|
| `CutDeckStep` | 工作流步骤枚举 |
| `CutDeckState` | 主状态对象 |
| `CutDeckFeature` | 功能特性 |
| `getNextStep(step)` | 获取下一步 |
| `getPrevStep(step)` | 获取上一步 |

---

## 组件关系图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI 层 (React 18)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Landing   │  │ Dashboard   │  │  Editor     │  │ AI Console   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
├─────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│         │                │                │                │                │
│  ┌──────▼────────────────────────────────────────────────────▼──────┐       │
│  │                    CutDeckProvider (Context)                      │       │
│  │  ┌─────────────────────────────────────────────────────────────┐ │       │
│  │  │              AIEditorContext (AI 分析状态)                  │ │       │
│  │  └─────────────────────────────────────────────────────────────┘ │       │
│  └──────┬───────────────────────────────────────────────────────────┘       │
├─────────┼───────────────────────────────────────────────────────────────────┤
│         │                     核心层 (core/)                               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │  services/  │  │   video/    │  │   hooks/    │  │   store/    │        │
│  │  - ai       │  │ - Processor│  │ - useVideo  │  │ - appStore  │        │
│  │  - vision   │  │ - Base      │  │ - useModel  │  │ - project   │        │
│  │  - asr      │  │ - Tauri     │  │ - useEditor │  │ - editor    │        │
│  │  - export   │  │             │  │             │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └─────────────┘        │
├─────────┼────────────────┼─────────────────────────────────────────────────┤
│         │                │                  外部依赖层                     │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌────────────────────────────────────┐   │
│  │  Zustand    │  │  Tauri IPC  │  │  FFmpeg · AI APIs · Whisper       │   │
│  │  v5 Store   │  │  (Rust)     │  │                                    │   │
│  └─────────────┘  └──────┬──────┘  └────────────────────────────────────┘   │
│                         │                                                    │
│              ┌──────────▼──────────┐                                        │
│              │     Rust 后端       │                                        │
│              │  - commands/        │                                        │
│              │  - video_effects    │                                        │
│              │  - subtitle         │                                        │
│              │  - highlight_detect │                                        │
│              └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 技术栈

| 层级 | 技术选型 |
|-----|---------|
| UI 框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 桌面框架 | Tauri v2（Rust 后端） |
| 状态管理 | Zustand v5（持久化） |
| 样式 | Tailwind CSS v4 + CSS Variables（OKLCH 色彩系统） |
| UI 组件库 | Ant Design 5 + shadcn/ui |
| AI 服务 | 多 Provider（OpenAI/Anthropic/Google/DeepSeek/Qwen/Kimi/智谱/Moonshot） |
| ASR | faster-whisper（本地） |
| 国际化 | i18next + react-i18next |
| 文档 | VitePress |

---

## 相关文档

- [架构概览](./architecture.md) — 系统架构说明
- [安全设计](./security.md) — 安全机制说明
- [AI 模型配置](./ai-config.md) — AI 服务集成