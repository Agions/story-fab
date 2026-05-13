# Frontend Architecture

## Directory Structure

```
src/
├── components/          # React UI components
│   └── CutDeck/          # Main editor workspace
│       ├── context/       # React Context (CutDeckProvider)
│       ├── workspace/     # Step-based editor UI
│       └── types/         # Workflow state types
├── core/                 # Business logic layer
│   ├── services/          # AI, export, subtitle services
│   ├── tauri/             # TauriBridge (IPC)
│   ├── pipeline/          # AI clip pipeline
│   └── types/             # Shared TypeScript types
├── hooks/                 # Custom React hooks
├── store/                 # Zustand stores
├── pages/                 # Route-level components
└── styles/                # Global CSS
```

## State Management

CutDeck uses a **dual state** approach:

1. **React Context** (`CutDeckProvider`) — Manages the main editor workflow state (steps, current video, clips, export settings). Step-based, predictable transitions.

2. **Zustand Stores** — Independent domain stores for cross-cutting concerns:
   - `appStore` — App-level state (theme, settings)
   - `projectStore` — Project metadata and file management
   - `editorStore` — Timeline and clip state
   - `timelineStore` — Timeline-specific UI state

## TauriBridge

`src/core/tauri/TauriBridge.ts` is the single entry point for all frontend → Rust IPC. It provides:

- Typed command invocations (no magic strings)
- Consistent error handling
- Event subscription helpers

```typescript
// All commands go through TauriBridge
import tauri from '@/core/tauri/TauriBridge'

// Invoke a command
const result = await tauri.transcribeVideo({ videoPath, model: 'base' })

// Subscribe to events
tauri.onProgress((data) => { /* ... */ })
tauri.onSubtitleUpdate((data) => { /* ... */ })
```

## Services Layer

```
src/core/services/
├── providers/      # AI provider abstraction (OpenAI / Anthropic / DeepSeek / SiliconFlow)
├── ai/             # Script generation, AI analysis
├── export/         # Video export service
├── subtitle/       # Subtitle parsing and burn-in
├── editor/         # Clip editing operations
└── pipeline/       # AI clip pipeline (score → candidate → SEO → export)
```

Each service is independent and can be tested in isolation.
