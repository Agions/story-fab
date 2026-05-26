---
title: 系统架构 v3.0
date: 2024-03-15
categories:
  - 开发文档
  - 架构设计
tags:
  - StoryFab
  - Commentary Mode
  - Tauri
  - React
  - 架构设计
description: StoryFab Commentary Mode AI 影视/短剧解说创作工具系统架构文档
---

# 系统架构 v3.0

> StoryFab Commentary Mode — AI 影视/短剧解说创作工具

---

## 1. 设计目标与核心定位

### 1.1 从"剪辑工具"到"解说创作工具"的演进

StoryFab 经历了从 **Clip Mode（剪辑模式）** 到 **Commentary Mode（解说模式）** 的重大升级。这一转变不仅是功能层面的扩展，更是产品定位的根本性变革。

| 维度 | 旧定位（v2 Clip Mode） | 新定位（v3 Commentary Mode） |
|------|----------------------|------------------------------|
| **核心能力** | 长视频 → 精彩片段 | 视频 → 完整解说视频 |
| **用户目标** | 快速剪辑分发 | 理解剧情 + 生成文案 + 配音合成 + 剪辑成片 |
| **AI 介入点** | 高光检测 + 场景分段 | 剧情理解 + 文案生成 + 配音 + 编排 |
| **输出形态** | 多个短片段 | 带解说配音的完整视频 |
| **用户参与度** | 被动接受 AI 结果 | 多轮交互式创作 |
| **技术复杂度** | 中等 | 高（涉及 LLM、TTS、多轨混音） |

### 1.2 Commentary Mode 的核心升级

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           架构演进对比                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  v2 旧架构：                                                                  │
│  视频 → SmartSegmenter → 高光检测 → 渲染导出                                   │
│                                                                              │
│  v3 新架构：                                                                  │
│  视频 → SmartSegmenter → AI Director → Script Gen → Commentary → 渲染导出      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**核心升级点**：

1. **AI 导演 Agent（Director Agent）**：模拟人类导演的创作思维，进行剧情分析、解说规划、多轮修订
2. **语义分段（Semantic Segmentation）**：在粗分基础上用 LLM 理解每段的剧情/人物/情绪
3. **解说词生成（Script Generation）**：根据语义标注生成专业解说文案
4. **配音合成（Commentary Synthesis）**：TTS 技术生成配音，并与视频精确同步
5. **多轨混音渲染**：解说音轨 + 原声音轨 + BGM 的混合渲染

---

## 2. 技术栈

### 2.1 技术栈总览

| 层级 | 技术选型 | 版本要求 | 说明 |
|------|----------|----------|------|
| **UI 框架** | React | 18.x | 响应式组件化开发 |
| **类型系统** | TypeScript | 5.x | 类型安全 |
| **状态管理** | Zustand | 4.x | 轻量级状态管理 |
| **桌面框架** | Tauri | 2.x | Rust 后端 + Web 前端 |
| **后端语言** | Rust | 1.75+ | 高性能、内存安全 |
| **视频处理** | FFmpeg | 6.x | 视频编解码、裁剪、混音 |
| **字幕转录** | faster-whisper | 0.10+ | 本地 ASR，断网可用 |
| **配音合成** | Edge TTS | - | Windows/macOS 内置 |
| **LLM 抽象层** | AI Provider Service | - | 多提供商统一接口 |
| **LLM 提供商** | OpenAI / DeepSeek / Anthropic / Google | - | 可配置切换 |
| **构建工具** | Vite | 5.x | 前端快速构建 |
| **UI 组件库** | Radix UI + TailwindCSS | - | 无障碍、可定制 |

### 2.2 前端技术详解

