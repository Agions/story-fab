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
│   ├── commands/                IPC 命令（按域分组）
│   │   ├── ai/                  AI 子命令
│   │   ├── auto_save/           自动保存与崩溃恢复
│   │   ├── commentary/          解说模式后端
│   │   ├── project/             项目管理
│   │   └── render/              渲染 + 智能拆条
│   ├── llm/                     LLM Provider（含 providers/ 子目录）
│   ├── subtitle/                Whisper 字幕
│   ├── video/                   视频元数据 + 抽帧
│   ├── highlight/               高光检测
│   ├── segment/                 语义分段
│   ├── binary/                  FFmpeg / Whisper 二进制管理
│   ├── utils/                   工具函数
│   ├── types.rs                 全局类型
│   └── lib.rs                   库入口
├── tests/                       Rust 集成测试
│   ├── resilience.rs            panic hook + 资源限额（P0）
│   ├── crash_recovery.rs        崩溃恢复（P0-4）
│   └── audio_mix.rs             音频混音纯函数（P2）
├── capabilities/                Tauri 权限配置
└── icons/                       应用图标
```

## 命令清单

> 完整命令清单通过 `grep -rE '#\[tauri::command\]' src-tauri/src/` 生成，当前 **61 个 IPC 命令**。下表列出代表性命令：

### commentary

- `start_director_analysis` — 启动 Director Agent 分析
- `create_director_session` — 创建 Director 会话
- `get_director_status` — 查询 Director 状态
- `approve_director_plan` — 批准 Director 计划
- `revise_director_plan` — 根据反馈修订
- `run_ai_director_plan` — LLM 调用生成计划
- `complete_director_render` — 完成渲染
- `destroy_director_session` — 销毁会话
- `generate_commentary_script` — 生成解说脚本
- `generate_narration_script` — 生成逐句解说词
- `synthesize_commentary_audio` — 合成解说音频
- `list_commentary_voices` — 列出可用音色

### render

- `render_autonomous_cut` — 智能拆条渲染
- `cancel_export` — 取消导出
- `generate_preview` — 生成预览
- `export_video` — 导出视频
- `get_export_dir` — 获取导出目录
- `detect_highlights` — 检测高光
- `detect_smart_segments` — 智能分段
- `detect_zcr_bursts` — 过零率突发检测
- `burn_subtitles` — 烧字幕

### llm

- `list_available_models` — 列出可用模型
- `call_llm` — LLM 统一调用入口

### subtitle

- `whisper_transcribe` — Whisper 离线转写（见 `commands/subtitle/` 在 src-tauri/src/ 顶层）
- `save_project_file` / `load_project_file` — 项目文件读写
- `auto_save_project` / `preview_autosave` / `recover_autosave` — 自动保存与恢复
- `clear_autosave` / `list_recoverable_projects` — 自动保存管理

### project

- `analyze_video` / `analyze_video_for_narration` — 视频分析
- `run_ffprobe` — FFprobe 元数据
- `extract_key_frames` / `generate_thumbnail` — 关键帧与缩略图
- `open_file` / `read_text_file` / `delete_file` / `get_file_size` — 文件操作
- `list_app_data_files` / `check_app_data_directory` — 应用数据管理

### ai

- `list_tts_backends` / `check_tts_available` / `synthesize_speech` — TTS 接口
- `estimate_tts_duration` — 估算 TTS 时长

### crash

- `list_crashes` / `read_crash` / `delete_crash` / `clear_crashes` — 崩溃报告管理

## 二进制管理

首次启动自动下载 FFmpeg / Whisper 二进制：

```
<config-dir>/bin/ffmpeg
<config-dir>/bin/whisper
```

可手动指定：

```bash
export CUTDECK_FFMPEG_PATH=/custom/path/ffmpeg      # FFmpeg 路径（旧名前缀）
export CUTDECK_EDGE_TTS_PATH=/custom/path/edge-tts  # Edge TTS 路径（旧名前缀）
export STORYFAB_RESOURCE_PERMITS=200                # 进程资源限额
```

> 注：环境变量前缀 `CUTDECK_` 是项目前身命名残留，保留以保持向后兼容。

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