---
title: Changelog
description: StoryFab 版本更新历史
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.0.0] - 2025-05-26

### Added
- **Commentary Mode（解说模式）** — 全新 v3.0 核心功能，将视频自动转化为完整配音解说视频
- **AI Director Agent** — 多轮交互式策划解说结构与风格，生成解说计划
- **Semantic Segmentation（语义分段）** — LLM 理解剧情、人物、情感，对片段进行语义标注
- **Script Generator** — 多风格解说词生成（幽默/接地气/震惊/感动/专业）
- **Edge TTS 配音合成** — 本地合成自然流畅的中文配音
- **Commentary Timeline** — 配音与视频片段时间轴对齐预览
- **降级与容错机制** — LLM/TTS/渲染失败时自动降级

### Changed
- 项目重命名：**CutDeck → StoryFab**（规避侵权风险）
- 仓库重命名：**ClipFlow → story-fab**
- Whisper 模型升级支持（新增 medium 模型）

### Fixed
- VitePress 构建死链接问题（`ignoreDeadLinks: true`）
- GitHub Pages 部署配置
- autonomousRender 命令名称修正
- 通知组件 `notify.error` 参数签名修复

---

## [2.1.0] - 2025-01-15

### Added
- 多种导出比例支持（9:16、1:1、16:9）
- 字幕硬烧录（burn-in）功能
- 批量导出多个片段
- 导出质量预设（高/中/低）

### Changed
- FFmpeg 渲染管线重构，支持更多编码参数
- UI 主题支持深色/浅色/跟随系统

### Fixed
- 长视频分段处理内存溢出问题
- 字幕时间戳同步精度问题

---

## [2.0.0] - 2024-11-20

### Added
- **剪辑模式 Clip Mode** — 将长视频快速转化为多个精彩片段
- **Smart Segmenter** — 基于音频能量/画面变化/语音活动智能识别高光
- **Whisper 本地转录** — 无需上传，本地完成语音转文字
- AI 高光检测灵敏度调节
- 项目自动保存

### Changed
- 全新 React + TypeScript 前端架构
- Tauri 2.x 后端（Rust）

### Fixed
- 视频导入卡顿问题
- 多平台兼容性问题

---

## [1.0.0] - 2024-08-01

### Added
- 初始版本发布
- 基础视频导入
- 简单片段导出