```
┌─────────────────────────────────────────────────────────────┐
│                      前端技术栈                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   React     │    │  TypeScript │    │    Vite     │     │
│  │   18.x      │    │    5.x      │    │    5.x      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Zustand   │    │  TailwindCSS│    │  Radix UI   │     │
│  │   4.x       │    │   3.x       │    │   latest    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React Router DOM v6                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 后端技术详解

```
┌─────────────────────────────────────────────────────────────┐
│                      后端技术栈（Rust）                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Tauri     │    │   Serde     │    │    Tokio    │     │
│  │   2.x       │    │   1.x       │    │   async     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  FFmpeg     │    │ faster-     │    │   reqwest   │     │
│  │  (命令)     │    │ whisper     │    │   HTTP      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │    anyhow   │    │    tracing  │    │   tauri     │     │
│  │  错误处理   │    │   日志      │    │  2.x        │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              StoryFab Application                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                     UI Layer (React 18 + TypeScript)                        │  │
│  │                                                                              │  │
│  │   Landing · Dashboard · Projects · Settings （通用页面）                      │  │
│  │   ─────────────────────────────────────────────────────────────────          │  │
│  │   StoryFab Provider（工作流编排）                                              │  │
│  │     ├── StepList · Workspace · AIVisualizer （剪辑模式）                     │  │
│  │     └── CommentaryPanel · ScriptEditor · CommentaryPreview （解说模式）       │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                            │
│  ┌───────────────────────────────────▼──────────────────────────────────────┐    │
│  │                    Services Layer (TypeScript)                             │    │
│  │                                                                              │    │
│  │   AI Provider Service ─────────────► 多提供商统一抽象（OpenAI/DeepSeek/...） │    │
│  │   Clip Pipeline ──────────────────► 7步剪辑管道（已有）                     │    │
│  │   Commentary Pipeline ─────────────► 解说管道（新增）                        │    │
│  │     ├── DirectorAgent.ts      AI 导演状态机                                 │    │
│  │     ├── ScriptGenerator.ts    LLM 解说词生成                               │    │
│  │     └── CommentarySynth.ts   配音合成 + 时间轴对齐                         │    │
│  │   Subtitle Service ────────────► Whisper 字幕（已有）                       │    │
│  │   Export Service ─────────────► 多格式导出（已有）                         │    │
│  │   TauriBridge ────────────────► IPC 封装（已有）                           │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                            │
│  ┌───────────────────────────────────▼──────────────────────────────────────┐    │
│  │                      Tauri Bridge (IPC invoke/emit)                        │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                            │
│  ┌───────────────────────────────────▼──────────────────────────────────────┐    │
│  │                      Rust Backend (Tauri 2.x)                              │    │
│  │                                                                              │    │
│  │   Commands (IPC Handler)                                                    │    │
│  │   ├── ai.rs                    Whisper / 高光检测（已有）                   │    │
│  │   ├── llm.rs                   LLM API 代理（隐藏密钥，新增）                │    │
│  │   ├── project.rs              项目 CRUD（已有）                             │    │
│  │   ├── ffprobe.rs              视频元数据（已有）                            │    │
│  │   ├── file_ops.rs             文件操作（已有）                               │    │
│  │   ├── auto_save.rs            自动保存（已有）                              │    │
│  │   ├── export_state.rs         导出状态（已有）                              │    │
│  │   ├── commentary.rs           解说专用命令（新增）                          │    │
│  │   └── render/                  渲染（已有）                                 │    │
│  │       ├── autonomous_cut.rs   AI 多段切割（复用）                           │    │
│  │       ├── transcode.rs        比例裁剪 + 导出（复用）                      │    │
│  │       ├── preview.rs          预览生成（复用）                              │    │
│  │       └── subtitle_burnin.rs  字幕烧录（复用）                              │    │
│  │                                                                              │    │
│  │   Core Modules                                                              │    │
│  │   ├── smart_segmenter.rs     场景/能量分段（已有，优化）                     │    │
│  │   ├── highlight_detector.rs  高光检测（已有）                               │    │
│  │   ├── subtitle.rs            Whisper 字幕（已有）                           │    │
│  │   ├── video_processor.rs     视频裁剪/混音（已有）                          │    │
│  │   ├── llm_proxy.rs           LLM API 代理（隐藏密钥，新增）                 │    │
│  │   └── types.rs               共享类型定义                                   │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                      External Dependencies                                  │  │
│  │                                                                              │  │
│  │   FFmpeg          视频编解码 / 裁剪 / 混音 / 字幕烧录                        │  │
│  │   faster-whisper  本地 ASR 字幕转录（断网可用）                               │  │
│  │   Edge TTS        配音合成（Windows/macOS 内置）                             │  │
│  │   LLM APIs        OpenAI / DeepSeek / Anthropic / Google / ...             │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 前端架构

### 4.1 React 组件结构

```
src/
├── components/
│   ├── Landing/                    # 落地页
│   │   ├── LandingPage.tsx
│   │   └── FeatureCard.tsx
│   ├── Dashboard/                  # 项目仪表板
│   │   ├── ProjectList.tsx
│   │   └── ProjectCard.tsx
│   ├── Projects/                   # 项目页面
│   │   ├── VideoImport.tsx
│   │   └── ProjectSettings.tsx
│   ├── Workspace/                  # 剪辑工作区
│   │   ├── StepList.tsx           # 步骤列表
│   │   ├── AIVisualizer.tsx       # AI 可视化
│   │   └── ClipTimeline.tsx       # 剪辑时间轴
│   ├── CommentaryPanel/            # 解说模式面板（新增）
│   │   ├── CommentaryPanel.tsx    # 主容器
│   │   ├── ScriptEditor.tsx       # 解说词编辑器
│   │   ├── StyleSelector.tsx      # 风格选择器
│   │   ├── CommentaryPreview.tsx # 解说预览
│   │   └── CommentaryTimeline.tsx# 解说时间轴
│   └── Settings/                  # 设置页面
│       ├── AISettings.tsx         # AI 设置
│       └── ExportSettings.tsx     # 导出设置
├── core/
│   ├── services/                   # 服务层
│   │   ├── ai/
│   │   │   ├── AIProviderService.ts    # AI 提供商抽象
│   │   │   ├── OpenAIProvider.ts       # OpenAI 实现
│   │   │   ├── DeepSeekProvider.ts     # DeepSeek 实现
│   │   │   └── types.ts
│   │   ├── commentary/             # 解说服务（新增）
│   │   │   ├── index.ts
│   │   │   ├── DirectorAgent.ts       # AI 导演状态机
│   │   │   ├── ScriptGenerator.ts     # LLM 解说词生成
│   │   │   ├── CommentarySynth.ts     # 配音合成
│   │   │   └── types.ts
│   │   ├── subtitle/
│   │   │   └── WhisperService.ts
│   │   ├── export/
│   │   │   └── ExportService.ts
│   │   └── TauriBridge.ts
│   └── stores/                     # 状态管理
│       ├── projectStore.ts         # 项目状态
│       ├── commentaryStore.ts      # 解说状态（新增）
│       └── settingsStore.ts         # 设置状态
├── hooks/                          # 自定义 Hooks
│   ├── useTauriCommand.ts
│   └── useAIProvider.ts
├── types/                          # 共享类型
│   ├── project.ts
│   ├── segment.ts
│   └── commentary.ts
└── utils/                          # 工具函数
    ├── time.ts
    └── format.ts
```

