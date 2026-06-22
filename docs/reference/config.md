---
title: 配置参考
---

# 配置参考

## 环境变量

| 变量 | 用途 | 默认 |
| --- | --- | --- |
| `STORYFAB_RESOURCE_PERMITS` | 覆盖进程资源限额 | 自动检测 |
| `CUTDECK_FFMPEG_PATH` | 自定义 FFmpeg 路径（兼容旧名） | 自动发现 |
| `CUTDECK_EDGE_TTS_PATH` | 自定义 Edge TTS 路径（兼容旧名） | 自动发现 |

> Tauri 桌面应用，无独立 CLI 二进制。所有配置通过应用内 UI 修改。

## 配置项 schema

参考 `src/shared/constants/settings.ts` 中的 `AppSettings` 类型。配置通过应用内「设置」页修改，部分环境变量可通过系统 shell 覆盖。