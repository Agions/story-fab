---
title: Tauri 命令参考
description: StoryFab 所有 Tauri IPC 命令的完整参考文档
---

# Tauri 命令参考

本文档描述 StoryFab 后端（Rust）暴露给前端（TypeScript）的所有 Tauri IPC 命令。前端通过 `TauriBridge.ts` 调用这些命令。

## 命令概述

所有命令按功能分为以下模块：

| 模块 | 文件路径 | 功能 |
|------|----------|------|
| AI 命令 | `commands/ai.rs` | Whisper 字幕、智能高光检测、智能分段 |
| 解说命令 | `commands/commentary.rs` | 导演 Agent、脚本生成、TTS 配音合成 |
| 渲染命令 | `commands/render/` | 自主切割、转码、预览、字幕烧录 |
| 项目命令 | `commands/project.rs` | 项目文件 CRUD |
| 文件操作 | `commands/file_ops.rs` | 临时文件清理、系统文件打开 |
| FFprobe 命令 | `commands/ffprobe.rs` | 视频元数据探测 |
| 音频命令 | `commands/video_processor.rs` | 混音、音量调节 |
| LLM 代理 | `commands/llm.rs` | 统一 LLM API 调用 |

---

## AI 命令 (`commands/ai.rs`)

负责视频内容理解：语音转字幕、高光检测、智能分段。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `transcribe_video` | `TranscribeInput` | `SubtitleTrack` | 运行 Whisper 模型转录音频为字幕 |
| `detect_highlights` | `DetectHighlightsInput` | `Vec<HighlightSegment>` | 根据能量/运动量评分视频片段 |
| `detect_smart_segments` | `DetectSmartSegmentsInput` | `Vec<VideoSegment>` | 基于视觉+音频特征找自然断点 |
| `run_ai_director_plan` | `DirectorPlanInput` | `DirectorPlanOutput` | 全流程 AI 导演流水线 |
| `voice_discovery` | — | `Vec<String>` | 列出所有可用 Edge TTS 音色 |

### `transcribe_video` — Whisper 字幕生成

**输入**

```rust
struct TranscribeInput {
    pub video_path: String,           // 视频文件路径
    pub language: Option<String>,     // 目标语言（如 "zh"、"en"），None 则自动检测
    pub model: Option<String>,        // Whisper 模型大小（"tiny", "base", "small", "medium", "large"）
    pub task: String,                 // "transcribe" | "translate"
}
```

**输出**

```rust
struct SubtitleTrack {
    pub segments: Vec<SubtitleSegment>,
    pub language: String,
    pub duration_ms: u64,
}

struct SubtitleSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
    pub confidence: f32,
}
```

---

### `detect_highlights` — 高光检测

**输入**

```rust
struct DetectHighlightsInput {
    pub video_path: String,
    pub threshold: Option<f32>,       // 高光阈值（默认 0.6）
    pub min_duration_ms: Option<u64>, // 最小高光时长（默认 3000ms）
    pub max_segments: Option<usize>, // 最大高光数量（默认 10）
}
```

**输出**

```rust
struct HighlightSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub score: f32,                  // 0.0-1.0，高光置信度
    pub peak_energy: f64,
    pub segment_type: String,        // "action" | "dialogue" | "climax"
}
```

---

### `detect_smart_segments` — 智能分段

返回增强版 `VideoSegment`，包含速度建议和转场建议。

**输入**

```rust
struct DetectSmartSegmentsInput {
    pub video_path: String,
    pub min_segment_ms: Option<u64>,  // 最小片段时长（默认 1000ms）
    pub max_segments: Option<usize>,  // 最大片段数（默认 50）
    pub include_silence: Option<bool>, // 是否包含静音段（默认 true）
}
```

**输出**

