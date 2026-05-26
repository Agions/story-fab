---
title: 项目结构
description: StoryFab 项目目录结构与模块说明
---

# 项目结构

## 目录概览

```
StoryFab/
├── src/                    # React 前端
├── src-tauri/              # Rust 后端（Tauri）
├── docs/                   # VitePress 文档
└── public/                 # 静态资源（logo、图标等）
```

---

## 目录结构详解

### 前端 `src/`（React）

```
src/
├── components/             # React UI 组件
│   ├── StoryFab/            # 工作流组件（workspace/）
│   ├── AIClip/             # AI 剪辑面板
│   ├── ModelSelector/      # 模型选择器
│   ├── CommentaryPanel/    # 解说模式面板
│   │   ├── CommentaryPanel.tsx    # 主容器
│   │   ├── ScriptEditor.tsx       # 解说词编辑器
│   │   ├── StyleSelector.tsx       # 风格选择器
│   │   ├── CommentaryPreview.tsx  # 解说预览（含配音播放）
│   │   └── CommentaryTimeline.tsx # 解说时间轴
│   ├── Settings/           # 设置页
│   └── common/             # 通用组件
├── core/                   # 核心业务逻辑
│   ├── services/           # AI 服务、视频服务
│   ├── video/              # 视频处理
│   └── types/              # 类型定义
├── providers/              # React Context providers
├── context/                # 上下文
├── hooks/                  # 自定义 React Hooks
├── services/               # 封装层（向后兼容）
├── theme/                  # 主题样式
├── pages/                  # 路由页面
│   ├── Projects/           # 项目列表
│   ├── ScriptDetail/       # 脚本详情
│   ├── Settings/           # 设置页
│   └── VideoEditor/        # 视频编辑器
├── store/                  # Zustand 状态管理
└── shared/                 # 跨层共享工具
    ├── types/              # 共享类型
    └── utils/              # 工具函数
```

### 后端 `src-tauri/src/`（Rust）

```
src-tauri/src/
├── lib.rs                  # 库入口、命令注册、plugin 配置
├── main.rs                 # 二进制入口
├── types.rs               # 共享 Rust 类型（IPC 输入/输出结构体）
├── binary.rs              # FFmpeg/FFprobe 路径解析
├── utils.rs               # 日志、时间戳、错误辅助函数
├── video_processor.rs     # 视频裁剪/混音（FFmpeg）
├── subtitle.rs            # Whisper 字幕转录
├── highlight_detector.rs  # 高光检测（音频能量峰值）
├── smart_segmenter.rs     # 智能分段（场景/静默/对话）
├── llm_proxy.rs           # LLM API 代理（隐藏密钥）
└── commands/              # Tauri IPC 命令处理
    ├── mod.rs             # 命令模块统一导出
    ├── ai.rs              # Whisper / 高光检测 / AI 导演
    ├── llm.rs             # LLM 交互（代理）
    ├── commentary.rs      # 解说专用命令
    ├── project.rs         # 项目文件 CRUD
    ├── ffprobe.rs         # 视频元数据分析
    ├── file_ops.rs        # 文件系统操作
    ├── auto_save.rs       # 自动保存
    ├── export_state.rs    # 导出状态
    └── render/            # 渲染子模块
        ├── mod.rs
        ├── transcode.rs         # 比例裁剪 + 完整导出
        ├── autonomous_cut.rs    # AI 多段切割
        ├── preview.rs           # 预览生成
        ├── subtitle_burnin.rs   # 字幕烧录
        └── ffmpeg_builder.rs    # FFmpeg 命令构建器
```

---

## 前端服务层设计

### 视频服务封装

```
src/services/video/
├── videoFacade.ts          # 统一封装层（兼容旧代码）
└── ...

src/core/video/            # 新实现
src/core/services/
├── providers/             # AI 服务提供商
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── deepseek.ts
│   └── ...
└── ...
```

### AI 服务架构

```
src/core/services/providers/
├── openai.ts      # OpenAI GPT 系列
├── anthropic.ts   # Anthropic Claude 系列
├── deepseek.ts    # DeepSeek 系列
└── ...            # 其他提供商
```

---

## 文档结构 `docs/`

```
docs/
├── dev/                   # 开发者文档
│   ├── architecture.md         # 系统架构
│   ├── project-structure.md   # 项目结构（本篇）
│   ├── backend.md             # Rust 后端
│   ├── frontend.md            # React 前端
│   ├── tauri-commands.md      # IPC 命令参考
│   ├── ai-services.md         # AI 服务抽象
│   ├── build-release.md       # 构建发布
│   ├── commentary-workflow.md # 解说工作流设计
│   ├── director-agent.md      # AI Director Agent 设计
│   └── script-generation.md    # LLM 文案生成原理
├── guide/                  # 用户指南
│   ├── index.md            # 介绍
│   ├── quick-start.md      # 快速开始
│   ├── ai-analysis.md      # AI 分析原理
│   ├── script-generation.md # 解说词生成
│   ├── commentary-mode.md   # 解说模式使用指南
│   ├── export.md           # 导出
│   ├── configuration.md    # 配置
│   ├── keyboard-shortcuts.md # 快捷键
│   └── installation.md     # 安装
└── reference/              # 参考文档
    └── faq.md              # 常见问题
```

