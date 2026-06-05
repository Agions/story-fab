---
title: 架构优化方案 v2.0 → v2.1
date: 2026-06-05
categories:
  - 开发文档
  - 架构设计
tags:
  - StoryFab
  - 架构优化
  - 重构
description: StoryFab 架构优化方案，针对 v2.0 现状识别 5 个痛点并提出可落地的改进路径
---

# 架构优化方案 v2.0 → v2.1

> StoryFab v2.0 架构（已在 `architecture.md` 中详述）已经成熟稳定。本文档针对**实际开发体验**中的 5 个具体痛点，提出**最小入侵、可逐步落地**的优化方案。
>
> **原则**：不重写，推倒重来的诱惑全部拒绝。所有改动**向后兼容 + 可灰度回滚**。

---

## 0. 现状速览

| 维度 | 数量 |
|---|---|
| 前端 TS/TSX 源文件 | 390 |
| Rust 源文件 | 93 |
| Pages | 9 |
| zustand store | 4 (app / project / editor / timeline / model) |
| services 子模块 | 12 (ai, aiClip, asr, auth, commentary, editor, export, file, pipeline, project, providers, storage, subtitle, video, workflow) |
| Pipeline steps | 4 (BuildCandidates / ScoreClips / GenerateSEO / PrepareExport) |
| Tauri commands | 12 模块 |
| shadcn/ui 组件 | 24+ (button / dialog / select / 等) |
| 文档 (md) | 24 |
| 依赖 | 24 prod + 25 dev |

**核心业务流程** (v2.1 演进)：
```
Dashboard → 选择视频 → VideoSelector → 高光检测 → 解说文案生成 → 配音合成 → 编排 → 导出
   │            │              │              │                │            │          │
   │            │              │              │                │            │          │
appStore    projectStore   video module   asrService    aiService    workflow   exportService
                                                  (multi-agent)
```

---

## 1. 痛点 #1：服务层双层重叠（最高优先级 🔥）

### 1.1 现状
项目存在 **两套 services 入口**：
- `src/services/` — 老的"shim"层（4 个文件 + 1 个 file/ 子目录）
- `src/core/services/` — 新的"core"层（12 个子目录）

具体冲突：
```
src/services/                       src/core/services/
├── file/                           ├── file/fileInfoService.ts  ← 完全不同职责
│   ├── configStorage.ts           ├── ai/  (10 个文件)
│   ├── fileOperations.ts          ├── aiClip/  (6 个文件)
│   └── projectFiles.ts            ├── asr/  (4 个文件)
└── tauri.ts                        ...
                                    ...
```

**问题**：
- 新人**不知道**该用 `src/services/file/fileOperations.ts` 还是 `src/core/services/file/fileInfoService.ts`
- 命名冲突 — `file/` 子目录两边都存在
- `tauri.ts` 在 `src/services/` 单独游离

### 1.2 优化方案

**`src/services/` 重新定位为「shim/adapter」层**（薄包装），`src/core/services/` 保留为「domain」层（厚业务）。

具体动作：
1. **保留** `src/services/file/{configStorage,fileOperations,projectFiles}.ts`（UI 关心的 FS 操作）
2. **重定位** `src/services/tauri.ts` → `src/core/tauri/TauriBridge.ts`（**已经存在 TauriBridge**，老 tauri.ts 应是过时残留）
3. **补 README**：在 `src/services/README.md` 明确说明 shim vs core 职责

**不**做：
- 不合并 `src/services/file/fileOperations.ts` 和 `src/core/services/file/fileInfoService.ts`（职责不同）
- 不强制统一导入路径（破坏 200+ 处引用）

### 1.3 验收
- `src/services/` 总文件数保持 4-6 个
- `src/services/README.md` 存在并解释双层模型
- `import { tauri }` 全部来自 `@/core/tauri` 唯一来源

---

## 2. 痛点 #2：状态管理边界模糊（次高优先级 🔥）

### 2.1 现状
4 个 zustand store：
- `appStore` — 用户/UI/通知
- `projectStore` — 项目列表 + 筛选
- `editorStore` — 编辑器
- `timelineStore` — 时间线
- `modelStore` — AI 模型

**问题**：
- `modelStore.ts` 用 `AppState` 类型（命名错位 — 应该是 `AIModelState`）
- 4 个 store 之间**没有明确的依赖图**（project → editor → timeline 应该单向）
- 缺乏「**state boundary**」文档

### 2.2 优化方案

明确 **State 依赖图**（单向数据流）：

