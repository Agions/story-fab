---
title: API 参考
description: CutDeck 完整的 API 参考文档
---

# API 参考

本文档涵盖 CutDeck 的完整 API 接口，包括 TypeScript 服务层和 Rust Tauri 命令层。

---

## 1. TypeScript 服务 API

### 1.1 aiService.ts

**文件路径**: `src/core/services/ai.service.ts`

导出单例 `aiService`（`AIService` 类实例）和类型导出。

#### 类: `AIService`

```typescript
import { aiService } from '@/core/services/ai.service';
```

##### 方法

###### `generateText(model, prompt, settings): Promise<string>`

生成自由文本。

| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | `AIModel` | AI 模型配置 |
| `prompt` | `string` | 用户提示词 |
| `settings` | `AIModelSettings` | 模型设置（temperature, maxTokens, apiKey） |

**返回**: `Promise<string>` — 生成的文本内容

---

###### `generateScript(model, settings, params): Promise<ScriptData>`

生成视频脚本。

```typescript
interface ScriptGenerationParams {
  topic: string;           // 主题
  style: string;           // 风格
  tone: string;            // 语气
  length: string;          // 长度 short/medium/long
  audience: string;        // 目标受众
  language: string;        // 语言
  keywords?: string[];     // 关键词
  requirements?: string;   // 特殊需求
  videoDuration?: number;  // 视频时长
}
```

**返回**: `Promise<ScriptData>`

```typescript
interface ScriptData {
  id: string;
  title: string;
  content: string;
  segments: ScriptSegment[];
  metadata: {
    style: 'short' | 'medium' | 'long';
    tone: string;
    length: string;
    targetAudience: string;
    language: string;
    wordCount: number;
    estimatedDuration: number;
    generatedBy: string;
    generatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

###### `analyzeVideo(model, settings, videoInfo): Promise<Partial<VideoAnalysis>>`

分析视频内容。

| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | `AIModel` | AI 模型 |
| `settings` | `AIModelSettings` | 模型设置 |
| `videoInfo` | `{ duration, width, height, format, id?, path? }` | 视频信息 |

**返回**: `Promise<VideoAnalysis>` — 包含 summary、scenes、keyframes

---

###### `optimizeScript(model, settings, script, optimization): Promise<string>`

优化脚本。

| 参数 | 类型 | 说明 |
|------|------|------|
| `optimization` | `'shorten' \| 'lengthen' \| 'simplify' \| 'professional'` | 优化方向 |

---

###### `translateScript(model, settings, script, targetLanguage): Promise<string>`

翻译脚本到目标语言。

---

##### 模型查询方法

###### `getRecommendedModels(task): AIModel[]`

获取任务推荐的模型列表。

###### `getModelInfo(modelId): AIModel | null`

获取指定模型信息。

###### `getAllModels(): AIModel[]`

获取所有可用模型。

###### `getDomesticModels(): AIModel[]`

获取国产模型（阿里、月之暗面、智谱、DeepSeek、科大讯飞）。

---

##### 请求取消

###### `cancelRequest(requestId): void`

取消正在进行的请求。

---

#### 导出的类型

```typescript
export type { AIResponse, RequestConfig } from './providers';
```

---

### 1.2 visionService.ts

**文件路径**: `src/core/services/vision.service.ts`

导出单例 `visionService`（`VisionService` 类实例）。

#### 类: `VisionService`

```typescript
import { visionService } from '@/core/services/vision.service';
```

##### 方法

###### `analyzeVideo(videoInfo, options?): Promise<{ scenes, objects, emotions }>`

视频分析入口，整合场景检测、对象识别、情感分析。

| 参数 | 类型 | 说明 |
|------|------|------|
| `videoInfo` | `VideoInfo` | 视频信息 |
| `options.minSceneDuration` | `number` | 最小场景时长（默认 3秒） |
| `options.threshold` | `number` | 检测阈值（默认 0.3） |
| `options.detectObjects` | `boolean` | 是否检测物体（默认 true） |
| `options.detectEmotions` | `boolean` | 是否分析情感（默认 true） |

**返回**:
```typescript
{
  scenes: Scene[];
  objects: ObjectDetection[];
  emotions: EmotionAnalysis[];
}
```

---

###### `detectScenesAdvanced(videoInfo, options?): Promise<{ scenes, objects, emotions }>`

高级场景检测，使用多维度分析提高准确性。

---

###### `extractKeyframes(videoInfo, options?): Promise<Array<{ id, timestamp, thumbnail, description }>>`

提取关键帧。

| 参数 | 类型 | 说明 |
|------|------|------|
| `options.maxFrames` | `number` | 最大帧数（默认 20） |

---

###### `detectHighlights(videoInfo, options?): Promise<HighlightSegment[]>`

Rust 高光检测（调用 `highlight_detector.rs`）。

| 参数 | 类型 | 说明 |
|------|------|------|
| `videoInfo.path` | `string` | 视频路径 |
| `options.threshold` | `number` | 阈值 |
| `options.minDurationMs` | `number` | 最小持续时间（毫秒） |
| `options.topN` | `number` | 返回前 N 个高光 |
| `options.windowMs` | `number` | 检测窗口大小 |

**返回**:
```typescript
interface HighlightSegment {
  startTime: number;    // 秒
  endTime: number;     // 秒
  score: number;       // 0-1
  reason: HighlightReason;
  audioScore?: number;
  sceneScore?: number;
  motionScore?: number;
}
```

---

#### 内部类型（私有）

- `SceneType` — 预定义场景类型（intro/product/demo/interview/landscape/action/emotion/text）
- `SceneFeatureSet` — 场景特征集（brightness/motion/complexity/dominantColors/hasText/hasFaces/tags）
- `EMOTION_DIMENSIONS` — 情感维度（positive/negative/neutral/excited/calm）
- `OBJECT_CATEGORIES` — 物体检测类别

---

### 1.3 subtitleService.ts

**文件路径**: `src/core/services/subtitle.service.ts`

#### 类: `SubtitleService`

```typescript
import { subtitleService } from '@/core/services/subtitle.service';
```

##### 导出的子服务

**`whisperService`** — Whisper 字幕服务（Rust faster-whisper 后端）

```typescript
import { whisperService } from '@/core/services/subtitle.service';
```

###### Whisper 方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `checkFasterWhisper()` | — | `Promise<boolean>` | 检查 faster-whisper 是否安装 |
| `listModels()` | — | `Promise<WhisperModelInfo[]>` | 获取可用模型列表 |
| `downloadModel(modelSize)` | `string` | `Promise<void>` | 下载指定模型 |
| `getSupportedLanguages()` | — | `Promise<Array<{code, name}>>` | 获取支持的语言 |
| `transcribe(audioPath, modelSize?, language?, onProgress?)` | 见下方 | `Promise<WhisperResult>` | 转录音频/视频 |

**`transcribe` 参数**:
- `audioPath: string` — 音频或视频路径
- `modelSize: string` — 模型大小（tiny/base/small/medium/large-v2/large-v3），默认 'base'
- `language: string` — 语言代码，'auto' 为自动检测
- `onProgress?: (progress: WhisperProgress) => void` — 进度回调

**返回**:
```typescript
interface WhisperResult {
  language: string;
  language_probability: number;
  duration_ms: number;
  segments: WhisperSegment[];
}