### 4.2 状态管理

StoryFab 使用 **Zustand** 进行状态管理，主要状态包括：

#### 4.2.1 项目状态（projectStore）

```typescript
interface ProjectState {
  // 项目信息
  currentProject: ProjectFile | null;
  projects: ProjectFile[];

  // 视频信息
  videoPath: string | null;
  videoMetadata: VideoMetadata | null;

  // 分段结果
  segments: VideoSegment[];
  semanticSegments: SemanticSegment[];

  // 高光（Clip Mode）
  highlights: HighlightSegment[];

  // 解说计划（Commentary Mode）
  commentaryPlan: CommentaryPlan | null;

  // 操作方法
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  setSegments: (segments: VideoSegment[]) => void;
  setCommentaryPlan: (plan: CommentaryPlan) => void;
}
```

#### 4.2.2 解说状态（commentaryStore）

```typescript
interface CommentaryState {
  // 导演状态
  directorPhase: DirectorPhase;
  directorErrors: string[];

  // 解说词
  scripts: CommentaryScript[];
  editingScript: CommentaryScript | null;

  // 配音
  audioFiles: Map<string, string>;  // scriptId -> audioPath
  isSynthesizing: boolean;

  // 操作方法
  setPhase: (phase: DirectorPhase) => void;
  generateScripts: () => Promise<void>;
  synthesizeAudio: (scriptId: string) => Promise<void>;
  revisePlan: (feedback: string) => Promise<void>;
}
```

### 4.3 Services 层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       Services Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AI Provider Service                     │   │
│  │                   （多提供商统一抽象）                      │   │
│  │                                                            │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │   │ OpenAI  │  │DeepSeek │  │Anthropic│  │ Google  │    │   │
│  │   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │   │
│  │        └──────────┬┴──────────┬┴──────────┬┘          │   │
│  │                   ▼           ▼           ▼             │   │
│  │            ┌────────────────────────────────┐           │   │
│  │            │   AIProviderService (抽象接口)  │           │   │
│  │            │   - chat()                     │           │   │
│  │            │   - embed()                    │           │   │
│  │            └────────────────────────────────┘           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Commentary Pipeline                     │   │
│  │                                                            │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │   │DirectorAgent│───►│ScriptGenerator│───►│Commentary  │  │   │
│  │   │（导演状态机）│    │（解说词生成） │    │Synth（合成）│  │   │
│  │   └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  │          ▲                                        │       │   │
│  │          │            （用户介入）                 │       │   │
│  │          └────────────────────────────────────────┘       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   TauriBridge Service                     │   │
│  │                   （IPC 封装层）                          │   │
│  │                                                            │   │
│  │   invoke<T>(cmd, args): Promise<T>                        │   │
│  │   emit(event, payload): void                              │   │
│  │   on(event, handler): UnlistenFn                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Rust 后端架构

### 5.1 Commands 模块结构

Rust 后端通过 Tauri 的 `commands` 目录组织 IPC 处理函数：

```
src-tauri/src/
├── commands/
│   ├── mod.rs                 # 模块导出
│   ├── ai.rs                  # Whisper / 高光检测
│   ├── llm.rs                 # LLM API 代理（新增）
│   ├── project.rs             # 项目 CRUD
│   ├── ffprobe.rs             # 视频元数据
│   ├── file_ops.rs            # 文件操作
│   ├── auto_save.rs           # 自动保存
│   ├── export_state.rs        # 导出状态
│   ├── commentary.rs          # 解说专用命令（新增）
│   └── render/
│       ├── mod.rs
│       ├── autonomous_cut.rs   # AI 多段切割
│       ├── transcode.rs        # 比例裁剪 + 导出
│       ├── preview.rs          # 预览生成
│       └── subtitle_burnin.rs  # 字幕烧录
├── core/
│   ├── mod.rs
│   ├── smart_segmenter.rs     # 场景/能量分段
│   ├── highlight_detector.rs   # 高光检测
│   ├── subtitle.rs            # Whisper 字幕
│   ├── video_processor.rs     # 视频裁剪/混音
│   ├── llm_proxy.rs           # LLM API 代理（新增）
│   └── types.rs                # 共享类型定义
├── lib.rs                      # 库入口
└── main.rs                     # 应用入口
```

### 5.2 Commands 详解

#### 5.2.1 llm.rs（LLM API 代理）

**职责**：
- 隐藏 API 密钥，前端不直接暴露 Key
- 统一路由到不同 LLM 提供商
- 请求限流 + 错误重试

```rust
// llm.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub struct LLMProxy {
    providers: HashMap<String, ProviderConfig>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LLMRequest {
    pub provider: String,      // "openai" | "deepseek" | "anthropic" | "google"
    pub model: String,
    pub messages: Vec<Message>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct LLMResponse {
    pub content: String,
    pub usage: TokenUsage,
    pub model: String,
}

#[derive(Debug, Deserialize)]
pub struct Message {
    pub role: String,         // "system" | "user" | "assistant"
    pub content: String,
}

#[tauri::command]
pub async fn call_llm(request: LLMRequest) -> Result<LLMResponse, String> {
    // 1. 从环境变量读取 API key
    // 2. 根据 provider 路由到对应服务商
    // 3. 发送请求并处理响应
    // 4. 返回结构化结果
}
```

