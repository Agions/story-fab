---
title: 配置
---

# 配置

所有配置存储在 `<config-dir>/`，按平台：

| 平台 | 路径 |
| --- | --- |
| Windows | `%APPDATA%/story-fab/` |
| macOS | `~/Library/Application Support/story-fab/` |
| Linux | `~/.config/story-fab/` |

## 配置文件

| 文件 | 用途 |
| --- | --- |
| `settings.json` | 应用设置（主题、自动保存、快捷键） |
| `api-keys.json` | LLM Provider API 密钥 |
| `recent-projects.json` | 最近打开的项目 |
| `script-cache/` | LLM 生成结果缓存 |
| `whisper-models/` | 本地 Whisper 模型 |

## 主题

light / dark / system 三档。

## API 密钥

每个 Provider 独立配置：

```json
{
  "openai": { "key": "sk-...", "enabled": true },
  "anthropic": { "key": "sk-ant-...", "enabled": true }
}
```

密钥仅本地存储，不上传。

## 自动保存

间隔：5-60 秒，默认 10 秒。

## 输出路径

支持自定义默认输出目录。每次导出可临时覆盖。