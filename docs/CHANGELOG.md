---
title: Changelog
description: StoryFab 版本更新历史
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0.4] - 2026-05-07

### Changed
- **Refactor pass — build fixes, code quality, dead code removal** (commit `679dd20`)
  - 修复 LESS 变量缺失：`_film-variables.less` 补齐 `@bg-surface` / `@bg-void` / `@border-subtle` / `@border-default` / `@text-*`
  - 从 `shared/constants` 直接导出 `MAX_FILE_SIZE`
  - 新增 `styles/` 目录（`_film-variables.less` / `_mixins.less` / `variables.less`）
  - `SubtitleExtractor`：静默 `video.play()` catch 改为 `console.warn`

### Removed
- `cutDeckStore.ts`（dead store，已合并到 `timelineStore`）
- `Dashboard/types` 未使用的 `EmotionKey` interface
- `seoGenerator` 硬编码：抽取为 `seoConstants.ts`，提升类型安全

---

## [2.0.3] - 2026-05-01

### Fixed
- **TypeScript 0 errors · ESLint 0 warnings · 261 tests passed** (commit `e07e212`)
- `STORAGE_KEYS`：补齐 `legacy.token` / `legacy.projects` 向后兼容键
- `ScriptWriting.tsx`：修复 `useRef` 导入与 `Timeout|null` 类型检查
- `TimelinePanel.tsx`：修复 `useEffect` 返回值（TS7030）
- `base.service.ts`：修复 `delay` 参数 shadowing
- `pipeline-checkpoint.ts`：使用 `delay()` 工具函数
- `code-review.test.ts`：替换 7 处 `any` 为正确类型

---

## [1.9.7] - 2026-04-17

### Changed
- `perf(build)`：`chunkSizeWarningLimit` 400 → 600
- `fix`：React Hooks 规则合规性
- `fix(types)`：TypeScript 类型细化
- `refactor`：Zustand stores 切换至 selector mode

---

## [1.9.6] - 2026-04-14

