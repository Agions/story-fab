---
title: 导出
---

# 导出

## 输出格式

| 格式 | 编码器 | 文件大小（10分钟） |
| --- | --- | --- |
| MP4 (H.264 + AAC) | libx264 | ~150 MB |
| WebM (VP9 + Opus) | libvpx-vp9 | ~120 MB |
| MOV (ProRes) | prores_ks | ~3 GB |

## 比例

| 比例 | 分辨率 | 适用平台 |
| --- | --- | --- |
| 9:16 | 1080×1920 | TikTok、Shorts、Reels |
| 1:1 | 1080×1080 | Instagram Feed |
| 16:9 | 1920×1080 | YouTube、Bilibili、Twitter/X |
| 4:5 | 1080×1350 | Instagram Feed（竖版） |
| 21:9 | 2560×1080 | 电影感宽屏 |

## 质量预设

> Rust 端 `commands/render/ffmpeg_builder.rs::quality_preset()` 仅实现 3 档，未知档位默认 `medium`。下表对照说明文档与实际行为：

| 预设 | CRF | 码率 | 实际档位 |
| --- | --- | --- | --- |
| 低（low） | 28 | 1 Mbps | ✅ 实际存在 |
| 中（medium） | 23 | 2.5 Mbps | ✅ 实际存在（默认） |
| 高（high） | 18 | 5 Mbps | ✅ 实际存在 |
| 极清（ultra） | - | - | ❌ 文档列出，实际 fallback 到 medium |
| 无损（lossless） | 0 | - | ❌ 文档列出，实际无 loseless 路径 |

## 字幕烧录

两种方式：

1. **硬字幕**：直接烧进视频像素，不可关闭
2. **软字幕**：嵌入独立字幕轨道，可关闭

## 渲染性能

参考速度（macOS M2 / Windows i7-12700）：

| 视频长度 | 渲染时间 |
| --- | --- |
| 1 分钟 | 10-20 秒 |
| 5 分钟 | 40-80 秒 |
| 30 分钟 | 4-6 分钟 |

## 剪映草稿导出

支持 `.json` 格式导出到剪映/度加创作工具，便于二次精修。