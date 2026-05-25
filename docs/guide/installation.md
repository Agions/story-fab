# 安装

## 系统要求

|| 要求 | 最低配置 | 推荐配置 |
|---|---|---|
| 操作系统 | Windows 10, macOS 12, Ubuntu 20.04 | Windows 11, macOS 14 |
| CPU | 4 核 | 8 核以上 |
| 内存 | 8 GB | 16 GB |
| GPU | 可选（用于加速渲染） | NVIDIA GPU + CUDA |
| 存储 | 2 GB | 10 GB+ SSD |

## 下载预编译包

从 [GitHub Releases](https://github.com/Agions/CutDeck/releases) 页面下载最新版本：

|| 平台 | 安装包 | 大小 |
|---|---|---|
| Windows | `CutDeck-{version}-windows-x64-setup.exe` | ~50 MB |
| macOS（Apple Silicon） | `CutDeck-{version}-macos-arm64.dmg` | ~60 MB |
| macOS（Intel） | `CutDeck-{version}-macos-x64.dmg` | ~60 MB |
| Linux | `CutDeck-{version}-linux-x64.deb` | ~70 MB |

## macOS 安装

下载 `.dmg` 文件后：

```bash
# 将 CutDeck.app 拖到 Applications
open /Applications/CutDeck.app

# 如果被 Gatekeeper 拦截，运行：
sudo xattr -rd com.apple.quarantine "/Applications/CutDeck.app"
```

## Linux 安装

```bash
sudo dpkg -i CutDeck-{version}-linux-x64.deb
# 或
sudo apt install ./CutDeck-{version}-linux-x64.deb
```

## 从源码构建

### 环境准备

- **Node.js** 18+（推荐 LTS）
- **Rust** 1.80+（通过 [rustup](https://rustup.rs/) 安装）
- **FFmpeg**（系统 PATH 或设置 `CUTDECK_FFMPEG_PATH`）
- **ffprobe**（系统 PATH 或设置 `CUTDECK_FFPROBE_PATH`）

### 构建步骤

```bash
# 克隆仓库
git clone https://github.com/Agions/CutDeck.git
cd CutDeck

# 安装依赖
npm install

# 开发模式运行
npm run tauri dev
```

## 环境变量

|| 变量 | 默认值 | 说明 |
|---|---|---|
| `CUTDECK_FFMPEG_PATH` | `ffmpeg`（系统 PATH） | FFmpeg 可执行文件路径 |
| `CUTDECK_FFPROBE_PATH` | `ffprobe`（系统 PATH） | FFprobe 可执行文件路径 |
| `CUTDECK_EDGE_TTS_PATH` | `/usr/bin/edge-tts` | Edge TTS 脚本路径 |
| `RUST_LOG` | `CutDeck=info,warn` | Rust 日志级别 |

## 验证安装

启动 CutDeck 后，检查状态栏或设置面板确认：

- ✅ FFmpeg 已检测
- ✅ Whisper 模型可用
- ✅ Edge TTS 已连接

如有组件显示不可用，请参考[配置指南](/guide/configuration)。