#### 5.2.2 commentary.rs（解说专用命令）

```rust
// commentary.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CommentaryScriptRequest {
    pub video_path: String,
    pub semantic_segments: Vec<SemanticSegment>,
    pub style: CommentaryStyle,
    pub api_provider: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommentaryStyle {
    pub tone: String,           // "humorous" | "serious" | "casual" | "professional"
    pub pacing: String,         // "fast" | "normal" | "slow"
    pub language: String,       // "zh-CN" | "en-US" | ...
}

#[derive(Debug, Serialize)]
pub struct CommentaryPlan {
    pub intro: SegmentSelection,
    pub acts: Vec<Act>,
    pub outro: SegmentSelection,
    pub total_duration_ms: u64,
    pub style: CommentaryStyle,
}

/// 生成解说计划
#[tauri::command]
pub async fn generate_commentary_script(
    request: CommentaryScriptRequest,
) -> Result<CommentaryPlan, String>;

/// TTS 配音生成
#[tauri::command]
pub async fn synthesize_commentary_audio(
    script: String,
    voice_id: String,
    rate: f32,
) -> Result<String, String>;  // 返回音频文件路径

/// 带解说的渲染
#[tauri::command]
pub async fn render_with_commentary(
    input: AutonomousRenderInput,
    commentary_track: CommentaryTrack,
) -> Result<String, String>;
```

### 5.3 Core Modules 详解

#### 5.3.1 smart_segmenter.rs（场景分段）

**已有能力**（继续复用）：
- 音频能量分析（500ms 窗口）
- 场景切换检测（scdet）
- 静默检测
- 播放速度推荐（1x–6x）

```rust
pub struct SmartSegmenter;

impl SmartSegmenter {
    /// 执行粗分
    pub fn segment(&self, video_path: &str) -> Result<Vec<VideoSegment>, Error> {
        // 1. 提取音频能量
        let energy = self.extract_energy(video_path)?;
        // 2. 场景切换检测
        let scene_changes = self.detect_scenes(video_path)?;
        // 3. 静默检测
        let silences = self.detect_silences(video_path)?;
        // 4. 合并分段
        self.merge_segments(energy, scene_changes, silences)
    }
}
```

#### 5.3.2 llm_proxy.rs（LLM 代理核心）

```rust
pub struct LLMProxy {
    http_client: reqwest::Client,
    providers: HashMap<String, ProviderConfig>,
}

impl LLMProxy {
    /// 调用 LLM 提供商
    pub async fn call(&self, request: &LLMRequest) -> Result<LLMResponse, LLMError> {
        match request.provider.as_str() {
            "openai" => self.call_openai(request).await,
            "deepseek" => self.call_deepseek(request).await,
            "anthropic" => self.call_anthropic(request).await,
            "google" => self.call_google(request).await,
            _ => Err(LLMError::UnsupportedProvider(request.provider.clone())),
        }
    }

    async fn call_openai(&self, request: &LLMRequest) -> Result<LLMResponse, LLMError> {
        // 实现 OpenAI API 调用
    }

    async fn call_deepseek(&self, request: &LLMRequest) -> Result<LLMResponse, LLMError> {
        // 实现 DeepSeek API 调用
    }
}
```

### 5.4 Render Engine 扩展

渲染引擎扩展 `autonomous_cut.rs` 以支持 commentary track：

```rust
// autonomous_cut.rs 扩展
struct AutonomousRenderInput {
    // ... 已有字段 ...

    // Commentary 相关字段（新增）
    commentary_track: Option<CommentaryTrack>,
    mix_config: AudioMixConfig,
    burnin_subtitles: bool,
    subtitle_style: SubtitleStyle,
}

struct AudioMixConfig {
    narration_volume: f32,      // 解说音量（通常 1.0）
    original_volume: f32,       // 原声音量（通常 0.2-0.3）
    bgm_volume: f32,           // BGM 音量（可选）
}

impl RenderEngine {
    pub async fn render_with_commentary(
        &self,
        input: AutonomousRenderInput,
    ) -> Result<String, RenderError> {
        // 1. 先用 autonomous_cut 逻辑切割 + 合并视频片段
        let video_path = self.autonomous_cut(&input).await?;

        // 2. 注入 commentary 音轨
        if let Some(ref track) = input.commentary_track {
            let mixed_path = self.mix_audio(&video_path, track, &input.mix_config).await?;
            // 3. 烧录字幕（如果需要）
            if input.burnin_subtitles {
                return self.burnin_subtitles(&mixed_path, &input.subtitle_style).await;
            }
            return Ok(mixed_path);
        }

        Ok(video_path)
    }
}
```

---

## 6. Commentary Pipeline 详解（7步）

Commentary Pipeline 是 Commentary Mode 的核心流程，包含 7 个关键步骤：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Commentary Pipeline（解说管道）                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Step 1              Step 2              Step 3              Step 4              │
│  ┌────────┐         ┌────────┐         ┌────────┐         ┌────────┐              │
│  │ 视频    │────────►│Smart   │────────►│ 语义   │────────►│Director│              │
│  │ 输入    │         │Segment │         │ 分段   │         │ Agent  │              │
│  └────────┘         └────────┘         └────────┘         └────┬───┘              │
│                                                               │                    │
│                                                               ▼                    │
│  Step 7              Step 6              Step 5                                   │
│  ┌────────┐         ┌────────┐         ┌────────┐         ┌────────┐              │
│  │ 成片   │◄────────│字幕   │◄────────│渲染   │◄────────│解说词  │              │
│  │ 输出   │         │烧录   │         │引擎   │         │生成    │              │
│  └────────┘         └────────┘         └────────┘         └────────┘              │
│                                                                     ▲             │
│                                                                     │             │
│                                                             ┌────────┴────────┐    │
│                                                             │    TTS         │    │
│                                                             │   配音合成      │    │
│                                                             └────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Step 1: 视频输入

