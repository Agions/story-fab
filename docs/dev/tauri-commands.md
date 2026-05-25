# Tauri Commands

All Rust commands are exposed to the frontend via Tauri's IPC. The frontend calls them through `TauriBridge.ts`.

## Command Reference

### AI Commands (`commands/ai.rs`)

| Command | Input | Output | Description |
|---|---|---|---|
| `transcribe_video` | `TranscribeInput` | `SubtitleTrack` | Run Whisper on video |
| `detect_highlights` | `DetectHighlightsInput` | `Vec<HighlightSegment>` | Score segments |
| `detect_smart_segments` | `DetectSmartSegmentsInput` | `Vec<Segment>` | Find natural breakpoints |
| `run_ai_director_plan` | `DirectorPlanInput` | `DirectorPlanOutput` | Full AI pipeline |
| `voice_discovery` | — | `Vec<String>` | List available Edge TTS voices |

### Commentary Commands (`commands/commentary.rs`) 🆕

| Command | Input | Output | Description |
|---|---|---|---|
| `call_llm` | `LLMRequest` | `LLMResponse` | 通用 LLM 调用代理（隐藏 API Key） |
| `generate_commentary_script` | `CommentaryScriptRequest` | `CommentaryPlan` | 生成解说计划（Director Agent 调用） |
| `synthesize_commentary_audio` | `SynthesizeAudioInput` | `String` | TTS 配音生成，返回音频文件路径 |
| `render_with_commentary` | `CommentaryRenderInput` | `String` | 带解说的渲染（扩展 autonomous_cut） |

### Render Commands (`commands/render/`)

| Command | Input | Output | Description |
|---|---|---|---|
| `transcode_with_crop` | `TranscodeCropInput` | `String` | Crop & transcode to aspect ratio |
| `export_video` | `ExportVideoInput` | `ExportVideoResult` | Full export with optional subtitles |
| `generate_preview` | `PreviewInput` | `String` | Low-res preview generation |
| `render_autonomous_cut` | `AutonomousRenderInput` | `String` | Multi-segment AI cut |
| `cut_video` | `CutVideoInput` | `String` | Cut at specified segments |

### Project Commands (`commands/project.rs`)

| Command | Input | Output | Description |
|---|---|---|---|
| `save_project_file` | `SaveProjectInput` | `String` | Save project to JSON |
| `load_project_file` | `{ path: string }` | `ProjectFile` | Load project from JSON |
| `list_project_files` | — | `Vec<ProjectMeta>` | List all projects |
| `delete_project_file` | `{ path: string }` | `bool` | Delete a project |
| `get_export_dir` | — | `String` | Get output directory |

### File Operations (`commands/file_ops.rs`)

| Command | Input | Output | Description |
|---|---|---|---|
| `clean_temp_file` | `{ path: string }` | `bool` | Delete temp file |
| `open_file` | `{ path: string }` | `bool` | Open in system app |
| `read_text_file` | `{ path: string }` | `String` | Read text file |
| `get_file_size` | `{ path: string }` | `u64` | Get file size in bytes |

### FFprobe Commands (`commands/ffprobe.rs`)

| Command | Input | Output | Description |
|---|---|---|---|
| `analyze_video` | `{ path: string }` | `VideoMetadataResult` | Get video duration, codec, resolution |
| `check_ffmpeg` | — | `FFmpegCheckResult` | Check FFmpeg availability and version |

### Audio Commands (`commands/video_processor.rs`)

| Command | Input | Output | Description |
|---|---|---|---|
| `mix_audio` | `MixAudioInput` | `String` | Mix TTS voice-over with original audio track |
| `get_audio_duration` | `{ path: string }` | `f64` | Get audio file duration in seconds |

---

## Commentary Commands 详解

### `call_llm` — LLM API 代理

隐藏 API 密钥，统一路由到不同 LLM 提供商。

```rust
// Input
struct LLMRequest {
    pub provider: String,       // "openai" | "deepseek" | "anthropic" | "google" | "qwen" | "kimi"
    pub model: String,          // 模型名称
    pub messages: Vec<Message>, // 消息列表
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

struct Message {
    pub role: String,           // "system" | "user" | "assistant"
    pub content: String,
}

// Output
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

**前端调用**：
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

被 Director Agent（TypeScript）调用，生成完整的解说计划。

```rust
// Input
struct CommentaryScriptRequest {
    pub video_path: String,
    pub video_duration_ms: u64,
    pub semantic_segments: Vec<SemanticSegment>,  // LLM 语义标注后的 segments
    pub style: CommentaryStyle,
    pub target_duration_ms: Option<u64>,
    pub api_provider: String,
}

struct SemanticSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub segment_type: String,           // "dialogue" | "action" | "transition" | "silence" | "content"
    pub plot_summary: String,            // 剧情摘要
    pub characters: Vec<String>,         // 出现的人物
    pub emotional_tone: String,         // 情绪基调
    pub commentary_tone: String,         // 建议解说语气
    pub highlight_potential: f32,       // 0.0-1.0
}

struct CommentaryStyle {
    pub id: String,
    pub name: String,
    pub default_tone: String,
    pub default_pacing: String,         // "fast" | "normal" | "slow"
    pub description: Option<String>,
}

// Output
struct CommentaryPlan {
    pub version: u32,
    pub title: String,
    pub style: CommentaryStyle,
    pub intro: PlanSection,
    pub acts: Vec<Act>,
    pub outro: PlanSection,
    pub total_duration_ms: u64,
    pub metadata: PlanMetadata,
}

