---
title: Tauri 命令参考
description: StoryFab Rust → TS 的所有 IPC 命令
---

# Tauri 命令参考

所有 IPC 命令通过 `@tauri-apps/api/core` 的 `invoke` 调用。

## commentary

### start_director_analysis

启动 Director Agent 分析。

```rust
async fn start_director_analysis(
    video_path: String,
    config: CommentaryConfig,
) -> Result<DirectorSessionHandle>
```

### revise_director_plan

根据用户反馈修订 Director 计划。

```rust
async fn revise_director_plan(
    handle: DirectorSessionHandle,
    feedback: String,
) -> Result<DirectorPlan>
```

### complete_director_render

完成 Director 渲染。

```rust
async fn complete_director_render(
    handle: DirectorSessionHandle,
    options: RenderOptions,
) -> Result<RenderResult>
```

### generate_commentary_script

生成解说脚本。

```rust
async fn generate_commentary_script(
    handle: DirectorSessionHandle,
) -> Result<DraftScript>
```

### synthesize_commentary_audio

合成解说音频。

```rust
async fn synthesize_commentary_audio(
    handle: DirectorSessionHandle,
    voice: VoiceConfig,
) -> Result<AudioHandle>
```

## render

### render_autonomous_cut

智能拆条渲染。

```rust
async fn render_autonomous_cut(
    project_id: String,
    options: HighlightOptions,
) -> Result<Vec<HighlightSegment>>
```

### burn_subtitles

烧录字幕到视频。

```rust
async fn burn_subtitles(
    video_path: String,
    subtitle_path: String,
    output_path: String,
) -> Result<String>
```

### export_video

导出视频。

```rust
async fn export_video(
    project_id: String,
    options: ExportOptions,
) -> Result<ExportResult>
```

### detect_highlights

检测视频高光。

```rust
async fn detect_highlights(
    video_path: String,
    options: HighlightOptions,
) -> Result<Vec<HighlightSegment>>
```

## llm

### call_llm

LLM 统一调用入口。

```rust
async fn call_llm(
    provider: ModelProvider,
    request: LLMRequest,
) -> Result<LLMResponse>
```

## subtitle

### whisper_transcribe

Whisper 离线转写。

```rust
async fn whisper_transcribe(
    audio_path: String,
    model: WhisperModel,
) -> Result<TranscriptionResult>
```

### auto_save_project

自动保存项目。

```rust
async fn auto_save_project(
    project_id: String,
    data: ProjectSnapshot,
) -> Result<String>
```

## project

### analyze_video

分析视频元数据。

```rust
async fn analyze_video(
    video_path: String,
) -> Result<VideoMeta>
```

### extract_key_frames

提取关键帧。

```rust
async fn extract_key_frames(
    video_path: String,
    count: u32,
) -> Result<Vec<KeyFrame>>
```

### generate_thumbnail

生成视频缩略图。

```rust
async fn generate_thumbnail(
    video_path: String,
    time_offset: f64,
) -> Result<Thumbnail>
```

## ai

### synthesize_speech

TTS 语音合成。

```rust
async fn synthesize_speech(
    text: String,
    voice: VoiceConfig,
) -> Result<AudioHandle>
```

### list_available_models

列出可用 LLM 模型。

```rust
async fn list_available_models() -> Result<Vec<AIModel>>
```

> 完整命令清单（当前 61 个）：`rg '#\[tauri::command\]' src-tauri/src/ | wc -l`（实测 61），详见本文件 commentary / render / llm / subtitle / project 5 段。

## TS 调用

```ts
import { invoke } from '@tauri-apps/api/core';
import type { CommentaryAnalysisHandle } from '@/core/interfaces';

const handle = await invoke<CommentaryAnalysisHandle>(
  'start_commentary_analysis',
  { videoPath: '/path/to/video.mp4', config: { voice: 'zh-CN-XiaoxiaoNeural' } }
);
```

## 错误处理

所有命令返回 `Result<T, TauriCommandError>`，错误类型见 `src/core/types/errors.ts`。

## 验证

```bash
# Type-check 命令签名
npm run type-check

# Rust 端单元测试
cargo test --manifest-path src-tauri/Cargo.toml
```