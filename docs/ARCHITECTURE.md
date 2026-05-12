# CutDeck 架构文档

## 1. 系统概览

CutDeck 是一款基于 Tauri 2.x 的桌面视频剪辑应用，采用 **React + TypeScript** 前端 + **Rust** 后端的架构。前端负责 UI 交互与 AI 业务逻辑，Rust 后端处理 CPU 密集型的视频编解码操作（FFmpeg）和本地 AI 推理（Whisper）。

```
┌─────────────────────────────────────────────────────┐
│              WebView (React 18 SPA)                │
│                                                     │
│  React UI → Zustand Stores → Core Services →       │
│                                         TauriBridge │
└──────────────────────┬──────────────────────────────┘
                       │ IPC (invoke/emit)
┌──────────────────────▼──────────────────────────────┐
│              Tauri 2.x Backend (Rust)              │
│                                                     │
│  commands/ → FFmpeg / Whisper / FileSystem          │
│  highlight_detector / smart_segmenter / subtitle   │
└─────────────────────────────────────────────────────┘
```

## 2. 前端架构

### 2.1 核心模块 (`src/core/`)

```
src/core/
├── config/          # AI 模型配置、平台预设常量
├── constants/       # 错误码、视频配置常量
├── export/          # 导出类型定义
├── hooks/           # 通用 React Hooks
├── interfaces/      # 编辑器 / Timeline 接口抽象
├── pipeline/        # Step 模式 AI 剪辑管道
├── services/        # 核心业务服务（最大目录）
├── tauri/           # TauriBridge — Rust IPC 封装
├── types/           # 共享 TS 类型（Jianying / Timeline）
├── utils/           # 模型可用性 / 项目文件 / 路由预加载
└── video/           # 视频处理抽象层
```

### 2.2 服务层详解 (`src/core/services/`)

| 服务 | 文件数 | 职责 |
|------|--------|------|
| **providers** | 14 | AI API 提供商统一抽象（OpenAI/Anthropic/DeepSeek/...） |
| **clip-pipeline** | 12 | AI 剪辑 7 步管道（评分/候选/SEO/导出） |
| **editor** | 17 | 编辑器操作（剪辑/轨道/历史记录/导出） |
| **ai** | 8 | AI 剪辑分析、脚本生成、视觉服务 |
| **export** | 6 | 导出服务（普通导出 + 剪映格式） |
| **subtitle** | 3 | 字幕服务（Jianying 格式适配） |
| **video** | 4 | 视频效果、情感检测 |
| **workflow** | 3 | 工作流进度、旁白生成 |
| **asr** | 2 | ASR 音频同步服务 |

### 2.3 TauriBridge (`src/core/tauri/TauriBridge.ts`)

所有 Rust IPC 调用统一通过 TauriBridge 封装，屏蔽直接使用 `@tauri-apps/api/invoke` 的样板代码。

```typescript
// 示例：调用 Rust 高光检测
import { TauriBridge } from '@/core/tauri/TauriBridge';
const highlights = await TauriBridge.invoke<HighlightSegment[]>('detect_highlights', {
  videoPath: '/path/to/video.mp4',
  threshold: 0.7,
  topN: 10,
});
```

### 2.4 状态管理 (`src/store/`)

| Store | 职责 |
|-------|------|
| `appStore` | 全局应用状态（设置、主题） |
| `projectStore` | 项目列表、项目元数据 |
| `editorStore` | 编辑器状态（当前片段、时间轴） |
| `timelineStore` | 时间轴状态（播放头、轨道、缩放） |
| `mainStore` | 主状态聚合 |

所有 store 使用 Zustand v5，支持持久化（通过 `tauri-plugin-store`）。

## 3. Rust 后端架构

### 3.1 模块概览

```
src-tauri/src/
├── lib.rs                    # 应用入口 + 命令注册
├── main.rs                   # mobile entry point
├── binary.rs                 # FFmpeg/FFprobe 路径解析
├── utils.rs                  # 工具函数（时间格式化、PCM解析等）
├── types.rs                  # 共享类型（AutonomousRenderInput 等）
├── commands/
│   ├── ai.rs                 # AI 高光检测 / TTS / 翻译 / ZCR
│   ├── ffprobe.rs            # 视频元数据分析
│   ├── project.rs            # 项目文件 CRUD
│   └── render.rs             # 渲染 / 导出 / 预览 / 取消
├── highlight_detector.rs      # 音频能量高光检测
├── smart_segmenter.rs        # 智能分段（场景/静默/对话）
├── subtitle.rs               # Faster-Whisper 字幕转录
└── video_processor.rs        # 视频裁剪（cut_video）
```

### 3.2 命令层 (`commands/`)

#### `ai.rs` — AI 驱动命令

| 命令 | 签名 | 说明 |
|------|------|------|
| `detect_highlights` | `DetectHighlightsInput → Vec<HighlightSegment>` | 音频能量 + 场景切换联合检测 |
| `detect_zcr_bursts` | `video_path → Vec<ZcrBurst>` | 过零率突变检测 |
| `detect_smart_segments` | `DetectSmartSegmentsInput → Vec<VideoSegment>` | 场景/静默/对话联合分段 |
| `run_ai_director_plan` | `DirectorPlanInput → DirectorPlanOutput>` | AI 导演计划（节奏/转场/置信度） |
| `synthesize_speech` | `TtsInput → String` | TTS 语音合成 |
| `translate_text` | `text + lang → String` | 文本翻译 |
| `check_tts_available` / `list_tts_backends` | — | TTS 可用性检查 |

