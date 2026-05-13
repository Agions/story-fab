# AI Services

CutDeck uses a **provider abstraction** to support multiple AI backends without code changes.

## Provider Architecture

```
src/core/services/providers/
├── base.service.ts       # BaseProvider abstract class
├── openai.service.ts     # OpenAI GPT-4o
├── anthropic.service.ts  # Anthropic Claude
├── deepseek.service.ts   # DeepSeek V4 / Chat
├── siliconflow.service.ts # SiliconFlow (OpenAI-compatible)
└── index.ts              # Provider registry
```

## Base Provider Interface

All providers implement:

```typescript
interface AIProvider {
  generateScript(transcript: string, options?: ScriptOptions): Promise<string>
  generateTitle(transcript: string): Promise<string>
  generateDescription(transcript: string): Promise<string>
}
```

## Adding a New Provider

1. Create `src/core/services/providers/myprovider.service.ts`
2. Extend `BaseProvider` and implement the interface
3. Register in `src/core/services/providers/index.ts`
4. Add config UI in Settings page

## Whisper (Local)

Whisper runs entirely locally via `src-tauri/src/subtitle.rs`:

- Powered by `faster-whisper` (CTranslate2 implementation)
- Models downloaded on-demand to `~/.cache/whisper/`
- Supports CPU and CUDA inference

## Edge TTS (Local Voice Synthesis)

Edge TTS is used for local voice-over synthesis:

- No API key required
- Runs as a subprocess calling `edge-tts` CLI
- Communicates via stdin/stdout
- Voices: Any [Microsoft Edge TTS voice](https://speech.platform.bing.com/consumer/sapi/voices)