interface WhisperSegment {
  start_ms: number;
  end_ms: number;
  text: string;
}
```

###### `toSubtitleTrack(result): SubtitleTrack`

将 Whisper 结果转换为 SubtitleTrack 格式。

---

##### SubtitleService 方法

###### `transcribeWithWhisper(audioPath, modelSize?, language?, onProgress?): Promise<SubtitleTrack>`

使用 Whisper AI 转录字幕。自动检测 faster-whisper 是否可用，不可用时 fallback 到 ASR。

---

###### `extractSubtitles(videoPath, options?): Promise<SubtitleTrack>`

从视频中提取字幕（OCR + ASR）。

| 参数 | 类型 | 说明 |
|------|------|------|
| `options.language` | `string` | 语言代码（默认 'zh-CN'） |
| `options.maxDuration` | `number` | 最大时长限制 |

---

###### `generateSubtitleFile(track, format): Promise<string>`

生成字幕文件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `track` | `SubtitleTrack` | 字幕轨道 |
| `format` | `'srt' \| 'vtt' \| 'ass'` | 输出格式 |

---

###### `translateSubtitles(track, options): Promise<SubtitleTrack>`

翻译字幕轨道。

```typescript
interface SubtitleTranslateOptions {
  targetLanguage: string;
  apiKey?: string;
  provider?: 'google' | 'deepl' | 'youdao';
}
```

---

###### `burnSubtitles(videoPath, subtitlePath, outputPath, style?): Promise<string>`

烧录字幕到视频。

---

#### 类型定义

```typescript
interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: 'top' | 'bottom' | 'center';
  alignment: 'left' | 'center' | 'right';
  opacity: number;
}