```
              ┌──────────────┐
              │   appStore   │ (用户/主题/通知 — 全局)
              └──────┬───────┘
                     │ (读 user / push notify)
                     ▼
              ┌──────────────┐
              │ projectStore │ (项目列表 + 当前项目)
              └──────┬───────┘
                     │ (currentProject 切换)
                     ▼
              ┌──────────────┐         ┌──────────────┐
              │  editorStore │ ──────▶ │ timelineStore│ (时间线 = editor 子状态)
              └──────────────┘         └──────────────┘
                     ▲
                     │
              ┌──────────────┐
              │  modelStore  │ (AI 模型 — editor 用的资源)
              └──────────────┘
```

具体动作：
1. **修复 `modelStore.ts` 类型错位**：`AppState` → `AIModelState`
2. **加 store 依赖文档**：`src/store/README.md` 说明边界
3. **禁止跨层引用**：
   - `appStore` 可以被任何 store 读
   - `projectStore` 只能读 `appStore`，不能读 `editorStore`
   - `editorStore` 可以读 `appStore + projectStore`，不能写 `projectStore`
   - `timelineStore` 只读 `editorStore`

### 2.3 验收
- `modelStore` 类型错位修复
- `src/store/README.md` 存在
- ESLint 加 `no-restricted-imports` 规则禁止跨层引用

---

## 3. 痛点 #3：核心流程缺少可视化进度反馈（中等优先级）

### 3.1 现状
Pipeline 已有 4 个 Step + 进度回调：
- `BuildCandidatesStep` (候选片段)
- `ScoreClipsStep` (评分)
- `GenerateSEOStep` (SEO)
- `PrepareExportStep` (导出准备)

**问题**：
- 4 个 Step **只覆盖剪辑流**，**没有覆盖 commentary (解说) 模式**！
- 解说模式走的是 `src/core/services/workflow/commentaryAgents.ts`（5 个 agent：director / visual-analyst / narration-writer / timing-aligner / overlay-planner），**没有 step 化**
- `workflowProgress.ts` 已存在但只测了一个 test
- 用户界面只看到**单一进度条**，看不到 5 个 agent 各自的状态

### 3.2 优化方案

**统一"模式无关"的进度模型**：

```ts
// src/core/pipeline/types.ts (新增)
export type ProgressEvent =
  | { mode: 'clip'; step: 'build-candidates' | 'score-clips' | 'generate-seo' | 'prepare-export'; percent: number }
  | { mode: 'commentary'; step: 'director' | 'visual-analyst' | 'narration-writer' | 'timing-aligner' | 'overlay-planner'; percent: number };
```

具体动作：
1. **新加 5 个 commentary Step**，包装 `commentaryAgents.ts` 的 5 个 agent：
   ```
   src/core/pipeline/steps/CommentaryDirectorStep.ts
   src/core/pipeline/steps/CommentaryVisualStep.ts
   src/core/pipeline/steps/CommentaryNarrationStep.ts
   src/core/pipeline/steps/CommentaryTimingStep.ts
   src/core/pipeline/steps/CommentaryOverlayStep.ts
   ```
2. **UI 层**在 `components/VideoProcessingController/` 增加**多 agent 进度面板**（已有 mods/ 目录但只显示线性进度）

### 3.3 验收
- 5 个 commentary step 文件存在
- UI 多 agent 进度面板能同时显示 director + visual + writer + timing + overlay
- 旧 4 步流程（clip 模式）不受影响

---

## 4. 痛点 #4：错误处理缺乏统一分类（中低优先级）

### 4.1 现状
- `ErrorBoundary` 组件存在（`src/components/common/ErrorBoundary.tsx`）
- 但**没有自定义 Error 类**（`grep "throw new.*Error"` 0 个结果）
- Tauri invoke 错误是**裸 `Error`**，无法区分：网络错误 / Tauri panic / Rust 业务错误 / 用户输入错误

### 4.2 优化方案

**统一错误分类**：

```ts
// src/core/errors/AppError.ts (新增)
export abstract class AppError extends Error {
  abstract readonly category: 'network' | 'tauri' | 'business' | 'user-input' | 'unknown';
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly timestamp: number = Date.now();
  readonly context?: Record<string, unknown>;
}

export class TauriCommandError extends AppError {
  readonly category = 'tauri' as const;
  constructor(public command: string, public code: string, message: string, context?: Record<string, unknown>) {
    super(message);
    this.severity = 'high';
  }
}

export class BusinessError extends AppError {
  readonly category = 'business' as const;
  constructor(message: string, public code: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    super(message);
    this.severity = severity;
  }
}

export class UserInputError extends AppError {
  readonly category = 'user-input' as const;
  readonly severity = 'low' as const;
  constructor(message: string, public field: string) { super(message); }
}
```

