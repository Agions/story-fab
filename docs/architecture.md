---
title: 架构概览
description: CutDeck 系统架构和技术设计的核心要点速查。
---

# 架构概览

本文档帮助你快速理解 CutDeck 的核心系统架构。

---

## 系统架构

CutDeck 采用 **分层模块化架构**：

```
┌──────────────────────────────────────────────────────────────┐
│                        UI 层 (React 18)                     │
│     Landing 页面 · Dashboard · 编辑器 · AI 控制台             │
├──────────────────────────────────────────────────────────────┤
│                       核心层 (core/)                         │
│   services/  · workflow/  · hooks/  · video/  · types/       │
├──────────────────────────────────────────────────────────────┤
│                       状态层 (store/)                        │
│   Zustand v5 持久化 stores                                   │
├──────────────────────────────────────────────────────────────┤
│                       外部依赖层                              │
│        FFmpeg · Tauri IPC (Rust) · AI APIs                  │
└──────────────────────────────────────────────────────────────┘
```

**设计原则**：UI 层与业务逻辑完全解耦，核心逻辑通过 Tauri IPC 与 Rust 后端通信。

---

## 目录结构

```
CutDeck/
├── src/                          # React 前端
│   ├── core/                     # 核心业务模块（域驱动）
│   │   ├── types.ts              # 全局类型定义（唯一类型出口）
│   │   ├── video/                # 视频处理管道
│   │   │   ├── IVideoProcessor.ts   # 接口
│   │   │   ├── BaseVideoProcessor.ts# 基类（FFmpeg 缓存、错误归一化）
│   │   │   └── TauriVideoProcessor.ts# Tauri invoke 实现
│   │   ├── services/             # 业务服务
│   │   │   ├── ai.service.ts        # AI 模型调用（769 行）
│   │   │   ├── vision.service.ts     # 场景/情绪/对象检测
│   │   │   ├── asr.service.ts        # Whisper ASR 集成
│   │   │   ├── subtitle.service.ts   # 字幕处理
│   │   │   ├── export.service.ts     # 导出服务
│   │   │   ├── workflow.service.ts   # 工作流管理
│   │   │   └── smart-cut.service.ts  # 智能裁切
│   │   ├── workflow/             # 工作流引擎
│   │   │   ├── WorkflowEngine.ts     # 状态机引擎
│   │   │   ├── steps/               # 步骤执行器
│   │   │   └── types.ts
│   │   ├── hooks/                # React Hooks（CutDeck 专用）
│   │   │   ├── useWorkflowEngine.ts  # 工作流 hook（v1.2.0 新增）
│   │   │   ├── useVideo.ts
│   │   │   └── useAIClip.ts
│   │   └── constants/            # 常量定义（含 AI 模型列表）
│   │
│   ├── store/                    # Zustand Stores（UI 状态）
│   │   ├── appStore.ts             # App 级（主题、侧边栏、通知）
│   │   ├── projectStore.ts          # 项目列表/筛选/排序
│   │   ├── editorStore.ts           # 编辑器状态（时间线、轨道）
│   │   └── mainStore.ts             # AI 模型设置（→ useModelStore）
│   │
│   ├── components/               # React UI 组件
│   ├── pages/                    # 页面组件
│   ├── hooks/                    # 通用 Hooks（跨项目可用）
│   └── services/                 # 兼容层 Facade
│
├── src-tauri/                    # Tauri 后端 (Rust)
│   └── src/
│       ├── main.rs                 # Tauri 入口
│       ├── lib.rs                  # 命令注册
│       ├── video_processor.rs      # 视频处理
│       ├── smart_segmenter.rs       # 智能分段
│       ├── highlight_detector.rs    # 高光检测
│       ├── subtitle.rs              # 字幕处理
│       └── video_effects.rs        # FFmpeg 滤镜
│
├── docs/                        # VitePress 文档
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 核心模块

### 视频处理管道

```
IVideoProcessor（接口）
    ↑
BaseVideoProcessor（基类） — FFmpeg 缓存、错误归一化、参数校验
    ↑
TauriVideoProcessor（实现） — 调用 Tauri invoke → Rust FFmpeg
```

**扩展新驱动**（WebCodecs 等）：
```typescript
class WebCodecsVideoProcessor extends BaseVideoProcessor {
  protected doAnalyze(path) { /* ... */ }
  protected doCut(input, output, segments, opts) { /* ... */ }
}
```

### 工作流引擎

```
WorkflowEngine（状态机）
    ├── subscriber 模式（状态变更广播）
    ├── RetryRequest / SkipRequest 信号
    └── executeStep()（自动重试 + 步骤图执行）

步骤注册 → createWorkflowEngine() → engine.run()
React 连接 → useWorkflowEngine() hook
```

**已注册步骤**：`upload / analyze / template-select / script-generate / script-dedup / script-edit / subtitle / ai-clip / music / timeline-edit / preview / export`

### Rust 后端命令

| 命令 | 说明 |
|------|------|
| `transcode_with_crop` | 多格式裁切（9:16/1:1/16:9） |
| `detect_smart_segments` | 智能场景分段 |
| `detect_highlights` | 高光时刻检测 |
| `apply_filter_chain` | FFmpeg 滤镜链 |
| `get_video_metadata` | 获取视频元数据 |

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| UI 框架 | **React 18** + TypeScript |
| 构建工具 | **Vite 6** |
| 桌面框架 | **Tauri v2**（Rust 后端） |
| 状态管理 | **Zustand v5**（持久化） |
| 样式 | **Tailwind CSS** + CSS Variables |
| AI 服务 | 多 Provider（OpenAI/Anthropic/Google/DeepSeek/阿里/智谱/Kimi） |
| ASR | **faster-whisper**（本地） |
| 文档 | VitePress |

---

## Tauri IPC 通信

CutDeck 使用 Tauri IPC 前后端通信：

```typescript
// 前端调用 Rust 后端
import { invoke } from '@tauri-apps/api/tauri'

const metadata = await invoke('get_video_metadata', {
  path: '/path/to/video.mp4'
})

const result = await invoke('transcode_with_crop', {
  inputPath: '/path/to/input.mp4',
  outputPath: '/path/to/output.mp4',
  aspect: '9:16',
  quality: 'high'
})
```

---

## 相关文档

- 🔧 [安全设计](../security.md) — API 密钥和数据安全
- 🤖 [AI 模型配置](../ai-config.md) — AI 服务集成
- 🔌 [项目结构](../project-structure.md) — 详细目录说明