interface SubtitleTrack {
  id: string;
  language: string;
  entries: SubtitleEntry[];
  style?: SubtitleStyle;
}

interface WhisperProgress {
  stage: string;
  progress: number;
  current_segment?: number;
  total_segments?: number;
}

interface WhisperModelInfo {
  name: string;
  size: string;
  is_downloaded: boolean;
  path?: string;
}
```

---

## 2. Rust Tauri 命令 API

所有命令通过 `invoke` 调用，返回 `Result<T, String>`。

### 2.1 commands/ffprobe.rs

#### `check_ffmpeg(): Result<FFmpegCheckResult, String>`

检查 FFmpeg 是否安装。

**返回**:
```rust
struct FFmpegCheckResult {
    installed: bool,
    version: Option<String>,  // 如 "ffmpeg version 6.0"
}
```

---

#### `analyze_video(path: String): Result<VideoMetadataResult, String>`

获取视频元数据（异步 ffprobe）。

**参数**: `path` — 视频文件路径

**返回**:
```rust
struct VideoMetadataResult {
    duration: f64,    // 时长（秒）
    width: u32,       // 宽度
    height: u32,      // 高度
    fps: f64,         // 帧率
    codec: String,    // 编码器，如 "h264"
    bitrate: u64,     // 码率
}
```

---

### 2.2 commands/project.rs

#### `check_app_data_directory(app): Result<String, String>`

获取 AppData 目录路径，确保 CutDeck 目录存在。

**返回**: `String` — AppData/CutDeck 目录的绝对路径

---

#### `save_project_file(app, project_id, content): Result<(), String>`

保存项目文件到 AppData。

| 参数 | 类型 | 说明 |
|------|------|------|
| `project_id` | `String` | 项目 ID（不含扩展名） |
| `content` | `String` | JSON 内容 |

---

#### `load_project_file(app, project_id): Result<String, String>`

加载项目文件。

**参数**: `project_id` — 项目 ID

**返回**: 项目 JSON 内容字符串

---

#### `delete_project_file(app, project_id): Result<(), String>`

删除项目文件（.json）。

---

#### `list_project_files(app): Result<Vec<serde_json::Value>, String>`

列出所有项目文件。

**返回**: JSON 对象数组（每个包含 `id` 字段）

---

#### `list_app_data_files(app, directory): Result<Vec<String>, String>`

列出指定目录下的文件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `directory` | `String` | 相对于 AppData 的目录名 |

**返回**: 文件名数组

---

#### `delete_file(path: String): Result<(), String>`

删除文件（带安全检查，禁止删除系统目录）。

---

#### `read_text_file(path: String): Result<String, String>`

读取文本文件（仅允许 /tmp/cutdeck、/tmp/CutDeck、.cutdeck 目录）。

---

#### `get_file_size(path: String): Result<u64, String>`

获取文件大小（字节）。

---

### 2.3 commands/ai.rs

#### `generate_thumbnail(path: String): Result<String, String>`

生成视频缩略图。

**参数**: `path` — 视频路径

**返回**: 缩略图文件路径（临时目录，JPG 格式）

---

#### `extract_key_frames(path: String, count?: u32): Result<Vec<String>, String>`

提取关键帧。

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `String` | 视频路径 |
| `count` | `Option<u32>` | 帧数量（1-60，默认 10） |

**返回**: 关键帧文件路径数组（JPG 格式）

---

#### `run_ai_director_plan(input: DirectorPlanInput): DirectorPlanOutput`

AI 导演方案生成。

**输入**:
```rust
struct DirectorPlanInput {
    mode: String,                    // "ai-mixclip" | "ai-first-person" | ...
    target_duration: f64,            // 目标时长（秒）
    auto_original_overlay: bool,     // 是否自动原画叠加
    scenes: Vec<DirectorSceneInput>,
    segments: Vec<DirectorSegmentInput>,
}

struct DirectorSceneInput {
    id: String,
    start_time: f64,
    end_time: f64,
    r#type: Option<String>,
}