**输入**：原始视频文件（MP4、MOV、AVI 等）

**处理**：
- FFprobe 提取视频元数据（时长、分辨率、编码、帧率）
- 提取音频轨道用于后续分析

**输出**：`VideoMetadata`

```rust
struct VideoMetadata {
    path: String,
    duration_ms: u64,
    width: u32,
    height: u32,
    fps: f64,
    codec: String,
    audio_codec: String,
    bitrate: u64,
}
```

### 6.2 Step 2: SmartSegmenter（粗分）

**目标**：将视频切分为粗粒度的物理分段

**实现**：`smart_segmenter.rs`（Rust 后端，已有）

**能力**：
- 音频能量分析（500ms 窗口）
- 场景切换检测（scdet）
- 静默检测
- 播放速度推荐（1x–6x）

**输出**：`VideoSegment[]`

```rust
struct VideoSegment {
    id: String,
    start_ms: u64,
    end_ms: u64,
    energy_level: f32,
    scene_change: bool,
    silence: bool,
    recommended_speed: u8,
}
```

### 6.3 Step 3: 语义分段（Semantic Segmentation）

**目标**：在粗分基础上，用 LLM 理解每段的语义（剧情/人物/情绪）

**实现**：TypeScript Service（`DirectorAgent.ts`）

**输入**：
- 粗分 segments
- 视频关键帧（可选）
- 音频特征

**LLM 调用示例**：

```typescript
async function semanticSegment(
  videoPath: string,
  segments: VideoSegment[],
  apiProvider: AIProviderService
): Promise<SemanticSegment[]> {
  const prompt = buildSemanticSegmentationPrompt(segments, videoMetadata);

  const response = await apiProvider.chat({
    model: 'deepseek-v4-pro',
    messages: [{ role: 'user', content: prompt }]
  });

  return parseSemanticSegments(response.content);
}
```

**输出**：`SemanticSegment[]`

```typescript
interface SemanticSegment {
  // 继承自 VideoSegment（粗分）
  start_ms: number;
  end_ms: number;
  segment_type: string; // "dialogue" | "action" | "transition" | "silence" | "content"

  // LLM 新增语义标注
  semantic_label: string;       // "主角对话" | "动作场景" | "过渡转场" | ...
  plot_summary: string;         // 剧情摘要（1-2句话）
  characters: string[];         // 出现的人物
  emotional_tone: "happy" | "sad" | "tense" | "calm" | "comedic" | ...;
  commentary_tone_suggestion: string; // 建议的解说语气
  highlight_potential: number;  // 0.0-1.0，这段作为解说的潜力
}
```

### 6.4 Step 4: Director Agent（导演 Agent）

**设计原则**：多轮状态机，用户可介入

**核心状态机**：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Director Agent 状态机                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│     ┌─────────┐                                                                │
│     │  idle   │ ◄────── 用户发起解说任务                                         │
│     └────┬────┘                                                                │
│          ▼                                                                     │
│     ┌──────────┐     AI 分析视频 + 语义分段                                     │
│     │analyzing │──────────────────────────────────────────────────────────────│
│     └────┬─────┘                                                                │
│          ▼                                                                     │
│     ┌──────────┐     AI 生成解说计划（开场/主体/结尾）                            │
│     │ planning │──────────────────────────────────────────────────────────────│
│     └────┬─────┘                                                                │
│          ▼                                                                     │
│     ┌──────────┐     用户审核（可修改/重写/确认）                                │
│     │  review  │──────────────────────────────────────────────────────────────│
│     └────┬─────┘                                                                │
│          │ 用户通过                                                              │
│          ▼                                                                     │
│     ┌──────────┐     执行渲染 + 配音合成                                         │
│     │executing │──────────────────────────────────────────────────────────────│
│     └────┬─────┘                                                                │
│          ▼                                                                     │
│     ┌──────────┐     输出成片                                                   │
│     │completed │                                                               │
│     └──────────┘                                                               │
│                                                                                  │
│          ▲ 若用户要求修改                                                        │
│          │                                                                      │
│     ┌────┴─────┐     根据反馈重新规划                                            │
│     │ revising │──────────────────────────────────────────────────────────────│
│     └────┬─────┘                                                                │
│          │                                                                      │
│          └──► planning（重新生成）                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Director Phase 详细定义**：

```typescript
type DirectorPhase =
  | 'idle'          // 空闲，等待任务
  | 'analyzing'     // 分析视频内容
  | 'planning'      // 生成解说计划
  | 'review'        // 用户审核计划
  | 'revising'      // 根据用户反馈修改
  | 'executing'     // 执行渲染
  | 'completed';    // 完成

interface DirectorState {
  phase: DirectorPhase;
  videoPath: string;
  semanticSegments: SemanticSegment[];
  commentaryPlan: CommentaryPlan | null;
  userFeedback: string | null;
  errors: string[];
}

interface CommentaryPlan {
  intro: SegmentSelection;      // 开场片段选择 + 解说词
  acts: Act[];                  // 主体段落
  outro: SegmentSelection;      // 结尾片段选择 + 解说词
  totalDuration: number;        // 预计总时长
  style: CommentaryStyle;       // 解说风格
}

interface Act {
  order: number;
  segments: SegmentSelection[];
  commentary: {
    script: string;            // 解说词
    tone: string;              // 语气
    pacing: 'fast' | 'normal' | 'slow';
  };
  transition_to_next: string; // 转场描述
}
```

