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
│   │   │   ├── asr.service.ts              # Whisper ASR 集成
│   │   │   ├── subtitle.service.ts         # 字幕处理
│   │   │   ├── export.service.ts           # 导出服务
│   │   │   ├── aiClip.service.ts          # AI 剪辑分析
│   │   │   └── clipRepurposing/            # AI 拆条管道（活跃）
│   │   │       ├── pipeline.ts            # 完整拆条流程
│   │   │       ├── clipScorer.ts           # 6维评分引擎
│   │   │       └── seoGenerator.ts         # 多平台 SEO 元数据
│   │   ├── hooks/                # React Hooks（CutDeck 专用）
│   │   │   ├── useVideo.ts
│   │   │   ├── useModel.ts
│   │   │   └── useEditorState.ts
│   │   └── constants/            # 常量定义（含 AI 模型列表）
│   │
│   ├── components/               # React UI 组件
│   │   └── CutDeck/              # CutDeck 组件（见下节详述）
│   │
│   ├── store/                    # Zustand Stores（UI 状态）
│   │   ├── appStore.ts             # App 级（主题、侧边栏、通知）
│   │   ├── projectStore.ts          # 项目列表/筛选/排序
│   │   ├── editorStore.ts           # 编辑器状态（时间线、轨道）
│   │   └── mainStore.ts             # AI 模型设置（→ useModelStore）
│   │
│   ├── pages/                    # 页面组件
│   ├── hooks/                    # 通用 Hooks（跨项目可用）
│   └── services/                 # 兼容层 Facade
│
├── src-tauri/                    # Tauri 后端 (Rust)
│   └── src/
│       ├── main.rs                 # Tauri 入口
│       ├── lib.rs                  # 命令注册（facade，10行）
│       ├── types.rs                # 所有输入/输出结构体
│       ├── binary.rs               # ffmpeg/ffprobe 路径解析
│       ├── utils.rs                # 工具函数（parse_fraction 等）
│       ├── commands/              # 命令模块（async 化）
│       │   ├── mod.rs
│       │   ├── ffprobe.rs           # check_ffmpeg, analyze_video
│       │   ├── project.rs           # 8 个文件管理命令
│       │   ├── ai.rs                # generate_thumbnail, extract_key_frames, run_ai_director_plan, detect_*
│       │   └── render.rs            # transcode_with_crop, render_autonomous_cut + helpers
│       ├── video_effects.rs        # FFmpeg 滤镜
│       ├── subtitle.rs              # 字幕处理
│       ├── smart_segmenter.rs       # 智能分段
│       └── highlight_detector.rs    # 高光检测
│
├── docs/                        # VitePress 文档
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### CutDeck 组件结构 (components/CutDeck/)

```
CutDeck/
├── index.ts                      # 主入口，导出 CutDeck 组件
├── CutDeckProvider.tsx           # Context Provider（含 reducer 状态管理）
├── AIEditorContext.tsx           # AI 编辑器 Context（场景检测/高光分析）
├── types.ts                      # 类型定义（含 getNextStep/getPrevStep 工具函数）
├── reducer.ts                    # 统一 reducer（clipFlowReducer）
├── initialState.ts               # 初始状态
├── constants.ts                  # 常量（CUT_DECK_STEPS 等）
│
├── Workspace/                    # 工作区子组件
│   ├── Workspace.tsx             # 主容器（含 StepList 内联组件）
│   ├── VideoUpload.tsx           # 视频上传
│   ├── ProjectSetup.tsx          # 项目设置
│   ├── AIVisualizer.tsx          # AI 可视化分析
│   ├── ScriptWriting.tsx         # 脚本撰写
│   ├── VideoComposing.tsx        # 视频合成
│   ├── ClipRippling.tsx          # AI 拆条
│   ├── VideoExport.tsx           # 导出设置
│   ├── functionModeMap.ts        # 功能模式映射
│   ├── HighlightList/            # 高光列表
│   └── index.ts
│
├── ModeSelector/                 # 模式选择器
│   ├── ModeSelector.tsx
│   ├── ModeSelector.test.tsx
│   └── index.ts
│
└── SimpleMode/                   # 简易模式
    ├── ClipListView.tsx
    ├── ClipListView.test.tsx
    └── index.ts
```

---

## Context Provider 架构

CutDeck 使用双 Context 架构管理状态：

### CutDeckProvider（主状态管理）

负责管理 CutDeck 工作流的核心状态（步骤流转、视频信息、脚本数据等）：

```
CutDeckProvider
├── state: CutDeckState          # 状态对象（当前步骤、视频、分析结果等）
├── dispatch: React.Dispatch      # reducer 分发
├── setStep(step)                 # 跳转到指定步骤
├── setFeature(feature)          # 设置功能特性
├── setProject(project)           # 设置项目配置
└── goToNextStep() / goToPrevStep()  # 步骤导航
```

