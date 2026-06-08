---
title: Tauri 命令参考
description: StoryFab Rust → TS 的所有 IPC 命令
---

# Tauri 命令参考

所有 IPC 命令通过 `@tauri-apps/api/core` 的 `invoke` 调用。

## commentary

### start_commentary_analysis

启动解说模式分析。

```rust
async fn start_commentary_analysis(
    video_path: String,
    config: CommentaryConfig,
) -> Result<CommentaryAnalysisHandle>
```

### revise_commentary_plan

根据用户反馈修订解说计划。

```rust
async fn revise_commentary_plan(
    handle: CommentaryAnalysisHandle,
    feedback: String,
) -> Result<DirectorPlan>
```

### complete_commentary_render

完成解说视频渲染。

```rust
async fn complete_commentary_render(
    handle: CommentaryAnalysisHandle,
    options: RenderOptions,
) -> Result<RenderResult>
```

### quick_commentary

快速解说（无 Director 介入）。

```rust
async fn quick_commentary(
    video_path: String,
    voice: VoiceConfig,
) -> Result<RenderResult>
```

## render

### autonomous_cut_video

智能拆条。

```rust
async fn autonomous_cut_video(
    video_path: String,
    options: HighlightOptions,
) -> Result<Vec<HighlightSegment>>
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

## llm

### llm_router

LLM Provider 路由。

```rust
async fn llm_router(
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

### jianying_export

剪映草稿导出。

```rust
async fn jianying_export(
    project: JianyingProject,
    output_path: String,
) -> Result<String>
```

## export

### export_multi_format

多格式导出。

```rust
async fn export_multi_format(
    project_id: String,
    formats: Vec<ExportFormat>,
) -> Result<Vec<ExportResult>>
```

### transcode_with_crop

转码 + 裁剪。

```rust
async fn transcode_with_crop(
    options: TranscodeCropOptions,
) -> Result<String>
```

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
pnpm type-check

# Rust 端单元测试
cargo test --manifest-path src-tauri/Cargo.toml
```