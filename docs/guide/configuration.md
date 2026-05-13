# Configuration

Customize CutDeck's behavior via settings or environment variables.

## In-App Settings

Open **Settings** via `Ctrl/Cmd + ,` or the gear icon.

### AI Settings

| Setting | Description | Default |
|---|---|---|
| Whisper Model | Model size for local transcription | `base` |
| Default AI Provider | AI service for script generation | `DeepSeek` |
| API Key | Your API key for the selected provider | — |
| Highlight Sensitivity | Low / Medium / High | `Medium` |
| Max Clips | Maximum clips per video | `10` |
| Min Clip Duration | Minimum clip length in seconds | `15` |

### Export Settings

| Setting | Description | Default |
|---|---|---|
| Default Aspect Ratio | Preset for new exports | `9:16` |
| Default Quality | CRF preset | `Medium` |
| Default Output Directory | Where clips are saved | `~/Videos/CutDeck` |
| Burn Subtitles by Default | Auto-enable subtitle burn-in | `false` |

### Appearance

| Setting | Description | Default |
|---|---|---|
| Theme | Dark / Light / System | `System` |
| Compact Mode | Denser UI layout | `false` |
| Auto-save | Automatically save project changes | `true` |

## Environment Variables

For advanced users or CI/CD setups:

| Variable | Default | Description |
|---|---|---|
| `CUTDECK_FFMPEG_PATH` | `ffmpeg` | Path to FFmpeg binary |
| `CUTDECK_FFPROBE_PATH` | `ffprobe` | Path to FFprobe binary |
| `CUTDECK_EDGE_TTS_PATH` | `/usr/bin/edge-tts` | Path to Edge TTS script |
| `RUST_LOG` | `CutDeck=info,warn` | Tracing subscriber filter |