### 6.5 Step 5: Script Generator（解说词生成）

**目标**：为每个 Act 生成专业解说词

**LLM Prompt 示例**：

```
你是一位专业的影视解说博主，擅长用生动有趣的语言解说短剧。
风格：接地气、口语化、有梗
目标观众：喜欢看短剧的大众用户

视频片段剧情：
[这里根据 semantic segment 的 plot_summary 填充]

解说词要求：
- 开头要有吸引力（抓眼球）
- 中间逻辑清晰，节奏明快
- 结尾要有悬念或情感升华
- 总时长：约 {target_duration} 秒
- 不要太长，控制在核心内容

请生成一段 60-90 秒的解说词：
```

**输入输出**：

```typescript
interface ScriptGenInput {
  segments: SegmentSelection[];    // 选中的视频片段
  emotional_tone: string;          // 情绪基调
  style: CommentaryStyle;          // 解说风格
  target_duration: number;         // 目标解说时长
  characters: string[];            // 人物列表
}

interface ScriptGenOutput {
  script: string;                  // 解说词正文
  reading_time_ms: number;         // 预计朗读时长
  keywords: string[];              // 关键词
  suggested_emphasis: number[];     // 重音位置（时间戳数组）
}
```

### 6.6 Step 6: TTS 配音合成（Commentary Synthesizer）

**核心能力**：
- TTS 配音生成（Edge TTS，内置 Windows/macOS）
- 时间轴对齐（配音与视频片段精确同步）
- 多音轨混音（解说音轨 + 原声 + BGM）

**时间轴模型**：

```typescript
interface CommentaryTrack {
  segments: CommentarySegment[];
  total_duration_ms: number;
  audio_mix: AudioMixConfig;
}

interface CommentarySegment {
  video_segment_id: string;     // 对应的视频片段
  script: string;               // 解说词
  audio_path: string | null;    // TTS 生成后填充
  start_ms: number;             // 在最终成片中的起始时间
  end_ms: number;               // 在最终成片中的结束时间
  voice_config: {
    voice_id: string;           // Edge TTS voice ID
    rate: number;               // 语速倍数
    volume: number;             // 音量 0.0-1.0
  };
}

interface AudioMixConfig {
  narration_volume: number;      // 解说音量（通常 1.0）
  original_volume: number;      // 原声音量（通常 0.2-0.3）
  bgm_volume: number;           // BGM 音量（可选）
}
```

**合成流程**：

```typescript
async function synthesizeCommentary(
  plan: CommentaryPlan,
  ttsService: EdgeTTSService
): Promise<CommentaryTrack> {
  const track: CommentaryTrack = {
    segments: [],
    total_duration_ms: 0,
    audio_mix: { narration_volume: 1.0, original_volume: 0.25, bgm_volume: 0.0 }
  };

  for (const act of plan.acts) {
    for (const seg of act.segments) {
      const audioPath = await ttsService.synthesize({
        text: seg.commentary.script,
        voice: seg.voice_config.voice_id,
        rate: seg.voice_config.rate,
      });

      track.segments.push({
        video_segment_id: seg.id,
        script: seg.commentary.script,
        audio_path: audioPath,
        start_ms: calculateStartTime(seg),
        end_ms: calculateEndTime(audioPath),
        voice_config: seg.voice_config,
      });
    }
  }

  return track;
}
```

### 6.7 Step 7: Render Engine（渲染引擎）

**复用**：`autonomous_cut.rs` 扩展 commentary 音轨支持

**渲染流程**：

```rust
impl RenderEngine {
    pub async fn render_with_commentary(
        &self,
        input: AutonomousRenderInput,
        commentary_track: CommentaryTrack,
    ) -> Result<String, RenderError> {
        // 1. 先用 autonomous_cut 逻辑切割 + 合并视频片段
        let video_path = self.autonomous_cut(&input).await?;

        // 2. 注入 commentary 音轨（混音）
        let mixed_path = self.mix_audio(&video_path, &commentary_track).await?;

        // 3. 烧录字幕（如果需要）
        if input.burnin_subtitles {
            return self.burnin_subtitles(&mixed_path, &input.subtitle_style).await;
        }

        Ok(mixed_path)
    }

    async fn mix_audio(
        &self,
        video_path: &str,
        track: &CommentaryTrack,
        config: &AudioMixConfig,
    ) -> Result<String, RenderError> {
        // 构建 FFmpeg 混音命令
        let narration = track.segments[0].audio_path.clone();
        let output = format!("{}/mixed_{}.mp4", self.output_dir, uuid::Uuid::new_v4());

        let cmd = format!(
            r#"ffmpeg -i "{}" -i "{}" -filter_complex \
            "[1:a]volume={}[narration]; [narration]amix=inputs=1:duration=longest[out]" \
            -map 0:v -map "[out]" -c:v copy -c:a aac "{}""#,
            video_path,
            narration,
            config.narration_volume,
            output
        );

        self.run_ffmpeg(&cmd).await?;
        Ok(output)
    }
}
```

