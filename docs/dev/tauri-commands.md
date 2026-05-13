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

## TypeScript Bindings

All command types are defined in `src/core/tauri/TauriBridge.ts`:

```typescript
export enum TauriCommand {
  TRANSCRIBE_VIDEO = 'transcribe_video',
  DETECT_HIGHLIGHTS = 'detect_highlights',
  DETECT_SMART_SEGMENTS = 'detect_smart_segments',
  RUN_AI_DIRECTOR_PLAN = 'run_ai_director_plan',
  TRANSCODE_WITH_CROP = 'transcode_with_crop',
  EXPORT_VIDEO = 'export_video',
  // ...
}
```

## Adding a New Command

1. Add the function in `src-tauri/src/commands/<module>.rs` with `#[tauri::command]`
2. Export it from `src-tauri/src/commands/<module>/mod.rs`
3. Re-export in `src-tauri/src/lib.rs`
4. Add it to `TauriCommand` enum in `src/core/tauri/TauriBridge.ts`
5. Add a typed wrapper method in `TauriBridge`
