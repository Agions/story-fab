---
title: 更新日志
---

# 更新日志

所有版本变更记录在此。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

## [2.2.0] - 2026-06-19

### 新增

- **自动转场建议引擎**（`transition-suggestion.ts`，P1-A）：30+ 规则矩阵,根据相邻片段的速度差 / 类型切换 / 节拍点 / 静音段自动推荐转场类型。
- **AI 剪辑速度 & 转场暴露 UI**（P1-B）：`<SegmentTimelineCard>` 显示 `suggestedSpeed` 和 `suggestedTransition`,用户一键应用。
- **panic hook + 进程级资源限制器**（`utils/resilience/`，P0）：捕获 Rust 端 panic,通过事件总线把报告发到前端,触发 graceful shutdown。
- **panic-hook 报告前端可视化**（P0-4）：前端 `crash-recovery` 模块订阅 panic 事件,展示崩溃摘要 + 最近日志 + 资源占用,用户可一键导出诊断包。
- **`AppError` + 27 处业务抛错标准化**（`core/errors/AppError.ts`）：消除裸 `throw new Error('msg')`,业务异常带错误码 + 上下文 + 重试建议。
- **ASR 策略模式**（`core/services/asr/providers/`）：原 445 行 `asrService.ts` 拆为 3 个独立 Provider + 1 个编排器,新 Provider 只需注册即可。
- **clip-pipeline 纯函数库**（`clipGenerators.ts`）：`clipWorkflow.ts` 426 → 397 行,核心生成逻辑可独立测试。
- **字幕格式转换工具**（`subtitleFormatters.ts`）：SRT/VTT/ASS 互转 4 个纯函数,与字幕业务解耦。
- **Track 历史撤销/重做**（`store/createHistory.ts`）：通用 undo/redo controller,`editorStore` track 操作接入。

### 修复

- **6 个隐藏 bug**（#20）：Tauri `listen()` 在 unmount 后 resolve 仍保存 unlisten / 动态 import 竞态 / `undefined` spread 导致后端收到意外键 / retry 边界 (`maxRetries=0` 死循环) / 定时器在组件 unmount 后仍触发。
- **CI cold compile 阻塞**（#30）：`brotli` 默认依赖在 `Cargo.lock` 解析到破坏性版本,pin `8.0.4` 修复。
- **Timeline hooks 子目录相对路径错位**（#11 轮重构遗留）：Hook 移入 `Timeline/hooks/` 后 import 路径未同步更新。
- **VideoExport 子组件 less import 路径错位**：4 个子组件 Vite build 失败。
- **`cargo test --lib` 被 6 个 pre-existing 错误毒化**：`ExitStatus::from_raw` 在 rustc 1.86+ 变 unsafe / `(end - start).max(0.0)` 数值类型歧义 / `pcm_samples_from_wav` 两个测试断言错（`i16::MAX / 32768 ≈ 0.99997`,3 字节 PCM = 1 帧非 2 帧）。
- **resilience 测试污染全局静态**：`ResourceLimiter` 用 `OnceLock<u64>` 共享 `MAX_CAPACITY`,测试间互相污染 → 引入 `with_capacity()` 构造函数隔离。
- **Reducer 测试 TS 错误**（CI blocker）：#48 +229 测试引入 4 文件 `tsc` 报错,补完类型签名。

### 性能

- **`detect_zcr_bursts` 异步化 + 进度事件**（#26）：用 `tauri::async_runtime::spawn_blocking` 把 CPU 密集检测移出主线程,前端实时看到 0–100% 进度。
- **`transcode_with_crop` 异步化 + 进度事件**（#27）：多分钟 ffmpeg 转码不再阻塞 Tauri 主线程,通过事件 emit 每秒进度。
- **移除 axios + uuid**：替换为原生 `fetch` + `crypto.randomUUID()`,包体积 -16KB。
- **Zustand selector 优化**：`AIVideoEditor` 的 `editorStore` 改为独立 selector,避免对象引用变化触发整树重渲染。

### 重构

