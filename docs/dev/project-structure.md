# Project Structure

## Repository Layout

```
CutDeck/
├── src/                          # React frontend
│   ├── components/               # React components
│   │   └── CutDeck/              # Main editor (context + workspace)
│   ├── core/                     # Business logic
│   │   ├── services/             # AI, export, subtitle, editor services
│   │   ├── tauri/                # TauriBridge IPC wrapper
│   │   ├── pipeline/             # AI clip pipeline
│   │   └── types/                # Shared TS types
│   ├── hooks/                    # Custom React hooks
│   ├── store/                    # Zustand stores
│   ├── pages/                    # Route-level page components
│   └── styles/                   # Global CSS
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Library entry + plugin + command registration
│   │   ├── main.rs               # Binary entry
│   │   ├── commands/             # Tauri command handlers
│   │   │   ├── ai.rs
│   │   │   ├── project.rs
│   │   │   ├── render/
│   │   │   │   ├── transcode.rs
│   │   │   │   ├── autonomous_cut.rs
│   │   │   │   └── preview.rs
│   │   │   ├── file_ops.rs
│   │   │   └── ffprobe.rs
│   │   ├── video_processor.rs    # FFmpeg operations
│   │   ├── subtitle.rs           # Subtitle + Whisper
│   │   ├── highlight_detector.rs # Highlight scoring
│   │   ├── smart_segmenter.rs    # Segmentation
│   │   ├── binary.rs             # FFmpeg path resolution
│   │   ├── types.rs              # Rust IPC types
│   │   └── utils.rs              # Helpers
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│
├── docs/                         # VitePress documentation
├── public/                       # Static assets (logo, icons)
├── scripts/                      # Build scripts
├── package.json
└── vite.config.ts
```

## Key Files

| File | Purpose |
|---|---|
| `src/core/tauri/TauriBridge.ts` | All IPC calls to Rust |
| `src/core/services/providers/` | AI provider abstraction |
| `src/components/CutDeck/context/CutDeckProvider.tsx` | Main workflow state |
| `src-tauri/src/lib.rs` | Tauri app setup, command registration |
| `src-tauri/src/commands/ai.rs` | Whisper, highlight detection |
| `src-tauri/src/commands/render/` | Video export pipeline |
| `src-tauri/src/types.rs` | Rust structs for IPC |
| `tauri.conf.json` | Tauri app config (title, identifier, capabilities) |
