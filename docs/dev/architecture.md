# System Architecture

CutDeck is a Tauri 2.x desktop application with a React + TypeScript frontend and a Rust backend.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WebView (React 18 SPA)                  │
│                                                              │
│  UI Layer          State (Zustand)       Services Layer       │
│  Components ────► Stores ────────────► TauriBridge (IPC)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ invoke() / emit()
┌──────────────────────────▼──────────────────────────────────┐
│                   Tauri Backend (Rust)                       │
│                                                              │
│  Commands           FFmpeg            Whisper              │
│  FileSystem         Edge TTS          HighlightDetector    │
└─────────────────────────────────────────────────────────────┘
```

## Frontend (React + TypeScript)

- **React 18** with hooks-based components
- **Zustand** for global state management
- **TauriBridge** (`src/core/tauri/TauriBridge.ts`) — typed IPC wrapper for all Rust command invocations
- **Services layer** (`src/core/services/`) — business logic for AI, export, subtitle, pipeline

## Backend (Rust)

- **Tauri 2.x** with async command handlers
- **FFmpeg** (via `ffmpeg-next` or `Command`) for video processing
- **faster-whisper** for local transcription
- **tokio** for async I/O
- **tracing** for structured logging

## IPC Communication

Frontend calls Rust via `Tauri.invoke<T>(command, args)`:

```typescript
// Example: invoke a Rust command
const result = await Tauri.invoke<string>('transcribe_video', {
  videoPath: '/path/to/video.mp4',
  model: 'base',
});
```

Rust returns results via `Result<T, String>`, mapped to `{Ok: T}` / `{Err: String}` on the JS side.

## Key Design Decisions

1. **Local-first AI** — Whisper runs locally; no audio ever leaves the machine
2. **Service abstraction** — AI providers are abstracted behind a `ProviderService` interface, allowing swap between OpenAI / Anthropic / DeepSeek without code changes
3. **Rust for heavy lifting** — Video processing (FFmpeg) and ML (Whisper) run in Rust to avoid JS main thread blocking
4. **Type-safe IPC** — All Tauri commands are typed in `TauriBridge.ts`
