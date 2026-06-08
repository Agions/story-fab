---
layout: home

hero:
  name: StoryFab
  text: AI 影视解说创作工坊
  tagline: 本地优先 · 全链路本地处理
  image:
    src: /logo.svg
    alt: StoryFab
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 解说模式
      link: /guide/commentary-mode

features:
  - title: 剪辑模式
    details: AI 自动识别视频高光，智能切分为片段。
  - title: 解说模式
    details: 5 步 Agent Pipeline 生成解说视频，Director Agent 把控节奏。
  - title: 本地 Whisper
    details: faster-whisper 离线转字幕，断网可用。
  - title: 多比例导出
    details: 9:16、1:1、16:9、4:5、21:9，硬字幕烧录。
  - title: Rust + Tauri
    details: Tauri 2 桌面框架，GPU 加速 FFmpeg 渲染。
  - title: TTS 配音
    details: Edge TTS / Azure TTS 双引擎，几十种音色。
  - title: Director Agent
    details: 多轮对话式策划，节奏 / 停顿 / 语气可控。
  - title: 隐私优先
    details: 视频、字幕、脚本 100% 不离开设备。
---

## StoryFab

把长视频 → 高光片段 + 解说词 + TTS 配音 + 字幕烧录，全链路在桌面应用内完成。

- [安装指南](/guide/installation)
- [快速开始](/guide/quick-start)
- [系统架构](/dev/architecture)
- [更新日志](/CHANGELOG)