**关键 FFmpeg 命令（filter_complex 混音）**：

```bash
# 解说 + 原声混音
ffmpeg -i video.mp4 -i commentary.wav -i original_audio.wav \
  -filter_complex "[1:a]volume=1.0[narration]; [2:a]volume=0.25[original]; [narration][original]amix=inputs=2:duration=longest[out]" \
  -map 0:v -map "[out]" -c:v copy -c:a aac output.mp4
```

---

## 7. Clip Mode 与 Commentary Mode 的关系

### 7.1 统一入口，分叉执行

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Clip Mode 与 Commentary Mode 关系                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                    StoryFab 工作流入口（StoryFabProvider）                           │
│                                 │                                                │
│                                 ▼                                                │
│                    ┌──────────────────────┐                                      │
│                    │      Step 1-2        │                                      │
│                    │  视频导入 + AI 分析   │                                      │
│                    │     （共用）         │                                      │
│                    └──────────┬───────────┘                                      │
│                               │                                                   │
│                    ┌──────────┴───────────┐                                      │
│                    ▼                      ▼                                       │
│           ┌───────────────┐      ┌─────────────────┐                             │
│           │   Clip Mode   │      │ Commentary Mode │                             │
│           │   （剪辑）     │      │     （解说）     │                             │
│           └───────────────┘      └─────────────────┘                             │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           共用数据模型                                       │  │
│  │                                                                           │  │
│  │   ProjectFile {                                                          │  │
│  │     id, name, mode, video_path,                                          │  │
│  │     segments: VideoSegment[],        // 粗分（共用）                       │  │
│  │     highlights: HighlightSegment[],  // 高光（Clip Mode）                 │  │
│  │     commentary_plan: CommentaryPlan   // 解说计划（Commentary Mode）       │  │
│  │   }                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 模式切换

用户可以在 Step 1-2 之后选择进入任意模式，也可以中途切换：

```
                    视频导入 + AI 分析
                         │
                         ▼
                  ┌─────────────┐
                  │   Step 1-2  │
                  └──────┬──────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
  ┌─────────────┐                 ┌─────────────┐
  │  Clip Mode  │◄───切换───────►│Commentary   │
  │             │                 │   Mode      │
  └─────────────┘                 └─────────────┘
```

### 7.3 数据流向对比

| 阶段 | Clip Mode | Commentary Mode |
|------|-----------|-----------------|
| 视频输入 | ✓ | ✓ |
| SmartSegmenter 粗分 | ✓ | ✓ |
| 语义分段 | ✗ | ✓ |
| AI 高光检测 | ✓ | ✗ |
| 手动剪辑编排 | ✓ | ✗ |
| Director Agent | ✗ | ✓ |
| Script Generation | ✗ | ✓ |
| TTS 配音合成 | ✗ | ✓ |
| 多轨混音渲染 | ✗ | ✓ |
| 导出 | ✓ | ✓ |

---

## 8. 数据模型（ProjectFile 结构）

### 8.1 核心数据模型

```typescript
// types/project.ts

interface ProjectFile {
  // 项目基础信息
  id: string;
  name: string;
  mode: 'clip' | 'commentary';

  // 视频信息
  video_path: string;
  video_metadata: VideoMetadata;

  // 分段结果（共用）
  segments: VideoSegment[];

  // 高光（Clip Mode）
  highlights: HighlightSegment[];

  // 解说计划（Commentary Mode）
  commentary_plan: CommentaryPlan | null;

  // 字幕数据（共用）
  subtitles: Subtitle[];

  // 项目设置
  settings: ProjectSettings;

  // 元数据
  created_at: string;
  updated_at: string;
  version: string;
}

interface VideoMetadata {
  path: string;
  duration_ms: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audio_codec: string;
  bitrate: number;
  file_size: number;
}

interface VideoSegment {
  id: string;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  energy_level: number;
  scene_change: boolean;
  silence: boolean;
  recommended_speed: number;
  thumbnail_path: string | null;
}

interface HighlightSegment {
  id: string;
  segment_id: string;
  score: number;
  highlight_type: 'action' | 'dialogue' | 'emotional' | 'comedic';
  start_ms: number;
  end_ms: number;
}

interface CommentaryPlan {
  id: string;
  style: CommentaryStyle;
  intro: SegmentSelection;
  acts: Act[];
  outro: SegmentSelection;
  total_duration_ms: number;
  status: 'draft' | 'review' | 'approved' | 'rendering' | 'completed';
}

interface CommentaryStyle {
  tone: 'humorous' | 'serious' | 'casual' | 'professional' | 'emotional';
  pacing: 'fast' | 'normal' | 'slow';
  language: string;
}

interface SegmentSelection {
  segment_id: string;
  start_ms: number;
  end_ms: number;
  commentary: {
    script: string;
    tone: string;
    pacing: string;
    audio_path: string | null;
  };
}

interface Act {
  id: string;
  order: number;
  segments: SegmentSelection[];
  commentary: {
    script: string;
    tone: string;
    pacing: 'fast' | 'normal' | 'slow';
  };
  transition_to_next: string;
}

interface Subtitle {
  id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker: string | null;
  confidence: number;
}

interface ProjectSettings {
  export_format: 'mp4' | 'webm' | 'mov';
  export_quality: 'low' | 'medium' | 'high' | 'original';
  export_resolution: '720p' | '1080p' | 'original';
  aspect_ratio: '16:9' | '9:16' | '1:1' | 'original';
  include_subtitles: boolean;
  subtitle_style: SubtitleStyle;
  audio_mix: AudioMixConfig;
}

interface SubtitleStyle {
  font_family: string;
  font_size: number;
  font_color: string;
  background_color: string;
  position: 'bottom' | 'top';
}

interface AudioMixConfig {
  narration_volume: number;
  original_volume: number;
  bgm_volume: number;
}
```