---

## 关键文件说明

| 文件路径 | 用途 |
|---|---|
| `src/core/tauri/TauriBridge.ts` | 所有前端 → Rust IPC 调用桥接 |
| `src/core/services/commentary/DirectorAgent.ts` | Commentary Mode 状态机 |
| `src/core/services/commentary/ScriptGenerator.ts` | LLM 解说词生成 |
| `src/core/services/providers/` | AI 提供商抽象（OpenAI / Anthropic / DeepSeek 等） |
| `src/components/StoryFab/context/StoryFabProvider.tsx` | 主工作流状态管理 |
| `src/components/CommentaryPanel/` | 解说模式 UI 组件 |
| `src-tauri/src/lib.rs` | Tauri 应用配置、命令注册 |
| `src-tauri/src/llm_proxy.rs` | LLM API 代理（隐藏密钥） |
| `src-tauri/src/commands/commentary.rs` | 解说专用命令 |
| `src-tauri/src/commands/ai.rs` | Whisper、高光检测、AI 导演 |
| `src-tauri/src/commands/render/` | 视频导出管道 |
| `src-tauri/src/types.rs` | Rust IPC 类型定义 |
| `tauri.conf.json` | Tauri 应用配置（标题、identifier、capabilities） |

---

## Commentary Mode 模块说明

### TypeScript 前端（`src/core/services/commentary/`）

```
commentary/
├── index.ts              # 导出入口，DirectorAgent 工厂函数
├── DirectorAgent.ts      # AI 导演状态机（核心编排引擎）
├── ScriptGenerator.ts    # LLM 解说词生成（Prompt 工程）
├── CommentarySynth.ts    # 配音合成（TTS + 时间轴对齐）
└── types.ts              # Commentary 相关类型定义
```

**核心类说明**：
- `DirectorAgent` — 管理 Commentary Mode 全流程状态机
- `ScriptGenerator` — 生成解说词（含 prompt 模板 + 质量检查）
- `CommentarySynth` — 调用 Edge TTS，生成配音音频

### Rust 后端新增（`src-tauri/src/`）

```
llm_proxy.rs              # LLM API 代理（隐藏密钥，统一路由）
commands/commentary.rs    # 解说专用命令（LLM 调用 / 配音合成 / 渲染）
```

---

## 模块依赖关系

```
CommentaryPanel (UI)
    │
    ▼
DirectorAgent (状态机编排)
    │
    ├──► ScriptGenerator (LLM 生成解说词)
    │       │
    │       └──► call_llm (Rust 代理)
    │
    ├──► CommentarySynth (TTS 配音)
    │       │
    │       ├──► synthesize_commentary_audio (Rust)
    │       └──► mix_audio (Rust)
    │
    └──► Render Engine (Rust)
            │
            └──► render_with_commentary (Rust)
```

---

## 新增文件清单（v3.0 Commentary）

### TypeScript 前端

| 文件 | 说明 |
|---|---|
| `src/core/services/commentary/index.ts` | 导出入口 |
| `src/core/services/commentary/DirectorAgent.ts` | AI 导演状态机 |
| `src/core/services/commentary/ScriptGenerator.ts` | LLM 解说词生成 |
| `src/core/services/commentary/CommentarySynth.ts` | TTS 配音合成 |
| `src/core/services/commentary/types.ts` | 类型定义 |
| `src/core/services/video/audio-mix.service.ts` | TTS 配音混音服务 |
| `src/core/services/video/transition-suggestion.ts` | 自动转场建议（30+ 规则矩阵）|
| `src/components/CommentaryPanel/CommentaryPanel.tsx` | 解说面板主容器 |
| `src/components/CommentaryPanel/ScriptEditor.tsx` | 解说词编辑器 |
| `src/components/CommentaryPanel/StyleSelector.tsx` | 风格选择器 |
| `src/components/CommentaryPanel/CommentaryPreview.tsx` | 解说预览 |
| `src/components/CommentaryPanel/CommentaryTimeline.tsx` | 解说时间轴 |

### Rust 后端

| 文件 | 说明 |
|---|---|
| `src-tauri/src/llm_proxy.rs` | LLM API 代理（隐藏密钥） |
| `src-tauri/src/commands/commentary.rs` | 解说专用命令 |

### 文档

| 文件 | 说明 |
|---|---|
| `docs/dev/architecture.md` | 系统架构 v3（重写） |
| `docs/dev/commentary-workflow.md` | 解说工作流设计（新增） |
| `docs/dev/director-agent.md` | AI Director Agent 设计（新增） |
| `docs/dev/script-generation.md` | LLM 文案生成原理（新增） |
| `docs/guide/commentary-mode.md` | 解说模式使用指南（新增） |
| `docs/guide/script-generation.md` | 解说词生成指南（新增） |