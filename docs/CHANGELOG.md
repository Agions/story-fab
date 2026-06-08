---
title: 更新日志
---

# 更新日志

所有版本变更记录在此。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

## [2.1.0] - 2026-06-08

### 架构

- **ADR-101**：双服务层职责明确（`core/services/` 业务 + `services/` shim）
- **ADR-102**：状态层依赖图规范化（view → hook → store → service → backend）
- **ADR-103**：解说模式 5 步 Pipeline（累积式 state chain）
- **死代码清理**：596 行净删除
  - 删除 `src/constants/` 孤儿转发层
  - 删除 `src/core/index.ts` 孤儿转发层
  - 删除 `src/hooks/useProject.ts`（与 `useProjectList.ts` 重复）
  - 删除 `scripts/code-review-dashboard.ts`（CI 用 `.mjs` 版本）
  - 删除孤儿：`useApiKeyState`、`useEditor` 默认导出、`formatNumber`、`formatPercent`
- **命名规范化**：`subtitle_scene_aligner.ts` → `SubtitleSceneAligner.ts`
- **DRY**：提取 `PROVIDER_NAMES` 到 `src/shared/constants/providers.ts`
- **文档重写**：所有 24 个 docs + `.vitepress/config.ts` 重做，去 emoji 化、技术化
- **Logo 重做**：紫粉橙渐变 + SF 字 monogram + 胶片条横穿

## [2.0.4] - 2026-06-04

### 修复

- 修复 CI workflow base 分支校验
- 修正 `verify-no-tag` CI 兼容性

## [2.0.3] - 2026-06-03

### 新增

- 5 步解说模式 Pipeline 编排
- Director Agent 多轮对话策划

### 修复

- 恢复 barrel 重导出（`COMMENTARY_*`）
- Pipeline UI 改用 deep import

## [2.0.0] - 2026-05-30

### 新增

- 5 家 LLM Provider（OpenAI / DeepSeek / Qwen / Gemini / Anthropic）
- Edge TTS / Azure TTS 双引擎
- 9:16 / 1:1 / 16:9 多比例导出
- faster-whisper 离线字幕
- 双服务工作流（剪辑模式 / 解说模式）

### 基础设施

- Tauri 2.x 升级
- React 18 + TypeScript 5
- Vite 6 构建
- Zustand 状态管理
- CI/CD 5 阶段质量门禁

## [1.x] 历史

### [1.9.0] - 2026-04

- Rust 后端重构
- 视频处理管线优化
- 解说模式原型

### [1.5.0] - 2026-02

- AI 智能拆条
- 多 LLM Provider 集成
- TTS 配音合成

### [1.0.0] - 2025-11

- 首个稳定版
- 剪辑模式基本功能
- Tauri 2 + React 18 架构
- 多平台桌面应用发布

[MIT License](https://github.com/Agions/story-fab/blob/main/LICENSE)