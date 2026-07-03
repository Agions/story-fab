---
title: 用户指南
description: StoryFab 本地 AI 视频创作工具
---

# 用户指南

StoryFab 把长视频自动转成短视频片段、解说配音、字幕烧录，全部在本地完成。

## 工作模式

| 模式 | 场景 | 关键能力 |
| --- | --- | --- |
| **剪辑模式** | 直播回放、会议记录、游戏集锦 | AI 高光检测 → 多比例导出 |
| **解说模式** | 短剧、电影、综艺 | 5 步 Agent Pipeline 生成解说视频 |

## 推荐阅读路径

- 新用户 → [快速开始](/getting-started/quick-start)
- 接入 AI → [AI 分析](/features/ai-analysis) · [脚本生成](/features/script-generation)
- 内容创作 → [解说模式](/features/commentary-mode) · [导出](/features/export)
- 提升效率 → [快捷键](/configuration/keyboard-shortcuts) · [配置](/configuration/configuration)

## 工作原理

```
视频源
  → Whisper 离线转字幕
  → 高光检测 / 语义分段
  → Director Agent 策划节奏
  → 5 步 Pipeline 生成解说词
  → TTS 合成配音
  → FFmpeg 渲染 + 烧字幕
  → 多比例成片导出
```

所有步骤在本地桌面应用内完成，原始视频和脚本不上传任何云端。