# Backend Architecture

## Directory Structure

```
src-tauri/
├── src/
│   ├── lib.rs              # App entry, plugin registration, command registration
│   ├── main.rs             # Binary entry (calls lib::run())
│   ├── commands/           # Tauri command handlers
│   │   ├── ai.rs           # AI operations (transcribe, highlight, script)
│   │   ├── project.rs       # Project file CRUD
│   │   ├── render/         # Video rendering sub-modules
│   │   │   ├── transcode.rs      # Aspect-ratio crop + full export
│   │   │   ├── autonomous_cut.rs # AI multi-segment cutting
│   │   │   └── preview.rs        # Preview generation
│   │   ├── file_ops.rs    # File system operations
│   │   └── ffprobe.rs      # Video analysis via ffprobe
│   ├── video_processor.rs  # Core video processing (cut, concat, etc.)
│   ├── subtitle.rs         # Subtitle parsing and Whisper integration
│   ├── highlight_detector.rs # Highlight scoring algorithms
│   ├── smart_segmenter.rs  # Smart segmentation logic
│   ├── binary.rs           # FFmpeg/ffprobe path resolution
│   ├── types.rs            # Shared Rust structs (IPC input/output)
│   └── utils.rs            # Logging, timestamps, error helpers
└── Cargo.toml
```

## Command Modules

### `ai.rs` — AI Operations

- `transcribe_video` — Run Whisper on a video file
- `detect_highlights` — Score segments by engagement potential
- `detect_smart_segments` — Find natural breakpoints in the video
- `run_ai_director_plan` — Full AI pipeline (analyze → segment → rank)
- `voice_discovery` — Check Edge TTS availability

### `project.rs` — Project Management

- `save_project_file` / `load_project_file` — JSON project persistence
- `list_project_files` / `delete_project_file` — Project listing and deletion
- `get_export_dir` — Resolve the user's output directory

### `render/` — Video Rendering

| Command | Description |
|---|---|
| `transcode_with_crop` | Crop video to aspect ratio (9:16 / 1:1 / 16:9) |
| `export_video` | Full export with optional subtitle burn-in |
| `generate_preview` | Quick low-res preview generation |
| `render_autonomous_cut` | Multi-segment cut from AI-detected highlights |
| `cut_video` | Cut video at specified segments |

### `file_ops.rs` — File Operations

- `clean_temp_file` — Remove temporary files
- `open_file` — Open file in system default app
- `read_text_file` / `get_file_size` — File metadata

## Binary Resolution

`binary.rs` resolves FFmpeg/ffprobe paths with environment variable override:

```rust
pub fn ffmpeg_binary() -> String {
    std::env::var("CUTDECK_FFMPEG_PATH")
        .unwrap_or_else(|_| "ffmpeg".to_string())
}
```

## Error Handling

All Tauri commands return `Result<T, String>`. The `utils::cmd_err` helper formats FFmpeg output into user-friendly error messages:

```rust
fn cmd_err(label: &str, output: &std::process::Output) -> String {
    let stderr = String::from_utf8_lossy(&output.stderr);
    format!("{}: {}", label, stderr.trim())
}
```