```rust
struct VideoSegment {
    pub start_time: f64,              // 秒
    pub end_time: f64,                // 秒
    pub segment_type: SegmentType,    // normal | silence | transition | action | dialogue
    pub confidence: f64,              // 0.0-1.0，分段置信度
    pub avg_energy: f64,             // 平均能量
    pub peak_energy: f64,            // 峰值能量
    pub silence_ratio: f64,          // 静音占比 0.0-1.0
    pub suggested_speed: Option<f64>, // 建议播放速度 1.0-6.0
    pub suggested_transition: Option<String>, // dissolve | fade | wipe | slide | glitch
}

enum SegmentType {
    Normal,
    Silence,
    Transition,
    Action,
    Dialogue,
}
```

**速度推导规则**（基于 `avg_energy / mean_energy` 比值）：

| 能 量 比 值 | 建议速度 | 适用场景 |
|-------------|----------|----------|
| < 0.5 | 6x | 空白/过渡 |
| 0.5 – 0.85 | 4x | 低能量 |
| 0.85 – 1.1 | 2x | 正常 |
| > 1.1 | 1x | 高光 |

**转场建议规则**（基于 `segment_type`）：

| 分段类型 | 建议转场 |
|----------|----------|
| scene_change | dissolve / glitch |
| action | wipe / slide |
| dialogue | fade / dissolve |
| silence | fade |

---

### `run_ai_director_plan` — AI 导演流水线

整合转录 + 高光检测 + 智能分段的全流程命令。

**输入**

```rust
struct DirectorPlanInput {
    pub video_path: String,
    pub target_duration_ms: Option<u64>,  // 目标时长（可选）
    pub style: Option<String>,            // 视频风格（可选）
    pub max_segments: Option<usize>,
}
```

**输出**

```rust
struct DirectorPlanOutput {
    pub segments: Vec<VideoSegment>,
    pub highlights: Vec<HighlightSegment>,
    pub subtitles: SubtitleTrack,
    pub total_duration_ms: u64,
    pub suggested_edit_style: String,
}
```

---

### `voice_discovery` — 可用音色列表

**输出**: `Vec<String>` — 所有可用 Edge TTS voice ID，如 `"zh-CN-XiaoxiaoNeural"`

---

## 解说命令 (`commands/commentary.rs`)

负责解说脚本生成和 TTS 配音合成。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `call_llm` | `LLMRequest` | `LLMResponse` | 通用 LLM 调用（隐藏 API Key） |
| `generate_commentary_script` | `CommentaryScriptRequest` | `CommentaryPlan` | 生成解说计划（调用 Director Agent） |
| `synthesize_commentary_audio` | `SynthesizeAudioInput` | `SynthesizeAudioOutput` | TTS 配音生成 |
| `render_with_commentary` | `CommentaryRenderInput` | `String` | 带解说的渲染 |

---

### `call_llm` — LLM API 代理

隐藏 API 密钥，统一路由到不同 LLM 提供商。

**输入**

```rust
struct LLMRequest {
    pub provider: String,           // "openai" | "deepseek" | "anthropic" | "google" | "qwen" | "kimi"
    pub model: String,             // 模型名称
    pub messages: Vec<Message>,    // 消息列表
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

struct Message {
    pub role: String,              // "system" | "user" | "assistant"
    pub content: String,
}
```

**输出**

```rust
struct LLMResponse {
    pub content: String,
    pub model: String,
    pub usage: TokenUsage,
    pub finish_reason: String,
}

struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}
```

**前端调用示例**：

```typescript
const response = await Tauri.invoke<LLMResponse>('call_llm', {
  provider: 'deepseek',
  model: 'deepseek-v4-pro',
  messages: [{ role: 'user', content: '...' }],
  temperature: 0.7,
});
```

---

### `generate_commentary_script` — 解说计划生成

被前端 Director Agent 调用，根据语义分段生成完整解说计划。

**输入**

