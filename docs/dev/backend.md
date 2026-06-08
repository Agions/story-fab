---
title: 后端架构
---

# 后端架构

Rust 端基于 Tauri 2，承担视频处理、字幕转写、LLM 代理、解说编排、渲染。

## 目录结构

```
src-tauri/
├── src/
│   ├── main.rs                  Tauri 入口
│   ├── lib.rs                   库入口
│   ├── commands/                IPC 命令
│   │   ├── commentary/
│   │   │   ├── director/        Director Agent
│   │   │   │   ├── states.rs
│   │   │   │   └── prompts.rs
│   │   │   ├── script_generator/
│   │   │   │   ├── providers.rs
│   │   │   │   └── parser.rs
│   │   │   ├── synthesizer/     TTS
│   │   │   └── voice_catalog.rs
│   │   ├── render/
│   │   │   └── autonomous_cut/  智能拆条
│   │   ├── llm/
│   │   │   └── providers/
│   │   │       └── router.rs
│   │   ├── subtitle/            Whisper
│   │   ├── video/               视频元数据 + 抽帧
│   │   ├── ai/                  AI 子命令
│   │   └── export/              渲染管线
│   ├── video_processor.rs       视频处理核心
│   └── binary.rs                FFmpeg / Whisper 二进制管理
├── capabilities/                Tauri 权限配置
└── icons/                       应用图标
```

## 命令清单

### commentary

- `start_commentary_analysis`
- `revise_commentary_plan`
- `complete_commentary_render`
- `quick_commentary`

### render

- `autonomous_cut_video` — 智能拆条
- `extract_key_frames`
- `generate_thumbnail`

### llm

- `llm_router` — 多 Provider 路由

### subtitle

- `whisper_transcribe` — Whisper 离线转写
- `jianying_export` — 剪映草稿导出

### export

- `export_multi_format`
- `transcode_with_crop`

## 二进制管理

首次启动自动下载 FFmpeg / Whisper 二进制：

```
<config-dir>/bin/ffmpeg
<config-dir>/bin/whisper
```

可手动指定：

```bash
export STORYFAB_FFMPEG_PATH=/custom/path/ffmpeg
```

## 错误处理

所有命令返回 `Result<T, TauriCommandError>`，错误枚举：

- `WhisperError` — 转写失败
- `FFmpegError` — 渲染失败
- `LLMError` — LLM 调用失败
- `IOError` — 文件 IO 失败
- `ConfigError` — 配置错误

## 异步模型

所有 IO 命令 `async`，CPU 密集任务（编码、转码）用 `tokio::task::spawn_blocking` 派发到 blocking 线程池，避免阻塞事件循环。

## 验证

```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo test  --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
```