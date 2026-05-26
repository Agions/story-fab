# 配置参考

## 应用内设置

应用内设置优先级高于环境变量。详见[配置指南](/guide/configuration)。

|| 设置路径 | 字段 | 默认值 |
|---|---|---|
| AI → Whisper 模型 | `whisperModel` | `base` |
| AI → 默认 Provider | `defaultProvider` | `deepseek` |
| AI → 高光灵敏度 | `highlightSensitivity` | `medium` |
| AI → 最大片段数 | `maxClips` | `10` |
| AI → 最小片段时长 | `minClipDuration` | `15` |
| 导出 → 默认比例 | `defaultAspectRatio` | `9:16` |
| 导出 → 默认质量 | `defaultQuality` | `medium` |
| 外观 → 主题 | `theme` | `system` |
| 外观 → 自动保存 | `autoSave` | `true` |

## 环境变量

高级用户或 CI/CD 场景可使用环境变量覆盖应用内设置。

|| 变量 | 默认值 | 说明 |
|---|---|---|
| `CUTDECK_FFMPEG_PATH` | `ffmpeg`（系统 PATH） | FFmpeg 可执行文件路径 |
| `CUTDECK_FFPROBE_PATH` | `ffprobe`（系统 PATH） | FFprobe 可执行文件路径 |
| `CUTDECK_EDGE_TTS_PATH` | `/usr/bin/edge-tts` | Edge TTS 脚本路径 |
| `RUST_LOG` | `StoryFab=info,warn` | Rust tracing 日志级别 |

## 设置环境变量

### Linux / macOS

```bash
# 临时（当前会话）
export CUTDECK_FFMPEG_PATH=/usr/local/bin/ffmpeg
export RUST_LOG=StoryFab=debug

# 永久 — 添加到 ~/.bashrc 或 ~/.zshrc
echo 'export CUTDECK_FFMPEG_PATH=/usr/local/bin/ffmpeg' >> ~/.bashrc
```

### Windows (PowerShell)

```powershell
# 临时
$env:CUTDECK_FFMPEG_PATH = "C:\ffmpeg\bin\ffmpeg.exe"

# 永久
[System.Environment]::SetEnvironmentVariable("CUTDECK_FFMPEG_PATH", "C:\ffmpeg\bin\ffmpeg.exe", "User")
```

### Docker / 容器

```yaml
environment:
  - CUTDECK_FFMPEG_PATH=/usr/bin/ffmpeg
  - CUTDECK_FFPROBE_PATH=/usr/bin/ffprobe
  - RUST_LOG=StoryFab=debug
```

## 日志级别

`RUST_LOG` 使用 [tracing subscriber 格式](https://docs.rs/tracing-subscriber/latest/tracing_subscriber/struct.EnvFilter.html)：

- `error` — 仅错误
- `warn` — 警告和错误
- `info` — 信息、警告、错误（默认）
- `debug` — 调试、信息、警告、错误
- `trace` — 跟踪（非常详细）

模块级过滤器：`StoryFab=debug,tauri=info,warn`

## FFmpeg 安装

### Ubuntu/Debian

```bash
sudo apt update && sudo apt install ffmpeg
ffmpeg -version  # 确认安装
```

### macOS

```bash
brew install ffmpeg
```

### Windows

从 [ffmpeg.org](https://ffmpeg.org/download.html) 下载或使用 winget：

```powershell
winget install ffmpeg
```
