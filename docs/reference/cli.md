---
title: CLI 命令行工具
description: StoryFab 命令行工具使用方法
---

# CLI 命令行工具

StoryFab 提供命令行接口，方便高级用户进行批量处理、自动化脚本集成。

## 安装

StoryFab CLI 随桌面应用一同安装，或通过 npm 独立安装：

```bash
npm install -g story-fab-cli
```

验证安装：

```bash
story-fab --version
# story-fab v3.0.0
```

## 全局命令

### `story-fab analyze`

分析视频文件，返回高光片段和解说潜力评分。

```bash
story-fab analyze <video_path> [options]
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `video_path` | 字符串 | 视频文件路径 |

**选项：**

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--model` | `base` | Whisper 模型（tiny/base/small/medium）|
| `--max-clips` | `10` | 最多返回片段数 |
| `--min-duration` | `15` | 最小片段时长（秒）|
| `--output` | — | 输出 JSON 文件路径 |

**示例：**

```bash
story-fab analyze /path/to/video.mp4 --model small --max-clips 5
```

**输出示例：**

```json
{
  "video": "/path/to/video.mp4",
  "duration_ms": 3600000,
  "clips": [
    {
      "start_ms": 15000,
      "end_ms": 45000,
      "score": 0.92,
      "reason": "high_energy_audio"
    }
  ],
  "transcription": "srt_file_path.srt"
}
```

---

### `story-fab export`

批量导出视频片段。

```bash
story-fab export <project_path> [options]
```

**选项：**

| 选项 | 说明 |
|------|------|
| `--format` | 输出格式（mp4/mov/mkv），默认 mp4 |
| `--ratio` | 比例（9:16/1:1/16:9），默认 9:16 |
| `--quality` | 质量（high/medium/low），默认 medium |
| `--burn-subtitle` | 烧录字幕到视频 |
| `--output-dir` | 输出目录，默认 ~/Videos/StoryFab |

**示例：**

```bash
story-fab export ./my-project --ratio 16:9 --quality high --burn-subtitle
```

---

### `story-fab commentary`

生成解说视频（解说模式 CLI 版本）。

```bash
story-fab commentary <video_path> [options]
```

**选项：**

| 选项 | 说明 |
|------|------|
| `--style` | 解说风格（humor/grounded/shocking/touching/professional）|
| `--target-duration` | 目标解说时长（秒），默认 180 |
| `--voice` | TTS 配音音色 |
| `--speed` | 配音语速（0.5–2.0）|

**示例：**

```bash
story-fab commentary ./video.mp4 --style humor --target-duration 120
```

---

### `story-fab serve`

启动 StoryFab 本地开发服务器。

```bash
story-fab serve [options]
```

**选项：**

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--port` | `1430` | 开发服务器端口 |
| `--host` | `localhost` | 监听地址 |

---

## 环境变量

CLI 和桌面应用共用以下环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `STORYFAB_FFMPEG_PATH` | `ffmpeg` | FFmpeg 可执行文件路径 |
| `STORYFAB_FFPROBE_PATH` | `ffprobe` | FFprobe 可执行文件路径 |
| `STORYFAB_API_KEY` | — | AI Provider API Key |
| `STORYFAB_PROVIDER` | `deepseek` | 默认 AI Provider |

---

## 批处理示例

### 批量处理一个目录下的所有视频

```bash
#!/bin/bash
for video in /path/to/videos/*.mp4; do
  echo "Processing: $video"
  story-fab analyze "$video" --max-clips 5 --output "${video%.mp4}.json"
  story-fab export "$video" --ratio 9:16 --burn-subtitle
done
```

### 自动化解说生成

```bash
#!/bin/bash
# 处理目录下所有视频，生成幽默风格解说
for video in /path/to/videos/*.mp4; do
  story-fab commentary "$video" \
    --style humor \
    --target-duration 150 \
    --speed 1.2 \
    --output-dir "./output"
done
```

---

## 退出码

| 退出码 | 说明 |
|--------|------|
| `0` | 成功 |
| `1` | 一般错误 |
| `2` | 视频文件不存在或无法读取 |
| `3` | FFmpeg 未安装或路径错误 |
| `4` | AI API 调用失败 |
| `5` | 导出失败 |