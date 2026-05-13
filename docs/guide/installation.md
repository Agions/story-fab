# Installation

## System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| OS | Windows 10, macOS 12, Ubuntu 20.04 | Windows 11, macOS 14 |
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16 GB |
| GPU | Optional (for faster rendering) | NVIDIA GPU with CUDA |
| Storage | 2 GB | 10 GB+ SSD |

## Download Pre-built Binaries

Download the latest release from the [GitHub Releases](https://github.com/Agions/CutDeck/releases) page:

| Platform | Artifact | Size |
|---|---|---|
| Windows | `CutDeck-{version}-windows-x64-setup.exe` | ~50 MB |
| macOS (Apple Silicon) | `CutDeck-{version}-macos-arm64.dmg` | ~60 MB |
| macOS (Intel) | `CutDeck-{version}-macos-x64.dmg` | ~60 MB |
| Linux | `CutDeck-{version}-linux-x64.deb` | ~70 MB |

## Install on macOS

After downloading the `.dmg` file:

```bash
# Drag CutDeck.app to Applications
open /Applications/CutDeck.app

# If blocked by Gatekeeper, run:
sudo xattr -rd com.apple.quarantine "/Applications/CutDeck.app"
```

## Install on Linux

```bash
sudo dpkg -i CutDeck-{version}-linux-x64.deb
# or
sudo apt install ./CutDeck-{version}-linux-x64.deb
```

## Build from Source

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+
- **Rust** 1.80+ (via [rustup](https://rustup.rs/))
- **FFmpeg** (system PATH or set `CUTDECK_FFMPEG_PATH`)
- **ffprobe** (system PATH or set `CUTDECK_FFPROBE_PATH`)

### Setup

```bash
# Clone the repository
git clone https://github.com/Agions/CutDeck.git
cd CutDeck

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CUTDECK_FFMPEG_PATH` | `ffmpeg` (system PATH) | FFmpeg executable path |
| `CUTDECK_FFPROBE_PATH` | `ffprobe` (system PATH) | FFprobe executable path |
| `CUTDECK_EDGE_TTS_PATH` | `/usr/bin/edge-tts` | Edge TTS script path |
| `RUST_LOG` | `CutDeck=info,warn` | Rust logging level |

## Verify Installation

After launching CutDeck, check the status bar or settings panel to confirm:

- ✅ FFmpeg is detected
- ✅ Whisper models are available
- ✅ Edge TTS is connected

If any component shows as unavailable, refer to the [Configuration](/guide/configuration) guide.
