---
title: 更新日志
description: CutDeck 版本更新历史，记录每次版本的主要变更。
---

# 更新日志

本文档记录 CutDeck 的所有重要版本更新。

---

## [Unreleased]

### ✨ Features

- **AI 视频分析**: 新增真实进度回调 (10/30/50/65/75/88/100%)
- **并发处理**: AI 智能拆条支持滑动窗口并发批处理 (最大3个并发)

### 🐛 Bug Fixes

- **lib_optimized.rs**: 移除死亡的 `VIDEO_PROCESSOR` 全局变量
- **lib_optimized.rs**: 添加类型化 `CutSegment` 结构体替代 raw `serde_json::Value`
- **lib_optimized.rs**: 临时文件路径添加随机后缀防止冲突
- **highlight_detector.rs**: 修复音频/评分合并的括号 bug
- **highlight_detector.rs**: 移除损坏的 `Sorted` trait
- **highlight_detector.rs**: 时间戳添加随机后缀
- **highlight_detector.rs**: 修复 `detect_scene_changes` 函数中缺失的 `top_n` 变量
- **aiService.ts**: 修复 `normalizeStyle/Tone` 返回 `"undefined"` 字符串 bug
- **aiService.ts**: 修复 stub 函数抛出原始 `Error` 而非自定义类型
- **aiService.ts**: 修复 `Script` 类型冲突
- **aiService.ts**: 清理未使用参数
- **editorStore.ts**: 修复 `undo()` 空历史记录 guard
- **editorStore.ts**: 修复 `moveClip` 的 `sourceEndMs` 同步
- **editorStore.ts**: 用 `crypto.randomUUID()` 替换 4 处 ID 生成
- **Timeline/utils.ts**: 用 `crypto.randomUUID()` 替换 `generateId`
- **Settings**: 修复 `themeContext` 引用
- **Preview.tsx**: 修复 `onTimeUpdate` 无限循环
- **VideoComposing.tsx**: 修复 `setTimeout` 内存泄漏
- **useProject.ts**: 修复 JSON.parse 错误处理
- **aiClip/config.ts**: 修复 JSON.parse 错误处理

### ⚙️ Improvements

- **ExportService**: 提取 `_buildConfig()` 辅助函数，消除 40 行配置合并代码重复
- **useAIClipAssistant**: 用真实进度回调替换伪造的 `setInterval` 进度
- **editorStore**: `undoTrack` 添加 `next=undefined` guard

### 🔄 Refactoring

- **VideoComposing.tsx**: 拆分 `handleSynthesize` 函数提高可维护性
- **多个文件**: 消除魔法数字，提取命名常量

---

## v2.0.0 (2026-04-30)

### ✨ Features

- **🚀 全面性能优化** — 4Agent协作优化框架
- **AI 智能拆条 2.0** — 并发批处理 + ZCR burst 高光检测分析
- **AI 模型全面升级**:
  - OpenAI GPT-5.5 (2026-04 验证)
  - Google Gemini 3.1 Pro (2026-04 验证)
  - Kimi K2.6 (替代 Kimi K2 Turbo)
  - DeepSeek V4 (2026-04-25 验证)
- **React.memo 优化** — 所有主要 AI Panel 组件添加 memo 优化渲染性能

### ⚙️ Improvements

- **CI/CD 优化**:
  - vitest 并行执行配置
  - pnpm 依赖缓存
  - TypeScript 报告生成修复
  - 构建时间优化
- **字体优化** — Geist Latin-only 字体 (减少 30KB)
- **移除重复 Google Fonts 导入**
- **VitePress 文档升级** — OKLCH 暗色主题 + 6项动画效果
- **进度回调真实化** — `analyzeVideo` 显示真实阶段标签

### 🐛 Bug Fixes

- **Settings**: 修复 `themeContext` 引用和 `apiKey.ts` 语法错误
- **构建错误**: 修复多个 Rust 编译错误
- **构建错误**: 修复构建错误和运行时 bug
- **editorStore**: 修复 undo/redo 空历史边界情况

### 🔄 Refactoring

- **cut_video 命令**: 使用类型化 `CutSegment` 结构体
- **ExportService**: 重构配置构建逻辑

### 📝 Documentation

