---
title: CLI 参考
---

# CLI 参考

## 命令

### dev

启动开发模式（Vite + Tauri 热重载）。

```bash
story-fab dev [--port 1430]
```

### build

命令行渲染项目到输出目录。

```bash
story-fab build <project-path> [--output <dir>] [--format mp4|webm|mov]
```

参数：

| 参数 | 说明 |
| --- | --- |
| `--output`, `-o` | 输出目录 |
| `--format`, `-f` | 输出格式 |
| `--quality` | 质量预设（low/medium/high/arch） |
| `--ratio` | 输出比例（9:16/1:1/16:9） |
| `--burn-subtitles` | 烧字幕 |
| `--parallel` | 并行任务数 |

### analyze

命令行分析视频（Whisper 转录 + 高光检测）。

```bash
story-fab analyze <video-path> [--output <json>] [--model base]
```

### config

管理应用配置。

```bash
story-fab config list
story-fab config get <key>
story-fab config set <key> <value>
story-fab config reset
```

## 退出码

| 码 | 含义 |
| --- | --- |
| 0 | 成功 |
| 1 | 一般错误 |
| 2 | 参数错误 |
| 3 | 配置错误 |
| 100 | Whisper 失败 |
| 101 | LLM 失败 |
| 102 | FFmpeg 失败 |
| 200 | 用户中断 |

## 性能与批处理

CLI 模式支持多视频并发：

```bash
story-fab analyze video1.mp4 video2.mp4 video3.mp4 --parallel 3
```

输出 JSON 到每个视频旁的 `.json` 文件。