```rust
struct CommentaryScriptRequest {
    pub video_path: String,
    pub video_duration_ms: u64,
    pub semantic_segments: Vec<SemanticSegment>, // LLM 语义标注后的 segments
    pub style: CommentaryStyle,
    pub target_duration_ms: Option<u64>,
    pub api_provider: String,
}

struct SemanticSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub segment_type: String,      // "dialogue" | "action" | "transition" | "silence" | "content"
    pub plot_summary: String,     // 剧情摘要
    pub characters: Vec<String>,  // 出现的人物
    pub emotional_tone: String,   // 情绪基调
    pub commentary_tone: String,  // 建议解说语气
    pub highlight_potential: f32, // 0.0-1.0 高光潜力
}

struct CommentaryStyle {
    pub id: String,
    pub name: String,
    pub default_tone: String,
    pub default_pacing: String,   // "fast" | "normal" | "slow"
    pub description: Option<String>,
}
```

**输出**

```rust
struct CommentaryPlan {
    pub version: u32,
    pub title: String,
    pub style: CommentaryStyle,
    pub intro: PlanSection,       // 开场白
    pub acts: Vec<Act>,           // 幕（分段叙事单元）
    pub outro: PlanSection,       // 收尾
    pub total_duration_ms: u64,
    pub metadata: PlanMetadata,
}

struct PlanSection {
    pub segment_ids: Vec<String>,
    pub commentary: String,      // 解说词
    pub tone: String,            // 语气
    pub duration_ms: u64,
}

struct Act {
    pub order: u32,
    pub title: String,
    pub segment_ids: Vec<String>,
    pub commentary: ActCommentary,
    pub transition: TransitionConfig,
}

struct ActCommentary {
    pub script: String,
    pub tone: String,
    pub pacing: String,
    pub emphasis_keywords: Vec<String>, // 强调关键词
}

struct TransitionConfig {
    pub type: String,     // "cut" | "dissolve" | "fade"
    pub description: String,
}

struct PlanMetadata {
    pub target_audience: String,
    pub platform: String,
    pub keywords: Vec<String>,
}
```

---

### `synthesize_commentary_audio` — TTS 配音合成

**输入**

```rust
struct SynthesizeAudioInput {
    pub text: String,              // 解说词文本
    pub voice_id: String,          // Edge TTS voice ID（如 "zh-CN-XiaoxiaoNeural"）
    pub rate: f32,                 // 语速倍率（1.0 = 正常）
    pub pitch: f32,                // 音调偏移（0 = 正常）
    pub volume: f32,               // 音量（1.0 = 正常）
    pub output_path: Option<String>, // 指定输出路径（可选）
}
```

**输出**

```rust
struct SynthesizeAudioOutput {
    pub audio_path: String,         // 生成音频文件路径
    pub duration_ms: u64,           // 音频时长
    pub voice_id: String,
}
```

---

### `render_with_commentary` — 带解说的渲染

扩展自 `autonomous_cut`，新增 commentary 音轨注入和混音。

**输入**

```rust
struct CommentaryRenderInput {
    // 视频源
    pub input_path: String,
    pub segments: Vec<RenderSegment>,    // 视频片段
    pub start_time: Option<f64>,
    pub end_time: Option<f64>,

    // 解说音轨 🆕
    pub commentary_track: CommentaryTrack,

    // 混音配置 🆕
    pub mix_config: AudioMixConfig,

    // 输出配置
    pub output_path: String,
    pub aspect_ratio: String,           // "9:16" | "16:9" | "1:1"
    pub quality: String,                 // "low" | "medium" | "high"
    pub burnin_subtitles: bool,
    pub subtitle_style: Option<SubtitleStyle>,
}

struct CommentaryTrack {
    pub segments: Vec<CommentarySegment>,
    pub total_duration_ms: u64,
}

struct CommentarySegment {
    pub source_section: String,    // "intro" | "act_0" | "outro" | ...
    pub script: String,            // 解说词
    pub audio_path: String,       // TTS 生成的音频文件路径
    pub duration_ms: u64,
    pub voice_config: VoiceConfig,
}

struct VoiceConfig {
    pub voice_id: String,
    pub rate: f32,
    pub pitch: f32,
    pub volume: f32,
}

struct AudioMixConfig {
    pub narration_volume: f32,    // 解说音量（默认 1.0）
    pub original_volume: f32,     // 原声音量（默认 0.25）
    pub bgm_volume: f32,          // BGM 音量（默认 0.0）
}

struct RenderSegment {
    pub id: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub speed: Option<f32>,       // 播放速度 1.0-6.0
    pub transition: Option<String>, // 转场类型
}
```