具体动作：
1. **创建** `src/core/errors/` 目录 + 4 个错误类
2. **包装 TauriBridge** invoke 调用，捕获错误并 `throw new TauriCommandError(...)`
3. **ErrorBoundary** 接收 error instanceof AppError，分类显示
4. **logger 增强**：error 打印时附带 category + severity

### 4.3 验收
- 4 个错误类存在
- TauriBridge 错误路径抛 `TauriCommandError`
- ErrorBoundary 区分 critical (红) / high (橙) / low (黄) UI 提示

---

## 5. 痛点 #5：缺少性能/耗时监控（低优先级）

### 5.1 现状
- `useEditorState.ts` 用了 `performance.now()` 测播放时间
- **没有全局性能追踪**（Pipeline / Tauri call / Service init 都没埋点）

### 5.2 优化方案

**轻量级 perf hook**：

```ts
// src/shared/utils/perf.ts (新增)
export class PerfTracker {
  private marks = new Map<string, number>();
  
  start(label: string): void {
    this.marks.set(label, performance.now());
  }
  
  end(label: string, meta?: Record<string, unknown>): number {
    const start = this.marks.get(label);
    if (!start) return 0;
    const ms = performance.now() - start;
    this.marks.delete(label);
    logger.debug(`[perf] ${label}`, { ms, ...meta });
    return ms;
  }
}

export const perf = new PerfTracker();
```

具体动作：
1. **创建** `src/shared/utils/perf.ts`
2. **埋点 3 处**：
   - Pipeline 每一步 `end()` 调用
   - TauriBridge 每个 invoke 包裹 `perf.start/end`
   - 页面 mount `perf.start/end` (用 `useEffect`)
3. **未来**：接 `web-vitals` 上报（不在本次范围）

### 5.3 验收
- `perf.ts` 存在
- Pipeline + TauriBridge 关键路径埋点
- Dev 模式 console 看到 `[perf] xxx 12.3ms` 输出

---

## 6. 落地优先级

| 痛点 | 优先级 | 预计改动量 | 风险 |
|---|---|---|---|
| #1 双服务层 | 🔥 P0 | 1 个 README + 1 个文件重定位 | 低 |
| #2 状态边界 | 🔥 P0 | 1 处类型修复 + 1 个 README + 1 个 ESLint 规则 | 低 |
| #3 Pipeline commentary 缺失 | ⭐ P1 | 5 个新 step + UI 改 | 中 |
| #4 错误统一 | P2 | 1 个新目录 + 4 个类 + 包装 | 中 |
| #5 性能监控 | P3 | 1 个 util + 3 处埋点 | 低 |

**本次 v2.1 优化只落地 #1 + #2（双服务层 + 状态边界）**——这是最大痛点、零风险、立刻见效。**#3/#4/#5 留到 v2.2 后续迭代**，保持每次发版改动可控。

---

## 7. ADR (Architecture Decision Record)

### ADR-101: 双服务层保留，职责清晰化
- **决策**：`src/services/` 保留为 shim/adapter 层（UI 关心），`src/core/services/` 保留为 domain 层（业务逻辑）
- **原因**：重写代价大、风险高；分开符合"分层架构"思想
- **后果**：新人需要看 README 理解两层职责；ESLint 加 `no-restricted-imports` 限制跨层引用

### ADR-102: State 边界单向依赖
- **决策**：4 个 store 严格单向依赖 `appStore → projectStore → editorStore → timelineStore`，modelStore 平行
- **原因**：避免循环依赖 / 不必要的 re-render
- **后果**：跨层引用 ESLint 报错；强迫显式 props/hook 传递

### ADR-103: Pipeline commentary 模式延后
- **决策**：v2.1 不落地 commentary step 化，留 v2.2
- **原因**：commentary agent 5 个 step 化涉及 UI 大改，混在 v2.1 风险高
- **后果**：commentary 模式进度反馈仍是单一进度条（v2.2 改进）

---

## 8. v2.1 优化具体执行清单

- [x] 创建 `src/services/README.md`（双层服务职责说明）
- [x] 重定位 `src/services/tauri.ts` → `src/core/tauri/TauriBridge.ts`（删除旧的）
- [x] 修复 `modelStore.ts` 类型：`AppState` → `AIModelState`
- [x] 创建 `src/store/README.md`（状态依赖图 + 边界）
- [x] ESLint 加 cross-layer import 限制
- [x] `npm run lint + type-check + build` 全部通过
- [x] commit + push

---

## 9. 后续 v2.2 路线图

- v2.2: commentary 5 step 化 + UI 多 agent 进度面板
- v2.3: 统一错误类 + ErrorBoundary 升级
- v2.4: perf tracker 全埋点 + 集成 web-vitals

---

*本方案保持向后兼容，所有改动可独立回滚。*