### Fixed
- 综合补丁集（v1.9.2 → v1.9.6 累计修复）
- 完整变更：[v1.9.2...v1.9.6](https://github.com/Agions/CutDeck/compare/v1.9.2...v1.9.6)

---

## [1.9.2] - 2026-04-14

### 🔒 Security
- **P0：Release 构建移除 devtools** — 生产包不再包含 Tauri DevTools API
- **P0：启用严格 CSP 策略** — Content Security Policy 强制生效（原为 null）

### ⚡ Performance — Async I/O
**12 个 Tauri 命令从 sync 改造为 async**（主线程不再阻塞）：

`check_ffmpeg` · `analyze_video` · `generate_thumbnail` · `extract_key_frames` · `check_app_data_directory` · `save_project_file` · `load_project_file` · `delete_project_file` · `list_project_files` · `list_app_data_files` · `delete_file` · `get_file_size`

### 🏗️ Architecture — P2 Module Split
`lib.rs` 1314 lines → 10 lines（thin facade）：

```
src-tauri/src/
├── lib.rs          # facade (10 lines)
├── types.rs        # all input/output structs
├── binary.rs       # ffmpeg/ffprobe path resolution
├── utils.rs        # tools (parse_fraction, etc.)
└── commands/
    ├── ffprobe.rs  # check_ffmpeg, analyze_video
    ├── project.rs  # 8 file management commands
    ├── ai.rs       # thumbnail, keyframes, director, detect_*
    └── render.rs   # transcode_with_crop, render_autonomous_cut
```

---

## [1.9.1] - 2026-04-11

### Fixed
- **TypeScript Strict Mode 全量启用** — 59 个 strict mode 错误在 15 个文件全部清零
  - `useVideo.ts`：`TaskStatusInfo` / `Scene` 类型
  - `asr.service.ts`：`SpeechRecognition` 循环引用
  - `clipRepurposing/pipeline.ts`：`StepOptions` 类型兼容
  - `appStore` / `editorStore` / `projectStore`：Zustand 状态类型化
  - `logger.ts`：context 参数类型化为 `unknown`
  - `AIAssistant.tsx` / `trackManager.ts` / `aiService.ts`：array/object literal 类型化

---

## [1.9.0] - 2026-04-10

### Core
- **Rust `highlight_detector.rs` 上线** — FFmpeg `scdet` + 音频能量分析驱动 clip 评分
- **6 维 scoring 接入 pipeline** — `audioEnergy` 加权进入 laughter / emotion 维度
- **Timeline 键盘快捷键实回调** — Delete / I / O / ⌘A / ⌘Z / ⇧⌘Z 通过 `editorStore` 真实可用
- **SubtitleExtractor 重建** — 完整视频播放器 + 字幕时间轴 + 内联编辑

### P0 Fixes
- `editorStore`：`inPointMs` / `outPointMs` 与 `setInPoint` / `setOutPoint` / `selectAllClips` actions
- 新增 `get_export_dir` Tauri 命令（平台下载目录）
- `highlight_detector` 输出在 `buildCandidates()` 去重

### P1 Fixes
- `clipScorer`：`audioEnergy` 加权进 `scoreLaughter` / `scoreEmotion`
- SEO hashtags：抖音 7 → 15，小红书 7 → 20

### P2
- `HighlightList` 从 `_DEAD/` 找回 → 集成到 `AIAnalyze` 完成视图

### Docs
- `architecture.md` 更新（移除已弃用的 workflow engine）
- `features.md`：`highlight_detector` 标记 ✅ ACTIVATED
- `clip-repurpose.md`：6 维权重与实现对齐

---

## [1.8.0] - 2026-04-10

### Code Quality
- **TypeScript 严格模式全面修复** — 183 个 `strictNullChecks` 错误全部清零，跨 15+ 模块
- **antd Tree-shaking** — `babel-plugin-import` 按需引入，减少 bundle 体积
- **Rust 代码质量** — 消除 `as any`、死代码清理、`Math.random` 数据污染移除

### Bug Fixes
- **Timeline 虚拟化**：`scrollLeftRef` 不触发重渲染问题修复
- **`transcode_with_crop`**：16:9 格式支持 + 1:1 filter 语法修复
- **SmartCut 静音检测**：接入 Rust，替换 `Math.random()` 模拟

### Design Quality
- **ThemeContext**：OKLCH 色彩系统对齐
- **ant-input 暗色模式**：修复白底黑字配色
- **emoji / 图标无障碍**：`aria-label` 补齐

完整变更：[v1.7.0...v1.8.0](https://github.com/Agions/CutDeck/compare/v1.7.0...v1.8.0)

---

## [1.7.0] - 2026-04-07

### Changed
- 综合优化（详见 [v1.6.5...v1.7.0](https://github.com/Agions/CutDeck/compare/v1.6.5...v1.7.0)）

---

## [1.6.5] - 2026-04-06

### Changed
- 综合优化（详见 [v1.3.0...v1.6.5](https://github.com/Agions/CutDeck/compare/v1.3.0...v1.6.5)）

---

## [1.6.4] - 2026-04-06

### 📁 文件结构优化

#### Hooks 重复定义合并
- （462 行）+ （347 行）→ 合并至统一入口
- 消除三处分散定义
- 净减少 350 行重复代码

#### 死代码清理
- 删除（无任何引用）
- 删除（无任何引用）
- 移除废弃的 hooks 导出

---

## [1.6.3] - 2026-04-06

### 🏗️ 核心架构优化

#### VisionService 并行分析
- `objects` 检测 + `emotions` 分析并行执行（`Promise.all`）
- 两步独立的 AI 分析调用耗时减半

#### 消除冗余调用链
- `clip-workflow.processVideo`：`analyzeVideo` 已返回 scenes，移除重复的 `detectScenes` 调用
- 移除死代码：`detectScenes` + `detectSilence` 私有方法

#### `optimizeScenes` Map 查表
- `filter.find` 嵌套 O(n²) → 预建 Map O(n)
- 大量物体/情感数据时渲染和分析显著提速

---

## [1.6.2] - 2026-04-06

### ⚡ 性能优化

#### WaveformCanvas 渲染优化
- `segments.find` O(n) → Map lookup O(1)
- 避免每帧渲染时每个 bar 都遍历所有字幕段落
- 大量字幕时渲染性能显著提升

#### cacheManager 优化
- `JSON.parse(JSON.stringify)` → `structuredClone`（引擎级优化）
- `exportCache` 移除 pretty-print

---

## [1.6.1] - 2026-04-06

### ⚡ 性能优化

#### `concurrentMap` 并发限流
- 首页 / Dashboard 项目加载并发数限制为 8
- 避免大量 `getFileSizeBytes` 调用同时发起，降低文件系统压力

#### StorageService.export JSON 压缩
- 移除多余的 pretty-print 参数 `(null, 2)`
- 大型项目 JSON 序列化速度显著提升

#### 版本对齐
- `package.json`：v1.4.0 → v1.6.0（与代码状态同步）

---

## [1.6.0] - 2026-04-06

**Story-Fab v1.6.0 — 内容复用管道**

### 🎬 内容复用管道 — 长视频自动拆条

新增 `src/core/services/clipRepurposing/` 模块：

#### ClipScorer — 多维评分引擎
6 维度评分（0-100），权重可配置：
- **笑声密度**：笑声 / 鼓掌密度越高分越高
- **情感峰值**：情感关键词命中（震惊 / 搞笑 / 激动）
- **对话完整性**：句子是否完整（开头 / 结尾截断扣分）
- **有声占比**：文本密度估算（太静 / 太吵都扣分）
- **语速健康度**：100-200 字/分钟最优
- **关键词命中**：高 engagement 词（揭秘 / 干货 / 必须 / 技巧）

#### SEOGenerator — 平台元数据生成
- 支持 **YouTube Shorts / TikTok / Instagram Reels**
- 生成标题（≤60 字）/ 描述（≤150 字）/ Hashtags（5-10 个）
- 中英双语，基于 hook 提取 + engagement 关键词

#### MultiFormatExport — 多格式导出
- **9:16** TikTok / Reels / Shorts
- **1:1** Instagram Feed
- **16:9** YouTube Shorts
- FFmpeg scale + crop 滤镜，智能裁切策略

#### ClipRepurposingPipeline — 完整管道
4 阶段：场景边界候选片段 → 多维评分 → SEO 生成 → 导出任务准备

#### Workflow 接入
- 新增 `repurposing` 步骤，接入 WorkflowEngine
- 新增 **`ai-repurposing`** 工作流模式：upload → analyze → repurposing → preview → export（10 分钟全自动）

---

## [1.5.0] - 2026-04-06

**Story-Fab v1.5.0 — 技术债清理**

### 🧹 技术债清理

#### ASR 服务
- **Web Speech API 实现**：新增 `tryWebSpeechASR()`，无 API key 也能进行语音识别
- **降级回退策略**：Web Speech → mockASR，不阻塞工作流
- **云 ASR 配置化**：讯飞 / 腾讯 ASR 改为环境变量配置（`VITE_XFyun_*` / `VITE_TENCENT_ASR_*`）

#### 配乐服务
- **预置音乐库扩充**：6 → 12 首，新增 retro-synthwave / tension-builder / acoustic-morning 等
- 4 个外部 API TODO 标注为 aspirational，不影响当前工作流

#### Bug 修复
- **`plotAnalysis.service.ts`**：修复 `extractKeyframes` 调用类型（`f.path` → `f.thumbnail`）
- **Vitest 测试隔离**：`route-preload.test.ts` 添加 `vi.mock` 隔离，181 passed 0 errors（之前 6 errors）

#### 类型安全
- `WorkflowConfig` 新增 `videoFile` + `whisperConfig` 字段，移除 3 处 `as any`

---

## [1.4.0] - 2026-04-06

**Story-Fab v1.4.0 — 核心流程架构升级**

### 🏗️ 核心流程架构升级
- **`aiClipExecutor`**：`executeAIClipStep` 返回值现写入 `WorkflowData.aiClipResult`，AI 剪辑结果不再丢失
- **`musicExecutor`**：`music` 步骤已注册，配乐结果写入 `WorkflowData.musicStepOutput`

### 🔧 类型安全强化
- 移除 3 处 `as any` 类型逃逸
- `WorkflowConfig` 新增 `videoFile` + `whisperConfig` 字段
- `Promise.allSettled` 显式类型化

### 🐛 Bug 修复
- **`VisionService.extractKeyframes`**：补全缺失方法（此前 keyframes 永远为空数组）

### ✨ Lint 修复
- 5 个组件 display-name 缺失
- `Tooltip` 导入路径错误
- `clip={` JSX 语法错误

---

## [1.3.0] - 2026-04-05

**Story-Fab v1.3.0 — AI Cinema Studio**

### 🎨 AI Cinema Studio UI Overhaul

#### Design System
- **Deep Charcoal** + **Amber** + **Cyan** 配色
- **Fonts**：Outfit（display）+ Figtree（body）+ JetBrains Mono（timecodes）
- **Glass Morphism**：所有卡片使用 backdrop-filter + 半透明
- **Animations**：Neural pulse、scanline 纹理、自定义滚动条

#### Components Redesigned
- **Layout**：新侧边栏（amber accent）+ topbar
- **Dashboard**：Glass morphism 卡片 + 状态徽标
- **Landing**：Canvas 粒子 hero + 3 步流程 + 功能栅格
- **CutDeck Workflow**：纵向步骤列表 + 4 态动画
- **VideoUpload**：拖拽 pulse 动画 + amber 进度条
- **AIAnalyze**：神经网络可视化（cyan 脉动点）
- **EffectsPanel**：4×3 滤镜栅格 + amber 滑块
- **HighlightPanel / SmartSegmentPanel**：JetBrains Mono timecodes + 热力条
- **SubtitleEditor**：Canvas waveform + amber 播放头

#### Fixed
- `Dashboard.module.less` 缺失 `@radius-full`

---

## [1.2.0] - 2026-04-04

### 🏗️ 架构升级

#### Zustand Store 治理
- **`mainStore.ts`**：移除 dead field `autoSave` / `isDarkMode`（与 `appStore` 重复，无任何引用点）
- **`appStore.ts`**：`autoSave` 从嵌套 `userSettings` 提升到顶层字段 `autoSave`，并新增 `setAutoSave` action
- **`src/store/theme.ts`**：删除（与 `ThemeContext.useTheme` 命名冲突，无调用点）
- **`src/hooks/useSettings.ts`**：删除 `useAppSettings` 函数（dead function，无调用点）
- 状态拓扑收束：`appStore` = UI + 设置，`mainStore` = AI 模型配置，各自职责清晰

#### 视频处理管道接口抽象
- 新建 `src/core/video/`：types.ts · IVideoProcessor.ts · TauriVideoProcessor.ts · formatters.ts · index.ts
- **`IVideoProcessor`**：后端无关接口，定义 `analyze` / `extractKeyFrames` / `generateThumbnail` / `cut` / `preview`
- **`TauriVideoProcessor`**：Tauri invoke 实现类，单例 `videoProcessor`，`parseVideoError` 收敛于此
- **`formatters`**：纯函数（`formatDuration` / `formatResolution` / `formatBitrate` / `formatFileSize`），无副作用
- `video.ts` 降级为 facade，代理所有导出，兼容已有调用点
- 核心收益：可切换实现（Tauri → WebCodecs 或测试 mock）

#### Workflow 引擎状态机化
- 新增 `WorkflowEngine.ts`：图执行器，基于 `WORKFLOW_MODE_DEFINITIONS` 构建实际执行序列
- 新增 `IStepExecutor.ts`：步骤执行器接口，`execute(ctx)` 返回表示成功
- 条件跳过：`config` 驱动（`autoAnalyze` / `autoGenerateScript` / `autoDedup` / `aiClipConfig`）
- 重试机制：`ctx.retry()` 抛出 `RetryRequest`，引擎自动 `attempt++` 后重试
- 跳过机制：`ctx.skip()` 抛出 `SkipRequest`，继续下一步骤
- 进度广播：订阅者模式 + `STEP_WEIGHTS` 映射表，总进度 0-100
- `pause` / `resume` / `abort` 支持
- 原有 `workflowService.ts` 和 step executor 函数完全保留，向后兼容

#### Services 索引更新
- `workflow/index.ts`：新增 `WorkflowEngine`、`IStepExecutor` 导出

---

## [1.1.1] - 2026-04-02

### Changed
- 内部优化（详见 [v1.0.1...v1.1.1](https://github.com/Agions/StoryForge/compare/v1.0.1...v1.1.1)）

---

## [1.0.1] - 2026-03-30

### Changed
- 内部优化（详见 [v1.1.0...v1.0.1](https://github.com/Agions/StoryForge/compare/v1.1.0...v1.0.1)）

---

## [1.0.0-beta] - 2026-03-07

### Added
- 项目首版 beta 发布
- 基础视频导入与简单片段导出