**输出**: `String` — 渲染完成的视频文件路径

---

## 渲染命令 (`commands/render/`)

负责视频切割、转码和导出。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `transcode_with_crop` | `TranscodeCropInput` | `String` | 裁剪并转码到目标宽高比 |
| `export_video` | `ExportVideoInput` | `ExportVideoResult` | 完整导出（可选烧录字幕） |
| `generate_preview` | `PreviewInput` | `String` | 生成低分辨率预览 |
| `render_autonomous_cut` | `AutonomousRenderInput` | `String` | 多片段 AI 自主切割 |
| `cut_video` | `CutVideoInput` | `String` | 在指定时间点切割视频 |

---

### `transcode_with_crop` — 裁剪转码

**输入**

```rust
struct TranscodeCropInput {
    pub input_path: String,
    pub output_path: String,
    pub aspect_ratio: String,      // "9:16" | "16:9" | "1:1" | "4:3"
    pub quality: String,          // "low" | "medium" | "high"
    pub crop_mode: String,        // "center" | "smart" | "face"
}
```

**输出**: `String` — 输出文件路径

---

### `export_video` — 完整导出

**输入**

```rust
struct ExportVideoInput {
    pub input_path: String,
    pub segments: Vec<RenderSegment>,
    pub output_path: String,
    pub aspect_ratio: String,
    pub quality: String,
    pub burnin_subtitles: bool,
    pub subtitle_style: Option<SubtitleStyle>,
    pub include_audio: bool,
}
```

**输出**

```rust
struct ExportVideoResult {
    pub output_path: String,
    pub duration_ms: u64,
    pub file_size_bytes: u64,
    pub has_subtitles: bool,
}
```

---

### `generate_preview` — 预览生成

**输入**

```rust
struct PreviewInput {
    pub input_path: String,
    pub output_path: String,
    pub resolution: String,       // "426x240" | "640x360"
    pub start_time: Option<f64>,
    pub duration: Option<f64>,
}
```

**输出**: `String` — 预览文件路径

---

### `render_autonomous_cut` — AI 自主切割

**输入**

```rust
struct AutonomousRenderInput {
    pub video_path: String,
    pub segments: Vec<VideoSegment>,  // 来自 detect_smart_segments
    pub output_dir: String,
    pub aspect_ratio: String,
    pub quality: String,
}
```

**输出**: `String` — 输出目录路径

---

### `cut_video` — 视频切割

**输入**

```rust
struct CutVideoInput {
    pub input_path: String,
    pub output_path: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub speed: Option<f32>,
}
```

**输出**: `String` — 输出文件路径

---

## 项目命令 (`commands/project.rs`)

负责项目文件的持久化存储。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `save_project_file` | `SaveProjectInput` | `String` | 保存项目为 JSON |
| `load_project_file` | `{ path: string }` | `ProjectFile` | 从 JSON 加载项目 |
| `list_project_files` | — | `Vec<ProjectMeta>` | 列出所有项目 |
| `delete_project_file` | `{ path: string }` | `bool` | 删除项目 |
| `get_export_dir` | — | `String` | 获取导出目录路径 |

---

### `save_project_file` — 保存项目

**输入**

```rust
struct SaveProjectInput {
    pub name: String,
    pub project: ProjectFile,
    pub path: Option<String>, // 指定路径，None 则使用默认目录
}
```

**输出**: `String` — 保存的文件路径

---

### `load_project_file` — 加载项目

**输入**: `{ path: string }`

