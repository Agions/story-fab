# Environment Variables

CutDeck can be configured via environment variables for advanced use cases, CI/CD, or self-hosting scenarios.

## Variables

| Variable | Default | Description |
|---|---|---|
| `CUTDECK_FFMPEG_PATH` | `ffmpeg` (system PATH) | Path to FFmpeg executable |
| `CUTDECK_FFPROBE_PATH` | `ffprobe` (system PATH) | Path to FFprobe executable |
| `CUTDECK_EDGE_TTS_PATH` | `/usr/bin/edge-tts` | Path to Edge TTS script |
| `RUST_LOG` | `CutDeck=info,warn` | Rust tracing log level |

## Setting Variables

### Linux / macOS

```bash
# Temporary (for current session)
export CUTDECK_FFMPEG_PATH=/usr/local/bin/ffmpeg
export RUST_LOG=CutDeck=debug

# Permanent — add to ~/.bashrc or ~/.zshrc
echo 'export CUTDECK_FFMPEG_PATH=/usr/local/bin/ffmpeg' >> ~/.bashrc
```

### Windows (PowerShell)

```powershell
# Temporary
$env:CUTDECK_FFMPEG_PATH = "C:\ffmpeg\bin\ffmpeg.exe"

# Permanent
[System.Environment]::SetEnvironmentVariable("CUTDECK_FFMPEG_PATH", "C:\ffmpeg\bin\ffmpeg.exe", "User")
```

### Docker / Container

```yaml
environment:
  - CUTDECK_FFMPEG_PATH=/usr/bin/ffmpeg
  - CUTDECK_FFPROBE_PATH=/usr/bin/ffprobe
  - RUST_LOG=CutDeck=debug
```

## Log Levels

`RUST_LOG` uses the [tracing subscriber format](https://docs.rs/tracing-subscriber/latest/tracing_subscriber/struct.EnvFilter.html):

- `error` — Errors only
- `warn` — Warnings and errors
- `info` — Info, warnings, errors (default)
- `debug` — Debug, info, warnings, errors
- `trace` — Trace (very verbose)

Module-specific filters: `CutDeck=debug,tauri=info,warn`

## FFmpeg Installation

### Ubuntu/Debian

```bash
sudo apt update && sudo apt install ffmpeg
ffmpeg -version  # confirm installation
```

### macOS

```bash
brew install ffmpeg
```

### Windows

Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use winget:

```powershell
winget install ffmpeg
```