- **核心服务层拆分**：`visionService.ts` (662 行) → 4 个独立服务（场景 / 物体 / 情感 / 报告）；`subtitleService.ts` (558 行) → 2 个服务（Whisper / 字幕）；`scriptService.ts` (548 行) → 4 个模块。
- **巨型组件拆分**：`VideoComposing.tsx` (716 行) → 1 Hook + 6 个子组件；`VideoExport.tsx` (450 行) → 3 个子组件 + 阶段推断工具；`MultiTrackTimeline` 拆分 + 3 个自定义 Hook。
- **Hook 拆分**：`useEditorState` → 3 个独立 Hook（`usePlaybackControl` / `useClipOperations` / `useTrackOperations`）；`useVideo` (366 行) → 4 个纯函数工具 + 删除 hook 自身。
- **`useState` → `useReducer` 状态机迁移（v3.4 §A2 范式，15 个组件）**：VideoEditor (16) / ProjectEdit (17) / VideoProcessingController (14) / VideoExport (14) / OriginalEditor (12) / ScriptDetail (11) / ClipRippling (11) / SubtitleExtractor (10) / ProjectDetail (6) / Highlights (6) / AIVisualizer (6) / VideoSelector (5) / VideoPlayer (5) / VideoUpload (5) / WorkflowEditor (4) / CommentaryPanel (5) / CommentaryScriptEditor (3) — 累计 **163 个 useState → 17 个 reducer**。
- **AI 模型配置拆分**：`aiModels.config.ts` (1069 行) → 3 个子模块（provider / capability / pricing）。
- **消除循环依赖**：`invoke` / `rawInvoke` / `TauriCommand` / `TauriBridgeError` 提取到 `core/tauri/invoke.ts`,打破 tauri bridge ↔ clip-pipeline 互引。
- **DRY 整合**：`timecode.ts` 24 行合并入 `formatting.ts`；`projectMetrics` 从 334 行 `shared/utils/index.ts` 抽出。
- **死代码清理**（5 轮,~3500 行净删除）：
  - 8 个完全重复的 barrel 文件 (index.tsx = 组件.tsx)
  - 4 个 dead progress modules (#23, -849 行)
  - 4 个 dead ui/scripts 文件 (#24, -275 行)
  - 6 个 dead ui components (#25, -1846 行)
  - 8 个 dead code files (#48, -683 行)
  - 5 个 dead code (#39, -445 行)
  - `useVideo.ts` hook (249 行) + `hooks/videoUtils.ts` (157 行)
  - 4 个未引用 export（`ALLOWED_EXTENSIONS` / `ApiError` / `AppConfig` / `AudioFile`）
- **`console.*` 统一为 `logger`**（6 个文件）：`useTrackOperations` / `useEditorState` 等。

### 类型安全

- **`@ts-expect-error` 注释规范化**（71 → 21）：每个注释必须说明"为什么必须有",预留参数全部标 "reserved for future ..."。
- **`any` 收紧**（8 文件 / 31 → 0）：`as any` 全清,只剩 `vite.config.ts` 内联合法用法。
- **`ScriptWriting` 5 个 `: any` → 具体类型**。
- **`@typescript-eslint/no-explicit-any` 警告清零**（8 个 reducer 测试文件）。

### CI / 基础设施

- **`setup-pnpm` composite action**（#21）：main.yml 6 个 job 重复的 setup 步骤抽到 `.github/actions/setup-pnpm`,维护成本降 80%。
- **`rust-tests` job**（#23 验证 P0-1）：跑 `cargo test --test resilience` + `cargo test --test crash_recovery`,lib 测试被 6 pre-existing 错误毒化问题时绕开。
- **`libglib2.0-dev` 安装**（P1-C）：CI runner 默认不带 glib-2.0/gtk-3/webkit2gtk 的 .pc 文件,rust-tests 编译链断。
- **CI 质量门收紧**：ESLint warnings 阈值 250,coverage 阈值 30%,src/ TypeScript errors 必须为 0。

### 样式 / 可访问性

- **`.tDialogue` WCAG-safe 蓝色**（P5）：原 `@info-color #3b82f6` 对比度 3.61 不达标,改为 WCAG AA 蓝色。
- **`SegmentTimelineCard` 缺 CSS class 补齐**（P3）：14 个 CSS module 类引用但定义缺失。
- **a11y 对比度 + 移动端响应式**（P4）：智能面板 dark theme 对比度 / ≤768px 断点布局。

### 文档

- **`REFACTORING_REPORT.md`**：完整记录 11 轮拆分 / 拆分前后行数 / 动机 / 验证步骤。
- **CHANGELOG 补完（本次）**：2.1.0 后 82 个 commit 按"新增 / 修复 / 性能 / 重构 / 类型安全 / CI / 样式 / 文档"分类入档。

## [2.1.0] - 2026-06-08

### 架构

- **ADR-101**：双服务层职责明确（`core/services/` 业务 + `services/` shim）
- **ADR-102**：状态层依赖图规范化（view → hook → store → service → backend）
- **ADR-103**：解说模式 5 步 Pipeline（累积式 state chain）

### 重构

- **死代码清理（轮1，596 行净删除）**
  - 删除 `src/constants/` 孤儿转发层
  - 删除 `src/core/index.ts` 孤儿转发层
  - 删除 `src/hooks/useProject.ts`（与 `useProjectList.ts` 重复）
  - 删除 `scripts/code-review-dashboard.ts`（CI 用 `.mjs` 版本）
  - 删除孤儿：`useApiKeyState`、`useEditor` 默认导出、`formatNumber`、`formatPercent`
- **命名规范化**：`subtitle_scene_aligner.ts` → `SubtitleSceneAligner.ts`
- **DRY**：提取 `PROVIDER_NAMES` 到 `src/shared/constants/providers.ts`

### 重构（轮2，13 个孤儿文件）

- 删 `components/AIVideoPreview/*`（整目录）
- 删 `VideoProcessingController/mods/CommentaryAgentProgress.tsx`
- 删 `components/common/ResponsiveImage.tsx`
- 删 `components/ui/popover.tsx`
- 删 `core/api/`（整目录）+ `core/services/aiClip/heuristics.ts`
- 删 `core/services/providers/backendApi.ts` + `baidu.ts`
- 删 `core/services/subtitle/SubtitleSceneAligner.ts`
- 删 `core/services/video/transition-suggestion.ts`
- 删 `services/file/*`（4 个 shim 孤儿）
- 清理 `providers/index.ts` + `services/video/index.ts` 的 stale re-export

### 重构（轮3，572 行净删除）

- 删 `components/StoryFab/workspace/SubtitleStyler.tsx`（305 行 React 组件）
- 删 `components/StoryFab/workspace/SubtitleStyler.module.less`（267 行 CSS）

### 文档

- **README 重写**：506 → 184 行（-64%），去 emoji、技术化
- **docs 全量重写**：24 个 md + `.vitepress/config.ts` 重做
  - `docs/CHANGELOG.md` -7557 → 2029 行（-73%）
  - 删除 `docs/.vitepress/dist/`（构建产物）
- **Logo 重做**：4 个 SVG（紫粉橙渐变 + SF 字 monogram + 胶片条横穿 + 深空蓝背景）

### 移除

- **解除"本地禁打 tag"约束**：删除 `scripts/verify-no-tag.mjs` + CI `verify-no-tag` job + pre-commit hook 调用
- **理由**：CI release workflow 已基于 tag 触发，本地打 tag 即可触发自动发版

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