- **文档专业化升级**:
  - README 专业精品化
  - VitePress 文档站点精品化
  - AI 模型配置文档完善

---

## v1.9.8 (2026-04-19)

### 🔒 Security

- **API 密钥加密存储**: API 密钥改用 `tauri-plugin-store` 加密存储 (AES 加密)，不再明文保存

### 🐛 Bug Fixes

- VideoEditor 导出类型安全修复 (`Partial<ExportConfig>` + 默认值)
- `handleAnalysisComplete` 闭包陷阱修复 (补充 useCallback 依赖项)
- 音量/缩放边界修复 (添加 MIN/MAX 常量约束，防止 NaN)

### ⚙️ Code Quality

- 消除 Magic Numbers，提取 8 个命名常量
- Projects 页面网络请求增加 3 次指数退避重试
- Settings 页面移除 `as any` 不安全 cast

---

## v1.1.1 (2026-04-02)

### ⚙️ Code Optimization

- Editor 页面: 移除未使用 import，完善占位内容
- Editor 页面: 修复 useEffect 依赖缺失
- Editor 页面: 复制按钮完整功能实现
- Editor 编辑器: copyClip 复制功能 (action + hook + 操作函数)
- Timeline 组件: clipMap HashMap 优化，片段查找 O(n²) → O(1)
- Timeline 组件: handlePasteClip bug 修复
- TimelineRuler: window.innerWidth 响应式问题修复
- WorkflowMonitor: 移除 eslint-disable，Timeline items 添加 key
- TimelineClip: 移除未使用 Badge import
- ProjectDetail: hooks 重构，消除 rules-of-hooks eslint-disable

### 📝 Documentation Updates

- README 专业精品化升级
- AI 模型配置文档完善
- VitePress 文档站点精品化

---

## v1.1.0 (2026-03-29)

### ✨ New Features

- ✨ **设计系统升级** — 全新 UI 界面，现代化科技感设计
- ✨ **专业文档站点** — VitePress 驱动的完整文档系统
- ✨ **多 AI 模型支持** — 新增 Gemini 3.1 Pro、Kimi K2.5 等多个模型
- ✨ **批量处理功能** — 支持队列管理和批量导出
- ✨ **短视频创作指南** — 新增完整的短视频创作文档

### ⚙️ Improvements

- 🎨 优化 AI 服务集成，统一管理多提供商
- 🔧 完善组件库，新增多个专业组件
- 📝 优化文档结构和内容

### 🐛 Bug Fixes

- 🔧 修复多种构建问题
- 🔧 修复视频分析性能问题
- 🔧 优化内存占用

---

## v1.0.0 (2026-03-22)

### ✨ Initial Release

- ✨ **初始版本发布** — CutDeck 正式发布
- ✨ **基础 AI 视频分析功能** — 剧情分析、高光识别
- ✨ **智能剪辑工作流** — 自动和半自动两种剪辑模式
- ✨ **多格式导出支持** — MP4、剪映草稿、PR 项目等
- ✨ **React + TypeScript + Vite 技术栈** — 现代化前端架构
- ✨ **Tauri 桌面应用支持** — 跨平台桌面应用框架
- ✨ **Ant Design 5 UI 组件库** — 专业级界面设计

### 🎬 Core Features

- 🎬 剧情分析 — AI 理解视频叙事结构
- ✂️ 智能剪辑 — 一键生成剪辑方案
- 🎙️ AI 配音 — 多音色语音合成
- 🎵 智能混剪 — 自动节奏卡点
- 📝 字幕生成 — ASR + OCR 双重识别
- 🎨 自动包装 — 字幕样式、封面设计

---

## Version Specification

CutDeck 遵循语义化版本规范 (SemVer):

```
主版本.次版本.修订版本

- 主版本 (major): 不兼容的 API 变更
- 次版本 (minor): 向后兼容的功能新增
- 修订版本 (patch): 向后兼容的问题修复
```

---

## About Releases

关于版本发布的详细信息，请查看 [GitHub Releases](https://github.com/Agions/CutDeck/releases)。

---

## Next Steps

- [常见问题](./faq.md) — 常见问题解答
- [贡献指南](./contributing.md) — 参与项目贡献
- [GitHub Releases](https://github.com/Agions/CutDeck/releases) — 查看完整发布说明