struct PlanSection {
    pub segment_ids: Vec<String>,
    pub commentary: String,
    pub tone: String,
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
    pub emphasis_keywords: Vec<String>,
}

struct TransitionConfig {
    pub type: String,         // "cut" | "dissolve" | "fade"
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

```rust
// Input
struct SynthesizeAudioInput {
    pub text: String,              // 解说词
    pub voice_id: String,         // Edge TTS voice ID (e.g., "zh-CN-XiaoxiaoNeural")
    pub rate: f32,                // 语速倍率（1.0 = 正常）
    pub pitch: f32,               // 音调偏移（0 = 正常）
    pub volume: f32,              // 音量（1.0 = 正常）
    pub output_path: Option<String>, // 指定输出路径（可选）
}

// Output
struct SynthesizeAudioOutput {
    pub audio_path: String,       // 生成音频文件路径
    pub duration_ms: u64,         // 音频时长
    pub voice_id: String,
}
```

---

### `render_with_commentary` — 带解说的渲染

扩展自 `autonomous_cut`，新增 commentary 音轨注入。

```rust
// Input
struct CommentaryRenderInput {
    // 视频源
    pub input_path: String,
    pub segments: Vec<RenderSegment>,    // 视频片段
    pub start_time: Option<f64>,
    pub end_time: Option<f64>,

    // Commentary 音频 🆕
    pub commentary_track: CommentaryTrack,

    // 混音配置 🆕
    pub mix_config: AudioMixConfig,

    // 输出
    pub output_path: String,
    pub aspect_ratio: String,           // "9:16" | "16:9" | "1:1"
    pub quality: String,                // "low" | "medium" | "high"
    pub burnin_subtitles: bool,
    pub subtitle_style: Option<SubtitleStyle>,
}

struct CommentaryTrack {
    pub segments: Vec<CommentarySegment>,
    pub total_duration_ms: u64,
}

struct CommentarySegment {
    pub source_section: String,        // "intro" | "act_0" | "outro" | ...
    pub script: String,
    pub audio_path: String,            // TTS 生成的音频文件
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
    pub narration_volume: f32,         // 解说音量（默认 1.0）
    pub original_volume: f32,          // 原声音量（默认 0.25）
    pub bgm_volume: f32,              // BGM 音量（默认 0.0）
}

struct RenderSegment {
    pub id: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub speed: Option<f32>,           // 播放速度（1.0-6.0）
    pub transition: Option<String>,    // 转场类型
}
```

---

## Rust-side Highlight Detection

`detect_smart_segments` returns `Vec<VideoSegment>` with these enhanced fields:

```rust
struct VideoSegment {
    start_time: f64,
    end_time: f64,
    segment_type: SegmentType,       // normal | silence | transition | action | dialogue
    confidence: f64,
    avg_energy: f64,
    peak_energy: f64,
    silence_ratio: f64,
    suggested_speed: Option<f64>,     // 1.0–6.0x, derived from energy ratio
    suggested_transition: Option<String>, // dissolve | fade | wipe | slide | glitch
}
```

**Speed derivation** (`avg_energy / mean_energy` ratio):
- < 0.5 → 6x (空白/过渡)
- 0.5–0.85 → 4x (低能量)
- 0.85–1.1 → 2x (正常)
- > 1.1 → 1x (高光)

**Transition suggestions**: Based on `segment_type` — scene_change→dissolve/glitch, action→wipe/slide, dialogue→fade/dissolve, silence→fade.

---

## TypeScript Bindings

All command types are defined in `src/core/tauri/TauriBridge.ts`:

```typescript
export enum TauriCommand {
  // AI Commands
  TRANSCRIBE_VIDEO = 'transcribe_video',
  DETECT_HIGHLIGHTS = 'detect_highlights',
  DETECT_SMART_SEGMENTS = 'detect_smart_segments',
  RUN_AI_DIRECTOR_PLAN = 'run_ai_director_plan',
  VOICE_DISCOVERY = 'voice_discovery',

  // Commentary Commands 🆕
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

  // ... project, file_ops, ffprobe, audio commands
}
```

---

## Adding a New Command

### Rust side

1. Add the function in `src-tauri/src/commands/<module>.rs` with `#[tauri::command]`
2. Export it from `src-tauri/src/commands/<module>/mod.rs`
3. Re-export in `src-tauri/src/lib.rs`

### TypeScript side

4. Add it to `TauriCommand` enum in `src/core/tauri/TauriBridge.ts`
5. Add a typed wrapper method in `TauriBridge`

### Example: Adding `synthesize_commentary_audio`

**Rust** (`src-tauri/src/commands/commentary.rs`):
```rust
#[tauri::command]
pub async fn synthesize_commentary_audio(
    input: SynthesizeAudioInput,
) -> Result<SynthesizeAudioOutput, String> {
    // 调用 Edge TTS
    let audio_path = edge_tts_synthesize(&input.text, &input.voice_id, input.rate).await?;
    let duration_ms = get_audio_duration_ms(&audio_path)?;

    Ok(SynthesizeAudioOutput {
        audio_path,
        duration_ms,
        voice_id: input.voice_id,
    })
}
```

**TypeScript** (`TauriBridge.ts`):
```typescript
// In TauriCommand enum
SYNTHESIZE_COMMENTARY_AUDIO = 'synthesize_commentary_audio',

// As method
async synthesizeCommentaryAudio(input: SynthesizeAudioInput): Promise<SynthesizeAudioOutput> {
  return this.invoke<SynthesizeAudioOutput>('synthesize_commentary_audio', { input });
}
```