### 8.2 数据流图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           数据流图                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────┐       │
│   │  视频   │─────►│SmartSegment │─────►│ 语义分段     │─────►│Director │       │
│   │  文件   │      │  (粗分)     │      │ (LLM)       │      │ Agent   │       │
│   └─────────┘      └─────────────┘      └──────────────┘      └────┬────┘       │
│                                                                      │            │
│                           ┌──────────────────────────────────────────┘            │
│                           ▼                                                      │
│                    ┌─────────────┐      ┌──────────────┐      ┌─────────┐       │
│                    │ Commentary │─────►│ Script Gen   │─────►│   TTS   │       │
│                    │   Plan     │      │              │      │  合成   │       │
│                    └─────────────┘      └──────────────┘      └────┬────┘       │
│                                                                      │            │
│                           ┌──────────────────────────────────────────┘            │
│                           ▼                                                      │
│                    ┌─────────────┐      ┌──────────────┐      ┌─────────┐       │
│                    │ Render      │─────►│ FFmpeg 混音  │─────►│  输出   │       │
│                    │ Engine      │      │              │      │  成片   │       │
│                    └─────────────┘      └──────────────┘      └─────────┘       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. API 设计

### 9.1 Tauri 命令列表

| 命令 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `call_llm` | `LLMRequest` | `LLMResponse` | 通用 LLM 调用代理 |
| `generate_commentary_script` | `CommentaryScriptRequest` | `CommentaryPlan` | 生成解说计划 |
| `synthesize_commentary_audio` | `{script, voice_id, rate}` | `String` | TTS 配音生成 |
| `render_with_commentary` | `AutonomousRenderInput + CommentaryTrack` | `String` | 带解说的渲染 |
| `segment_video` | `{video_path}` | `VideoSegment[]` | 视频分段 |
| `detect_highlights` | `{video_path, segments}` | `HighlightSegment[]` | 高光检测 |
| `transcribe_subtitles` | `{video_path}` | `Subtitle[]` | Whisper 字幕 |
| `export_video` | `ExportRequest` | `String` | 视频导出 |

### 9.2 LLM Request/Response 结构

```typescript
// LLM 请求
interface LLMRequest {
  provider: 'openai' | 'deepseek' | 'anthropic' | 'google';
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

// LLM 响应
interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  finish_reason: 'stop' | 'length' | 'content_filter';
}
```

---

## 10. 关键设计决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **工作流模式** | 统一入口 + 分叉 | 复用 AI 分析结果，用户可在中途切换 |
| **Director Agent** | 多轮 + 用户介入 | 保证输出质量，支持精细化创作 |
| **LLM 调用** | 前端逻辑 + Rust 代理 | 前端灵活 + 隐藏密钥 |
| **配音合成** | Edge TTS（本地）+ 可扩展 | 断网可用，成本低 |
| **语义分段** | SmartSegmenter + LLM 双层 | 粗分高效 + 细分精准 |
| **渲染引擎** | 复用 autonomous_cut | 代码复用，扩展 commentary track |
| **状态管理** | Zustand（轻量级） | 简单、直观、性能好 |
| **前端框架** | React 18 + TypeScript | 生态成熟、类型安全 |

---

## 11. 未来扩展方向

### 11.1 短期扩展

1. **多语种配音**：预留 `voice_id` 支持多语言
2. **BGM 合成**：接入音乐生成模型（参考 ElevenLabs Music）
3. **Lip-sync**：参考 LipDub 技术，对口型
4. **多角色解说**：不同人物用不同音色

### 11.2 长期愿景

1. **端到端视频生成**：根据解说词直接生成对应视频（AI Video Generation）
2. **多平台适配**：支持 TikTok、YouTube Shorts 等不同平台尺寸
3. **协作功能**：多人协作解说创作
4. **模板市场**：用户可分享/购买解说模板
5. **智能剪辑**：基于解说词自动推荐剪辑节奏

---

## 12. 附录

### 12.1 术语表

| 术语 | 说明 |
|------|------|
| **SmartSegmenter** | 智能分段器，基于能量/场景/静默的视频粗分工具 |
| **Semantic Segmentation** | 语义分段，用 LLM 理解视频内容的每个分段 |
| **Director Agent** | 导演 Agent，模拟人类导演的创作思维 |
| **Script Generator** | 解说词生成器，基于 LLM 生成专业解说文案 |
| **Commentary Synthesizer** | 配音合成器，TTS 技术生成配音 |
| **Edge TTS** | 微软文本转语音服务，Windows/macOS 内置 |
| **autonomous_cut** | 自主切割，AI 自动选择视频片段 |
| **字幕烧录** | 将字幕嵌入视频画面 |
| **amix** | FFmpeg 音频混音滤波器 |

### 12.2 参考资料

- [Tauri 2.x 文档](https://tauri.app/)
- [React 18 文档](https://react.dev/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [FFmpeg 文档](https://ffmpeg.org/documentation.html)
- [faster-whisper 文档](https://github.com/SYSTRAN/faster-whisper)
- [Edge TTS 文档](https://github.com/rany2/edge-tts)