#### `render.rs` — 渲染导出命令

| 命令 | 签名 | 说明 |
|------|------|------|
| `render_autonomous_cut` | `AutonomousRenderInput → String` | AI 自动剪辑渲染（异步） |
| `transcode_with_crop` | `TranscodeCropInput → String` | 指定宽高比转码裁剪 |
| `generate_preview` | `video_path + time → String` | 指定时间点预览图 |
| `cancel_export` | `export_id → ()` | 取消正在进行的导出 |
| `clean_temp_file` / `open_file` | — | 临时文件清理 / 系统打开 |
| `voice_discovery` | `video_path → Vec<VoiceSegment>` | 音频人声发现 |

### 3.3 核心算法模块

#### `highlight_detector.rs` — 高光检测

使用 **Short-Time Energy (STE)** 算法，无需外部 AI 服务：

1. FFmpeg 提取 PCM 音频 → `pcm_samples_from_wav()`
2. 滑动窗口计算每帧短时能量
3. 能量超过阈值 + 峰值 → 标记为高光
4. 可选联合 **scdet** 场景切换检测
5. 返回 `HighlightSegment { start_ms, end_ms, score, reason }`

#### `smart_segmenter.rs` — 智能分段

基于 FFmpeg 内置分析器实现：

- **scdet** 场景切换检测 → `Transition` 片段
- ** silencedetect** 静默检测 → `Silence` 片段
- **EBU R128** 响度分析 → 辅助判断对话/动作

#### `subtitle.rs` — Whisper 字幕

调用本地 `faster-whisper`（Python subprocess 或 Rust 绑定）：

```
transcribe_audio(video_path, model_name, language)
  → Vec<SubtitleSegment { start, end, text }>
  → SRT 格式输出
```

#### `video_processor.rs` — 视频裁剪

`cut_video` 命令支持两种模式：

1. **多段拼接导出**：将多个不连续时间区间合并为单个输出文件（用于 AI 剪辑结果导出）
2. **单段裁剪**：指定 `start`/`end` 裁剪单个片段

### 3.4 FFmpeg 路径解析 (`binary.rs`)

```
resolve_binary_path("ffmpeg")
  → CUTDECK_FFMPEG_PATH env 优先
  → 与 ffmpeg 同目录的 ffprobe
  → /opt/homebrew/bin, /usr/local/bin, /usr/bin, /bin
```

可通过环境变量配置自定义路径。

## 4. AI 剪辑管道 (`src/core/services/clip-pipeline/`)

```
Step 1: BuildCandidatesStep   — 根据高光区间构建候选片段
Step 2: ScoreClipsStep        — 6 维 AI 评分（笑声/情感/完整度/静默比/节奏/关键词）
Step 3: GenerateSEOStep      — 多平台 SEO 元数据生成
Step 4: PrepareExportStep      — 导出就绪（格式/分辨率/码率）
         ↓
最终输出：剪辑片段 + SEO 元数据 + 导出配置
```

Checkpoint 支持断点续跑，避免 AI 调用重复消耗。

## 5. 数据流

### 5.1 视频导入 → AI 分析

```
用户导入视频
  → TauriBridge.invoke('analyze_video')     [Rust: ffprobe]
  → TauriBridge.invoke('transcribe_audio')  [Rust: Whisper]
  → TauriBridge.invoke('detect_highlights')  [Rust: highlight_detector]
  → AI 剪辑管道 (TypeScript)
  → 用户预览 / 编辑
  → TauriBridge.invoke('render_autonomous_cut')  [Rust: FFmpeg]
```

### 5.2 项目持久化

```
项目文件 → JSON (.cutdeck project)
  → TauriBridge.invoke('save_project_file')   [Rust: fs]
  → TauriBridge.invoke('load_project_file')   [Rust: fs]
```

存储在 `app_data_dir()` 目录下（Windows: %APPDATA%, macOS: ~/Library/Application Support, Linux: ~/.local/share）。

## 6. 关键技术决策

### 为什么用 Tauri 而非 Electron？

| 维度 | Tauri | Electron |
|------|-------|----------|
| 产物大小 | ~10 MB | ~150 MB |
| 内存占用 | 低 | 高 |
| Rust 后端 | 原生 | Node.js |
| 视频处理 | 高性能 Rust | 需要 exec FFmpeg |
| 安全 | 默认沙盒 | 完整 Node.js |

### 为什么高光检测不用 AI 模型？

本地 **STE（短时能量）算法** 足够识别绝大多数高光场景（笑声峰值、掌声、语调突变），且：
- 零依赖（无需 API Key）
- 毫秒级响应
- 在树莓派等低配设备也能流畅运行

AI 模型用于 **评分** 和 **语义理解** 环节，而非信号检测。

### 命名规范

- Rust 文件：`snake_case.rs`（`highlight_detector.rs`）
- Rust 模块：`snake_case`（`pub mod highlight_detector`）
- TypeScript 文件/变量：`camelCase`
- React 组件文件：`PascalCase.tsx`
- 常量/枚举：`SCREAMING_SNAKE_CASE`
