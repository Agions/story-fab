---
title: 常见问题
---

# 常见问题

## 概述

**StoryFab 是什么？** 开源桌面视频创作工具，基于 Tauri 2 + React + Rust，自动从长视频中提取片段并生成解说。

**许可证？** MIT 协议，个人和商业均可。

**支持哪些平台？** Windows 10/11、macOS 12+（Apple Silicon 和 Intel）、Linux（x64）。

## 安装

**macOS 提示「无法打开，因为无法验证开发者」？** 右键 app → 打开 → 弹出框再点打开。或：`sudo xattr -rd com.apple.quarantine "/Applications/StoryFab.app"`。

**Windows SmartScreen 拦截？** 点「更多信息」→「仍要运行」。

**Linux AppImage 启动失败？** 安装 `libfuse2`，或改用 `.deb` 包。

## 启动

**「Failed to load FFmpeg/Whisper binary」？** 首次启动需联网下载。失败后：设置代理、放置预编译二进制到 `~/.config/story-fab/bin/`、或从 Release 下载。

**端口 1430 被占用？** 修改 `vite.config.ts` 中 `port` 字段，或设置环境变量后启动开发服务器（参考 `docs/reference/config.md`）。

## AI 分析

**Whisper 转录很慢？** 改用 `tiny` 或 `base` 模型，CPU 占用低。

**LLM 调用失败？** 检查 API 密钥格式、剩余额度、网络代理设置。

**高光检测无结果？** 在设置中把阈值从 0.65 降到 0.4。

## 导出

**字幕乱码？** 字幕编码选 UTF-8。

**FFmpeg 渲染失败？** 查看 `<config-dir>/logs/` 下的最新日志。

**导出文件超大？** 改用「高」预设（CRF 20）替代「极清」。

## 隐私

**会上传我的视频吗？** 不会。所有处理在本地完成。可在设置中完全禁用网络请求。

## 贡献

**如何贡献？** Fork → 分支 → 提交（Conventional Commits）→ PR。详见 README。

**如何报告 Bug？** GitHub Issues，附上日志文件和复现步骤。

**如何添加新 LLM Provider？** 实现 `src/core/services/providers/` 下的对应 trait，详见 `docs/developer/ai-services.md`。