**关键实现要点**：
- Context value 必须使用 `useMemo` 包裹，避免不必要的重渲染（P0 优化项）
- 所有方法必须使用 `useCallback` 包装，确保引用稳定

### AIEditorContext（AI 分析状态）

负责管理 AI 分析相关状态（场景检测、高光检测、智能分段）：

```typescript
// 使用方式
const { analysis, setAnalysis, detectHighlights, detectScenes } = useAIEditor();
```

**注意**：此 Context 同样存在 Context value 未使用 `useMemo` 的 P0 性能问题。

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

### 剪辑工作流（ClipRepurposingPipeline）

```
ClipRepurposingPipeline
    ├── buildCandidates() — 调用 visionService.detectHighlights()（Rust 高光检测）
    ├── clipScorer.topClips() — 6维评分排序
    ├── seoGenerator.generateBatch() — 多平台 SEO 元数据
    └── multiFormatExporter.prepareExportTasks() — 多格式导出准备
```

**6 维评分维度**：`laughterDensity / emotionPeak / speechCompleteness / silenceRatio / speakingPace / keywordBoost`

### Rust 后端命令

**12 commands 已 async 化**（主线程不再阻塞）：

| 命令 | 说明 |
|------|------|
| `check_ffmpeg` | 检查 FFmpeg 是否安装（async）|
| `analyze_video` | 获取视频元数据（async ffprobe）|
| `generate_thumbnail` | 生成缩略图（async ffmpeg）|
| `extract_key_frames` | 提取关键帧（async）|
| `check_app_data_directory` | 获取 AppData 目录（async）|
| `save_project_file` | 保存项目文件（async）|
| `load_project_file` | 加载项目文件（async）|
| `delete_project_file` | 删除项目文件（async）|
| `list_project_files` | 列出项目文件（async）|
| `list_app_data_files` | 列出 AppData 文件（async）|
| `delete_file` | 删除文件（async）|
| `get_file_size` | 获取文件大小（async）|
| `transcode_with_crop` | 多格式裁切（9:16/1:1/16:9）|
| `render_autonomous_cut` | 自动出片（多段合并+转场）|
| `run_ai_director_plan` | AI 导演方案生成|
| `detect_highlights` | 高光时刻检测|
| `detect_smart_segments` | 智能场景分段|
| `get_export_dir` | 获取导出目录|
| `apply_filter_chain` | FFmpeg 滤镜链 |

**安全修复**：devtools feature 已移除（生产构建不再包含 DevTools API），CSP 策略已启用。

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| UI 框架 | **React 18** + TypeScript |
| 构建工具 | **Vite 6** |
| 桌面框架 | **Tauri v2**（Rust 后端） |
| 状态管理 | **Zustand v5**（持久化） |
| 样式 | **Tailwind CSS v4** + CSS Variables（OKLCH 色彩系统） |
| UI 组件库 | **Ant Design 5** + **shadcn/ui** |
| AI 服务 | 多 Provider（OpenAI/Anthropic/Google/DeepSeek/Qwen/Kimi/智谱/Moonshot） |
| ASR | **faster-whisper**（本地） |
| 国际化 | **i18next** + react-i18next |
| 文档 | VitePress |

---

## 性能优化要点

### P0 - 关键性能问题（需立即修复）

**1. Context Value 不稳定**

`CutDeckProvider.tsx` 和 `AIEditorContext.tsx` 的 context value 对象在每次渲染时重新创建，导致所有消费组件不必要地重新渲染。

```typescript
// 错误写法
const value = { state, dispatch, setStep, ... };

// 正确写法
const setStep = useCallback((step: CutDeckStep) => {
  dispatch({ type: 'SET_STEP', payload: step });
}, []);

const value = useMemo(() => ({
  state, dispatch, setStep, ...
}), [state, dispatch, setStep, ...]);
```

### P1 - 高优先级优化

| 问题 | 文件 | 建议 |
|------|------|------|
| Reducer 逻辑重复 | `AIEditorContext.tsx` | 直接导入 `clipFlowReducer` from `./reducer` |
| StepList 未使用 memo | `Workspace.tsx` | 使用 `React.memo` 包装 |
| 辅助函数未记忆化 | `Workspace.tsx` | `isStepAccessible/isStepCompleted` 移到组件外部 |
| handleUpload 依赖不稳定 | `VideoUpload.tsx` | 确保 `goToNextStep` 在 Provider 中用 `useCallback` 包装 |
| handleGenerate 依赖项过多 | `ScriptWriting.tsx` | 重构依赖管理 |

### P2 - 中优先级优化

| 问题 | 文件 | 建议 |
|------|------|------|
| setTimeout 无清理机制 | `AIVisualizer.tsx` | 使用 `useRef` 管理 timeout ID |
| uploadStatusRef 泄露风险 | `VideoUpload.tsx` | 添加清理逻辑 |
| Magic numbers | `ClipRippling.tsx` | 定义为命名常量 |

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