**输出**

```rust
struct ProjectFile {
    pub version: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub source_video: String,
    pub segments: Vec<ProjectSegment>,
    pub commentary_plan: Option<CommentaryPlan>,
    pub settings: ProjectSettings,
}

struct ProjectSegment {
    pub id: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub speed: Option<f32>,
    pub transition: Option<String>,
}

struct ProjectSettings {
    pub aspect_ratio: String,
    pub quality: String,
    pub subtitle_style: Option<SubtitleStyle>,
}
```

---

### `list_project_files` — 项目列表

**输出**: `Vec<ProjectMeta>`

```rust
struct ProjectMeta {
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub updated_at: String,
    pub source_video: String,
    pub duration_ms: u64,
}
```

---

## 文件操作 (`commands/file_ops.rs`)

辅助性文件管理命令。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `clean_temp_file` | `{ path: string }` | `bool` | 删除临时文件 |
| `open_file` | `{ path: string }` | `bool` | 用系统默认应用打开文件 |
| `read_text_file` | `{ path: string }` | `String` | 读取文本文件内容 |
| `get_file_size` | `{ path: string }` | `u64` | 获取文件大小（字节） |

---

## FFprobe 命令 (`commands/ffprobe.rs`)

视频元数据探测。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `analyze_video` | `{ path: string }` | `VideoMetadataResult` | 获取时长、编码器、分辨率等 |
| `check_ffmpeg` | — | `FFmpegCheckResult` | 检查 FFmpeg 可用性和版本 |

---

### `analyze_video` — 视频分析

**输入**: `{ path: string }`

**输出**

```rust
struct VideoMetadataResult {
    pub duration_ms: u64,
    pub width: u32,
    pub height: u32,
    pub codec: String,
    pub fps: f64,
    pub bitrate: u64,
    pub has_audio: bool,
    pub audio_codec: Option<String>,
    pub audio_sample_rate: Option<u32>,
}
```

---

### `check_ffmpeg` — FFmpeg 检测

**输出**

```rust
struct FFmpegCheckResult {
    pub available: bool,
    pub version: Option<String>,
    pub codecs: Vec<String>,
}
```

---

## 音频命令 (`commands/video_processor.rs`)

音频处理相关。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `mix_audio` | `MixAudioInput` | `String` | 混音：TTS 配音 + 原音频 |
| `get_audio_duration` | `{ path: string }` | `f64` | 获取音频文件时长（秒） |

---

### `mix_audio` — 混音

**输入**

```rust
struct MixAudioInput {
    pub narration_path: String,   // TTS 配音文件
    pub original_path: String,    // 原视频/音频
    pub output_path: String,
    pub narration_volume: f32,    // 配音音量
    pub original_volume: f32,     // 原音音量
}
```

**输出**: `String` — 混音后音频文件路径

---

## LLM 代理 (`commands/llm.rs`)

统一 LLM API 调用入口（实际上调用路径与 `call_llm` 一致）。

| 命令 | 输入类型 | 输出类型 | 说明 |
|------|----------|----------|------|
| `call_llm` | `LLMRequest` | `LLMResponse` | 见上方解说命令章节 |

---

## TypeScript 类型绑定

所有命令类型在 `src/core/tauri/TauriBridge.ts` 中定义：