struct DirectorSegmentInput {
    id: String,
    content: String,
}
```

**返回**:
```rust
struct DirectorPlanOutput {
    pacing_factor: f64,              // 节拍因子（0.85-1.2）
    beat_count: u32,                 // 节拍数量
    preferred_transition: String,    // "cut" | "dissolve" | "fade"
    confidence: f64,                // 置信度（0.45-0.92）
}
```

---

#### `get_export_dir(): String`

获取导出目录（下载目录下的 CutDeck 文件夹，不存在则创建）。

**返回**: 导出目录路径

---

#### `detect_zcr_bursts(input: DetectZCRBurstsInput): Result<Vec<ZCRBurstResult>, String>`

检测音频零交叉率峰值（用于高光检测）。

**输入**:
```rust
struct DetectZCRBurstsInput {
    audio_path: String,
    window_ms: Option<f32>,         // 窗口大小（默认 50ms）
    zcr_threshold_mult: Option<f32>, // ZCR 阈值倍数（默认 2.5）
}
```

**返回**:
```rust
struct ZCRBurstResult {
    start_ms: u64,
    end_ms: u64,
    score: f32,                     // 峰值/阈值比率，>1 为 burst
}
```

---

#### `detect_highlights(input: DetectHighlightsInput): Result<Vec<HighlightSegment>, String>`

高光时刻检测（FFmpeg scdet + 音频短时能量分析）。

**输入**:
```rust
struct DetectHighlightsInput {
    video_path: String,
    threshold: Option<f64>,
    min_duration_ms: Option<u64>,
    top_n: Option<usize>,
    window_ms: Option<u64>,
    detect_scene: Option<bool>,
    scene_threshold: Option<f64>,
}
```

**返回**: `Vec<HighlightSegment>`

```rust
struct HighlightSegment {
    start_ms: u64,
    end_ms: u64,
    score: f32,
    reason: String,
    audio_score: Option<f32>,
    scene_score: Option<f32>,
    motion_score: Option<f32>,
}
```

---

#### `detect_smart_segments(input: DetectSmartSegmentsInput): Result<Vec<VideoSegment>, String>`

智能场景分段。

**输入**:
```rust
struct DetectSmartSegmentsInput {
    video_path: String,
    min_duration_ms: Option<u64>,
    max_duration_ms: Option<u64>,
    scene_threshold: Option<f32>,
    silence_threshold_db: Option<f32>,
    detect_dialogue: Option<bool>,
    detect_transitions: Option<bool>,
}
```

**返回**: `Vec<VideoSegment>`

```rust
struct VideoSegment {
    start_ms: u64,
    end_ms: u64,
    scene_type: Option<String>,
    confidence: f32,
}
```

---

### 2.4 commands/render.rs

#### `transcode_with_crop(input: TranscodeCropInput): Result<String, String>`

多格式裁切转码（9:16 / 1:1 / 16:9）。

**输入**:
```rust
struct TranscodeCropInput {
    input_path: String,
    output_path: String,
    aspect: String,              // "9:16" | "1:1" | "16:9"
    start_time: Option<f64>,
    end_time: Option<f64>,
    quality: Option<String>,     // "low" | "medium" | "high"
}
```

**质量级别**:
- `low`: CRF 28, preset veryfast
- `medium`: CRF 23, preset fast
- `high`（默认）: CRF 20, preset medium

**返回**: 输出文件路径

---

#### `render_autonomous_cut(input: AutonomousRenderInput): Result<String, String>`

自动出片（多段合并 + 转场 + 后期处理）。

**输入**:
```rust
struct AutonomousRenderInput {
    input_path: String,
    output_path: String,
    start_time: Option<f64>,
    end_time: Option<f64>,
    transition: Option<String>,              // "cut" | "dissolve" | "fade"
    transition_duration: Option<f64>,        // 转场时长（0-1.5秒，默认 0.35）
    burn_subtitles: Option<bool>,
    subtitles: Option<Vec<AutonomousSubtitle>>,
    apply_overlay_markers: Option<bool>,
    overlay_mix_mode: Option<String>,        // "pip" | "full"
    overlay_opacity: Option<f64>,           // 0.05-1.0，默认 0.72
    overlay_markers: Option<Vec<AutonomousOverlayMarker>>,
    segments: Option<Vec<AutonomousRenderSegment>>,  // 要合并的片段
}

struct AutonomousRenderSegment {
    start: f64,
    end: f64,
}

struct AutonomousSubtitle {
    start: f64,
    end: f64,
    text: String,
}