```typescript
export enum TauriCommand {
  // AI Commands
  TRANSCRIBE_VIDEO = 'transcribe_video',
  DETECT_HIGHLIGHTS = 'detect_highlights',
  DETECT_SMART_SEGMENTS = 'detect_smart_segments',
  RUN_AI_DIRECTOR_PLAN = 'run_ai_director_plan',
  VOICE_DISCOVERY = 'voice_discovery',

  // Commentary Commands
  CALL_LLM = 'call_llm',
  GENERATE_COMMENTARY_SCRIPT = 'generate_commentary_script',
  SYNTHESIZE_COMMENTARY_AUDIO = 'synthesize_commentary_audio',
  RENDER_WITH_COMMENTARY = 'render_with_commentary',

  // Render Commands
  TRANSCODE_WITH_CROP = 'transcode_with_crop',
  EXPORT_VIDEO = 'export_video',
  GENERATE_PREVIEW = 'generate_preview',
  RENDER_AUTONOMOUS_CUT = 'render_autonomous_cut',
  CUT_VIDEO = 'cut_video',

  // Project Commands
  SAVE_PROJECT_FILE = 'save_project_file',
  LOAD_PROJECT_FILE = 'load_project_file',
  LIST_PROJECT_FILES = 'list_project_files',
  DELETE_PROJECT_FILE = 'delete_project_file',
  GET_EXPORT_DIR = 'get_export_dir',

  // File Operations
  CLEAN_TEMP_FILE = 'clean_temp_file',
  OPEN_FILE = 'open_file',
  READ_TEXT_FILE = 'read_text_file',
  GET_FILE_SIZE = 'get_file_size',

  // FFprobe Commands
  ANALYZE_VIDEO = 'analyze_video',
  CHECK_FFMPEG = 'check_ffmpeg',

  // Audio Commands
  MIX_AUDIO = 'mix_audio',
  GET_AUDIO_DURATION = 'get_audio_duration',
}
```

---

## 添加新命令

### Rust 端

1. 在 `src-tauri/src/commands/<module>.rs` 中添加函数，使用 `#[tauri::command]` 属性
2. 在 `src-tauri/src/commands/<module>/mod.rs` 中导出
3. 在 `src-tauri/src/lib.rs` 中重新导出

### TypeScript 端

4. 在 `TauriCommand` 枚举中添加命令名
5. 在 `TauriBridge` 类中添加类型化包装方法

### 示例：添加 `synthesize_commentary_audio`

**Rust** (`src-tauri/src/commands/commentary.rs`)：

```rust
#[tauri::command]
pub async fn synthesize_commentary_audio(
    input: SynthesizeAudioInput,
) -> Result<SynthesizeAudioOutput, String> {
    let audio_path = edge_tts_synthesize(&input.text, &input.voice_id, input.rate).await?;
    let duration_ms = get_audio_duration_ms(&audio_path)?;

    Ok(SynthesizeAudioOutput {
        audio_path,
        duration_ms,
        voice_id: input.voice_id,
    })
}
```

**TypeScript** (`TauriBridge.ts`)：

```typescript
// TauriCommand 枚举中
SYNTHESIZE_COMMENTARY_AUDIO = 'synthesize_commentary_audio',

// TauriBridge 方法
async synthesizeCommentaryAudio(input: SynthesizeAudioInput): Promise<SynthesizeAudioOutput> {
  return this.invoke<SynthesizeAudioOutput>('synthesize_commentary_audio', { input });
}
```

---

## 命令目录索引

| 命令名 | 所在模块 |
|--------|----------|
| `transcribe_video` | AI Commands |
| `detect_highlights` | AI Commands |
| `detect_smart_segments` | AI Commands |
| `run_ai_director_plan` | AI Commands |
| `voice_discovery` | AI Commands |
| `call_llm` | Commentary / LLM |
| `generate_commentary_script` | Commentary |
| `synthesize_commentary_audio` | Commentary |
| `render_with_commentary` | Commentary |
| `transcode_with_crop` | Render |
| `export_video` | Render |
| `generate_preview` | Render |
| `render_autonomous_cut` | Render |
| `cut_video` | Render |
| `save_project_file` | Project |
| `load_project_file` | Project |
| `list_project_files` | Project |
| `delete_project_file` | Project |
| `get_export_dir` | Project |
| `clean_temp_file` | File Ops |
| `open_file` | File Ops |
| `read_text_file` | File Ops |
| `get_file_size` | File Ops |
| `analyze_video` | FFprobe |
| `check_ffmpeg` | FFprobe |
| `mix_audio` | Audio |
| `get_audio_duration` | Audio |