struct AutonomousOverlayMarker {
    start: f64,
    end: f64,
    label: String,
}
```

**返回**: 输出文件路径

---

## 3. Tauri IPC 接口类型

### 3.1 TauriBridge 快捷调用

**文件**: `src/core/tauri/TauriBridge.ts`

```typescript
import { tauri } from '@/core/tauri/TauriBridge';
```

#### 快捷方法

| 方法 | 参数 | 返回 | 对应 Rust 命令 |
|------|------|------|----------------|
| `tauri.getVideoInfo(path)` | `path: string` | `VideoMetadataResult` | `analyze_video` |
| `tauri.detectHighlights(videoPath, options?)` | 见下方 | `HighlightSegment[]` | `detect_highlights` |
| `tauri.extractSubtitle(videoPath, lang?)` | `lang?: string` | `SubtitleResult` | `subtitle_extract` |
| `tauri.burnSubtitle(videoPath, subtitlePath, outputPath)` | — | `string` | `subtitle_burn_in` |
| `tauri.smartSegment(videoPath, options?)` | — | `VideoSegment[]` | `detect_smart_segments` |
| `tauri.applyEffect(videoPath, effectType, params)` | — | `string` | `video_apply_effect` |
| `tauri.getExportDir()` | — | `string` | `get_export_dir` |
| `tauri.getThumbnail(videoPath, timestamp)` | `timestamp: number` | `string` | `video_get_thumbnail` |

#### `detectHighlights` options 参数

```typescript
interface DetectHighlightsOptions {
  threshold?: number;      // 阈值
  minDurationMs?: number; // 最小持续时间
  topN?: number;          // 返回前 N 个
  windowMs?: number;      // 窗口大小
}
```

### 3.2 Whisper/Tauri 集成调用

**文件**: `src/core/services/subtitle.service.ts`

通过 `whisperService` 调用底层 Tauri 命令：

| Tauri 命令 | 参数 | 返回 |
|------------|------|------|
| `check_faster_whisper` | — | `boolean` |
| `list_whisper_models` | — | `WhisperModelInfo[]` |
| `download_whisper_model` | `modelSize: string` | `string` |
| `get_whisper_supported_languages` | — | `Array<{code, name}>` |
| `transcribe_audio` | `audioPath, modelSize?, language?` | `WhisperResult` |

事件监听：
- `whisper-progress` — 转录进度（`WhisperProgress` 类型）

### 3.3 通用 IPC 类型映射

| Rust 类型 | TypeScript 类型 |
|-----------|-----------------|
| `FFmpegCheckResult` | `{ installed: boolean; version: string \| null }` |
| `VideoMetadataResult` | `{ duration: number; width: number; height: number; fps: number; codec: string; bitrate: number }` |
| `DirectorPlanOutput` | `{ pacingFactor: number; beatCount: number; preferredTransition: string; confidence: number }` |
| `TranscodeCropInput` | `{ inputPath: string; outputPath: string; aspect: string; startTime?: number; endTime?: number; quality?: string }` |
| `AutonomousRenderInput` | 见上方 render_autonomous_cut |
| `DetectHighlightsInput` | `{ videoPath: string; threshold?: number; minDurationMs?: number; topN?: number; windowMs?: number; detectScene?: boolean; sceneThreshold?: number }` |
| `HighlightSegment` | `{ start_ms: number; end_ms: number; score: number; reason: string; audio_score?: number; scene_score?: number; motion_score?: number }` |
| `WhisperResult` | `{ language: string; language_probability: number; duration_ms: number; segments: WhisperSegment[] }` |
| `WhisperSegment` | `{ start_ms: number; end_ms: number; text: string }` |

---

## 错误处理

所有 Tauri IPC 调用可能抛出 `TauriBridgeError`：

```typescript
class TauriBridgeError extends Error {
  command: TauriCommand;
  cause?: unknown;
  retryable: boolean;  // 是否可重试（timeout/busy/temporary 错误）
}
```

可通过检查 `error.message` 或 `error.retryable` 属性进行错误处理。

---

## 命令注册

所有命令在 `src-tauri/src/lib.rs` 的 `invoke_handler` 中注册：

```rust
tauri::generate_handler![
    // AI Director
    run_ai_director_plan,
    // Project
    check_app_data_directory,
    save_project_file,
    load_project_file,
    delete_project_file,
    list_project_files,
    list_app_data_files,
    delete_file,
    read_text_file,
    get_file_size,
    // Render
    render_autonomous_cut,
    transcode_with_crop,
    // FFprobe
    check_ffmpeg,
    analyze_video,
    generate_thumbnail,
    extract_key_frames,
    // Video effects
    build_filtergraph,
    build_filter_chain,
    apply_filter,
    apply_filter_chain,
    generate_filter_preview,
    generate_chain_preview,
    // Whisper
    subtitle::transcribe_audio,
    subtitle::check_faster_whisper,
    subtitle::list_whisper_models,
    subtitle::download_whisper_model,
    subtitle::get_whisper_supported_languages,
    // Highlight
    detect_highlights,
    detect_zcr_bursts,
    detect_smart_segments,
]
```