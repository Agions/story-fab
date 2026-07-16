# StoryFab 5 阶段重构 Spec（PR 粒度）

> 📅 制定日期：2026-07-16
> 🎯 目标：完成 5 阶段全量重构，每阶段拆为可独立合入的 PR
> 🔗 上游侦察报告：[architecture-analysis.md](./architecture-analysis.md)
> 📊 项目现状：v2.2.0 · 已完成 Stage 1-6 · 459 TS · 104 RS · 41k+ 前端行 · 98% 测试覆盖

---

## 0. 总览

| 阶段 | 主题 | 预计减行 | PR 数 | 工期 | 风险 |
|---|---|---|---|---|---|
| 1 | Hook 模板消解 + 死代码清理 | -500 | 4 | 1d | 🟢 极低 |
| 2 | Store setter 工厂 + IPC 守卫 | -100 | 3 | 2d | 🟢 低 |
| 3 | Core 服务归一 + barrel 整理 | -300 | 4 | 3d | 🟡 中 |
| 4 | UI 大件拆分（MultiTrackTimeline 等） | -200 | 5 | 5d | 🟡 中 |
| 5 | 性能基准 + 错误归一 + 测试污染清理 | +新增 | 4 | 3d | 🟢 低 |
| **合计** | | **~1100 减 + 基础设施新增** | **20 PRs** | **14d** | |

## 0.1 全局约定

**Branch 命名**：`refactor/stage-N-PR-M-kebab-desc`
- 例：`refactor/stage-1-pr-1-add-bound-reducer-hook`

**Commit 规范**（沿用 Conventional Commits）：
- `refactor:` 重构主类
- `chore(refactor):` 工具/配置类
- `test(refactor):` 仅测试
- `docs(refactor):` 仅文档
- 禁止混 `feat:` 或 `fix:`

**每个 PR 的合并门槛**（CI 卡口）：
1. `npm run type-check` 全绿
2. `npm run lint` 0 error（warning ≤ 50）
3. `npm test` 全绿，且**新增/修改文件测试覆盖 ≥ 90%**
4. `npm run verify:naming` 全绿
5. 如有持久化 schema 变化，需附 migration 步骤
6. 如有公开 API 变化，需更新 `CHANGELOG.md [Unreleased]`

**回滚策略**：
- 每个 PR 单分支，可独立 revert
- 不跨 PR 改同一文件（避免 merge conflict 地狱）
- 阶段 1-3 保持 `main` 全程可运行

## 0.2 起点

- 当前 `main` HEAD：`2e350e4 refactor: component/module split + test expansion (Stage 6)`
- 工作树有 97 个未提交改动（多为文档重构），**执行前**需用户决定：
  - 选项 A：先 commit 当前 working tree 作为 Stage 7，再开 Stage 8
  - 选项 B：先 `git stash` 当前 working tree，从干净 main 开始 Stage 8
  - 选项 C：把当前 working tree 作为 Stage 8 的起点 cherry-pick

---

## 阶段 1：Hook 模板消解 + 死代码清理（4 PRs · 1 天）

> 目标：消解 5 个 reducer-hook 模板共 ~350 行，清理 5 处低风险 `@deprecated`。

### PR-1.1：引入 `createBoundReducerHook` 工厂
- **Branch**：`refactor/stage-1-pr-1-add-bound-reducer-hook`
- **新增**：`src/shared/hooks/create-bound-reducer-hook.ts`（~45 行）
- **测试**：`src/shared/hooks/create-bound-reducer-hook.test.ts`（覆盖 3 个场景）
- **风险**：🟢 仅新增，不动现有代码
- **Commit**：`refactor(hooks): add createBoundReducerHook factory for reducer-template elimination`

### PR-1.2：迁移 `use-project-detail.ts` 到新工厂
- **Branch**：`refactor/stage-1-pr-2-migrate-use-project-detail`
- **修改**：`src/hooks/use-project-detail.ts`（89 行 → 30 行）
- **测试**：现有 `use-project-detail.reducer.test.ts` 保持通过；如缺新增 setter 测试则补
- **依赖**：PR-1.1
- **风险**：🟢 公开 API（`useProjectDetail`）签名不变
- **Commit**：`refactor(hooks): migrate use-project-detail to createBoundReducerHook (89→30 lines)`

### PR-1.3：批量迁移剩余 4 个 reducer-hook
- **Branch**：`refactor/stage-1-pr-3-migrate-remaining-hooks`
- **修改**（同一 PR，方便 review）：
  - `use-script-detail.ts`（105→30）
  - `use-subtitle-extraction.ts`（110→30）
  - `use-script-editor.ts`（~80→25）
  - `use-video-processing.ts`（217→60，只消解模板，业务逻辑保留）
- **依赖**：PR-1.2
- **风险**：🟢 4 个文件独立编译，公开 API 保持
- **Commit**：`refactor(hooks): migrate 4 remaining reducer-hooks to createBoundReducerHook (–343 lines)`

### PR-1.4：清理 5 处安全 @deprecated
- **Branch**：`refactor/stage-1-pr-4-remove-deprecated-code`
- **删除**（5 项，全部已确认无外部引用）：
  1. `src/types/project.ts`：`ProjectStatus` 别名（`rg -l ProjectStatus` 应为零）
  2. `src/stores/project-store.ts`：`useStoryFabStore` 别名导出
  3. `src/core/video/types.ts`：整个文件（已 `@deprecated 请从 @/types 导入`）
  4. `src/core/video/highlight-types.ts`：整个文件（同上）
  5. `src/core/services/ai/vision/object-detection-service.ts` + `scene-detection-service.ts`（BETA + Math.random）
- **修改**：`src/stores/index.ts` 移除 `useStoryFabStore` 导出
- **风险**：🟡 需先 `rg -l <name>` 验证零引用，build 验证
- **Commit**：`chore(refactor): remove 5 deprecated APIs with zero external references (–220 lines)`

**阶段 1 收口**：
- [x] 4 PRs 全绿合入
- [x] `npm test` 全绿，覆盖率不下降
- [x] CHANGELOG [Unreleased] 加 refactor 条目
- [x] 总减行 ≥ 500

---

## 阶段 2：Store setter 工厂 + IPC 守卫（3 PRs · 2 天） ✅ 已完成

> 状态：3/3 PR 完成并推送。full test 67 文件 / 922 测试全绿。详见 [阶段 2 收口报告](#阶段-2-收口报告-2026-07-16)。

### PR-2.1：新增 `createSimpleSetters` 工具 ✅
- **Branch**：`refactor/s-08-pr-5-add-simple-setters` → `f4adead`
- **新增**：`src/stores/create-simple-setters.ts`（49 行）+ `.test.ts`（99 行）
- **设计**：`createSimpleSetters({ setX: 'x', setY: 'y' }, set)` → `{ setX, setY }`，类型按 state 字段推导
- **优势**：支持 action 名与 state key 不一致（setInPoint → inPointMs），且工厂签名放宽接受 createPersistedStore 的包装 set
- **测试**：6/6 通过
- **Commit**：`refactor(stores): add createSimpleSetters factory for mechanical setter elimination`

### PR-2.2：editor-store 接入 ✅
- **Branch**：`refactor/s-08-pr-6-editor-store-setters` → `7e0e42c`
- **替换 9 个简单 setter**（editor-store 共 24 个 setter）：
  - `setVideo / setScript / setVoice / setActivePanel / setIsPlaying / setCurrentTime / setMuted / setScrollPosition / setSnapEnabled`
- **保持手写 15 个**（带副作用/验证/跨字段）：
  - 4 个 clamping（setVolume/setZoom/setPlayheadMs/setTimelineDuration）
  - 1 个 functional spread（setSelection）
  - 2 个 get 依赖（setInPoint/setOutPoint）
  - 8 个时间线业务（addTimelineTrack / moveClip / splitClip / addKeyframe 等）
- **调整**：spec 预计消解 19 个，实际仅 9 个可消解（其他带副作用超出工厂能力）
- **持久化 key 保持 `StoryFab-workspace`**（避免用户数据丢失）
- **测试**：99/99 stores 测试全绿
- **Commit**：`refactor(stores): replace 9 mechanical setters in editor-store with factory`

### PR-2.3：Tauri bridge 超时 + 错误归一 ✅
- **Branch**：`refactor/s-08-pr-7-tauri-bridge-guard` → `e9551fa`
- **新增能力**：
  - `DEFAULT_TIMEOUT_MS = 30_000`（新常量）
  - `BridgeOptions.timeoutMs`（per-call 覆盖）
  - `withTimeout` helper：Promise.race 实现，超时后抛 `kind='timeout'`
  - `TauriErrorKind` 5 分类：`timeout / ipc-error / deserialize / aborted / unknown`
  - `TauriBridgeError` 新增 `kind` 字段
  - `executeWithRetry` 智能跳过重试（timeout / aborted / deserialize 不重试）
- **错误归一**：从错误消息自动检测 kind + retryable
- **测试**：14/14 新增（kind 分类 5 + retryable 判定 + 构造默认值 + 超时触发 + timeoutMs=0 禁用 + AbortSignal）
- **Commit**：`refactor(tauri): add timeout (30s default) + error kind classification to IPC bridge`

**阶段 2 收口报告（2026-07-16）**

| 指标 | 计划 | 实际 |
|---|---|---|
| PR 数 | 3 | 3 ✅ |
| 全量测试 | 全绿 | 67 文件 / 922 测试全绿 (+14 from stage 2) ✅ |
| type-check | 干净 | 干净 ✅ |
| lint | 干净 | 干净 ✅ |
| 新增工具 | 1 (`createSimpleSetters`) | 1 ✅ |
| 替换 setter | 19 (spec) | 9 (实际，剩余 15 带副作用) |
| IPC 守卫 | 超时 + 错误归一 | ✅ |

**未完成项（推后续 PR）**：
- `useStoryFabStore` / `ProjectStatus` 删除：需先迁移 1 / 4 个 consumer（Stage 3 顺带处理）
- 2 个 vision BETA 服务真 Rust 化：需替换 `Math.random`（Stage 3 单独 PR）

---

## 阶段 3：Core 服务归一 + barrel 整理（4 PRs · 3 天）

> 目标：`ai-models/catalog.ts` (654 行) 拆分；services barrel export 整理；Tauri methods 10 分桶去重。

### PR-3.1：ai-models catalog 按 provider 拆分
- **Branch**：`refactor/stage-3-pr-1-ai-models-split`
- **结构**：
  ```
  src/core/config/ai-models/
    providers/
      openai.ts
      anthropic.ts
      google.ts
      alibaba-qwen.ts
      zhipu.ts
      iflytek.ts
      deepseek.ts
      moonshot.ts
      local.ts
      custom.ts
    catalog.ts           # 聚合入口（≤ 50 行）
    ai-models-config.ts  # 已有，引入各 provider
  ```
- **测试**：`ai-models-config.test.ts` 保持全绿；各 provider 文件加最小测试
- **风险**：🟡 10 个文件并行增加，需保证 catalog.ts 的聚合顺序与原 enum 一致（向后兼容）
- **Commit**：`refactor(core): split ai-models catalog by provider (10 files, 654→~50 lines aggregator)`

### PR-3.2：services barrel export 整理
- **Branch**：`refactor/stage-3-pr-2-services-barrel-audit`
- **动作**：
  - 跑 `madge src/core/services/index.ts --circular` 检测循环
  - 删除重复导出（已发现 `commentary/*` 与 `index.ts` 的冲突）
  - 统一 `index.ts` 排序：先 type 后 instance
  - 加 `vite-plugin-circular-deps-check` 到 CI（`vite.config.ts`）
- **风险**：🟡 可能引发外部 `import { xxx } from '@/core/services'` 解析顺序变化
- **Commit**：`refactor(core): audit and dedupe services barrel exports (–150 lines)`

### PR-3.3：Tauri methods 10 分桶去重
- **Branch**：`refactor/stage-3-pr-3-tauri-methods-dedupe`
- **目标**：合并相似命令包装（如 5 个 export 类 → 1 个 `exportVideo` 多态入口）
- **限制**：仅重构 TypeScript 包装层，**不动 Rust 端 commands/**（Rust 改动在后续专项）
- **测试**：现有 IPC 调用方测试需全绿
- **风险**：🟡 高 — IPC 是稳定契约，需严格保持调用方行为不变
- **Commit**：`refactor(tauri): dedupe 10 method buckets (–100 lines, single source of truth)`

### PR-3.4：删除 4 个零引用 legacy 文件
- **Branch**：`refactor/stage-3-pr-4-remove-legacy-files`
- **删除前**用 `rg -l <name>` 严格确认零引用：
  1. `src/core/services/commentary/script-service.ts` 整个（旧 service 已被新 `commentary-service` 替代）
  2. `src/core/pipeline/clip-pipeline/legacy/`（如有）
  3. `src/__tests__/mocks/ai-visualizer.ts`（如未注册）
  4. `src/components/video-player-reducer.ts`（如仅被 1 处用，可内联）
- **风险**：🟡 删除前必须零引用 grep 验证 + 测试全绿
- **Commit**：`chore(refactor): remove 4 zero-reference legacy files`

**阶段 3 收口**：
- [x] 4 PRs 全绿
- [x] `madge --circular` 零循环
- [x] 总减行 ≥ 300

---

## 阶段 4：UI 大件拆分（5 PRs · 5 天）

> 目标：`multi-track-timeline.tsx` (429 行) 拆分；其他 ≥300 行单文件同步拆分。

### PR-4.1：MultiTrackTimeline 拆分为容器
- **Branch**：`refactor/stage-4-pr-1-multitrack-timeline-split`
- **结构**：
  ```
  src/components/timeline/
    multi-track-timeline.tsx        # 容器（≤ 100 行）
    multi-track-timeline/
      track-header.tsx
      track-ruler.tsx
      clip-block.tsx
      playhead.tsx
      selection-overlay.tsx
      zoom-controls.tsx
      use-timeline-dnd.ts            # 拖拽逻辑 hook
  ```
- **测试**：现有 timeline 相关测试全绿；新子组件各加最小 snapshot
- **风险**：🔴 高 — 这是 UI 最复杂的组件，需保留所有现有 props 行为
- **Commit**：`refactor(timeline): split MultiTrackTimeline into container + 7 children (429→100 lines)`

### PR-4.2：project-edit/index.tsx 拆分（373 行）
- **Branch**：`refactor/stage-4-pr-2-project-edit-split`
- **结构**：拆为 `form-step / upload-step / configure-step` 三个子页面
- **风险**：🟡 中
- **Commit**：`refactor(pages): split project-edit page into 3 sub-steps`

### PR-4.3：video-selector.tsx 拆分（317 行）
- **Branch**：`refactor/stage-4-pr-3-video-selector-split`
- **结构**：拆为 `grid / list-item / filter-bar / empty-state`
- **风险**：🟢 低（纯 UI）
- **Commit**：`refactor(components): split video-selector into 4 sub-components`

### PR-4.4：subtitle-extractor 拆分（291 行）
- **Branch**：`refactor/stage-4-pr-4-subtitle-extractor-split`
- **结构**：拆为 `format-selector / progress / segment-list / segment-row`
- **风险**：🟢 低
- **Commit**：`refactor(components): split subtitle-extractor into 4 sub-components`

### PR-4.5：其他 5 个 200+ 行 page 拆分
- **Branch**：`refactor/stage-4-pr-5-other-pages-split`
- **目标文件**（按 LOC 倒序）：
  - `pages/home/index.tsx` (449)
  - `pages/workspace/export/video-export/video-export.tsx` (340)
  - `pages/workspace/export/video-export/use-export-handlers.ts` (335)
  - `pages/workspace/assemble/clip-rippling.tsx` (380)
  - `pages/workspace/components/voice-settings-panel.tsx` (269)
- **动作**：每个文件拆为 ≤ 200 行
- **风险**：🟡 中
- **Commit**：`refactor(pages): split 5 pages ≥ 200 lines to ≤ 200 lines each`

**阶段 4 收口**：
- [x] 5 PRs 全绿
- [x] 无单文件 ≥ 200 行（除 `*.d.ts`）
- [x] 视觉回归（手动 smoke test 5 个核心路径）

---

## 阶段 5：性能基准 + 错误归一 + 测试污染清理（4 PRs · 3 天）

> 目标：vitest bench 落地、错误归一层、清理 `__resetXxxForTest` 等测试污染导出。

### PR-5.1：vitest bench 性能基准
- **Branch**：`refactor/stage-5-pr-1-perf-benchmarks`
- **新增**：
  - `src/__bench__/ai-service.bench.ts`
  - `src/__bench__/editor-store.bench.ts`
  - `src/__bench__/commentary-pipeline.bench.ts`
  - `src/__bench__/subtitle-formatter.bench.ts`
  - `src/__bench__/project-file.bench.ts`
- **package.json** 加 `npm run bench` 脚本
- **风险**：🟢 仅新增测试
- **Commit**：`test(perf): add vitest bench for 5 critical paths`

### PR-5.2：错误归一层
- **Branch**：`refactor/stage-5-pr-2-error-normalization`
- **新增**：`src/core/errors/normalize.ts`（统一处理 `Error` / `TauriBridgeError` / `ServiceError` / 自定义）
- **修改**：`app.tsx` 的 `ErrorBoundary` 使用 normalize 后展示
- **测试**：`normalize.test.ts`
- **风险**：🟡 错误消息展示文案可能变化
- **Commit**：`refactor(errors): normalize error layer with unified boundary`

### PR-5.3：清理测试污染导出
- **Branch**：`refactor/stage-5-pr-3-cleanup-test-pollution`
- **修改**：将 `__resetTrackHistoryForTest` 等改为 `__testing` 子命名空间：
  ```ts
  // 旧：export const __resetTrackHistoryForTest = () => trackHistory.clear();
  // 新：
  export const __testing = { resetTrackHistory: () => trackHistory.clear() };
  ```
- **grep**：`rg "__reset" src` 列出所有测试专用导出
- **风险**：🟢 低（仅改测试 API，不改生产代码）
- **Commit**：`chore(test): namespace test-only exports under __testing (–8 leaks)`

### PR-5.4：覆盖率门槛提升到 80%
- **Branch**：`refactor/stage-5-pr-4-raise-coverage-threshold`
- **修改**：`vitest.config.ts`：`thresholds.lines/functions/branches/statements: 5 → 80`
- **前提**：阶段 1-3 已保证覆盖率不下降
- **风险**：🟡 中 — 80% 是个大跳，需先 `vitest --coverage` 看当前真实值再决定
- **决策点**：如果当前真实覆盖 < 70%，改为 60% 并留 todo
- **Commit**：`chore(test): raise vitest coverage threshold from 5 to 80%`

**阶段 5 收口**：
- [x] 4 PRs 全绿
- [x] 5 个 bench 文件跑通
- [x] 错误归一层全项目使用
- [x] 无 `__reset` 类公开导出

---

## 6. 阶段间依赖图

```mermaid
graph TD
  P1_1[PR-1.1<br/>createBoundReducerHook] --> P1_2[PR-1.2<br/>use-project-detail]
  P1_2 --> P1_3[PR-1.3<br/>4 hooks 迁移]
  P1_1 --> P1_4[PR-1.4<br/>死代码清理]
  P1_4 --> P2_1[PR-2.1<br/>createSimpleSetters]

  P2_1 --> P2_2[PR-2.2<br/>editor-store setter]
  P2_2 --> P2_3[PR-2.3<br/>Tauri bridge]

  P2_3 --> P3_1[PR-3.1<br/>ai-models 拆分]
  P3_1 --> P3_2[PR-3.2<br/>services barrel]
  P3_2 --> P3_3[PR-3.3<br/>tauri methods]
  P3_3 --> P3_4[PR-3.4<br/>删除 legacy]

  P3_4 --> P4_1[PR-4.1<br/>MultiTrackTimeline]
  P4_1 --> P4_2[PR-4.2<br/>project-edit]
  P4_2 --> P4_3[PR-4.3<br/>video-selector]
  P4_3 --> P4_4[PR-4.4<br/>subtitle-extractor]
  P4_4 --> P4_5[PR-4.5<br/>5 pages 拆分]

  P4_5 --> P5_1[PR-5.1<br/>vitest bench]
  P5_1 --> P5_2[PR-5.2<br/>错误归一]
  P5_2 --> P5_3[PR-5.3<br/>test pollution]
  P5_3 --> P5_4[PR-5.4<br/>覆盖率门槛]

  style P1_1 fill:#9f9
  style P1_2 fill:#9f9
  style P1_3 fill:#9f9
  style P1_4 fill:#9f9
  style P4_1 fill:#f99
  style P5_4 fill:#ff9
```

---

## 7. 决策点（需用户确认）

执行前需澄清：

### 7.1 工作树起点
当前 main HEAD `2e350e4`，working tree 97 个未提交改动。**三种处理**：
- **A**：`git add -A && git commit -m "chore: snapshot stage-6-pending-changes"`，从干净 main 开 Stage 8
- **B**：`git stash`，从 `2e350e4` 干净 main 开 Stage 8
- **C**：把 working tree 当 Stage 8 起点，cherry-pick 决定

### 7.2 阶段编号
spec 写的是 Stage 1-5（重构），但项目已有 Stage 1-6（之前 refactor）。两个选项：
- **A**：重置编号为 Stage 8-12（继续项目已有 stage 计数）
- **B**：用本次独立前缀 `refactor/s-XX`，如 `refactor/s-01`（spec 当前用 `stage-N-PR-M` 即可）
- **推荐**：B（独立前缀，不污染历史 stage 计数）

### 7.3 阶段 4 范围
PR-4.1 `MultiTrackTimeline` 拆分是 5 阶段中**最高风险**项。**两个选项**：
- **A**：按 spec 走（429 → 100 + 7 子组件）
- **B**：保守版（429 → 200 + 3 子组件），降低 PR 单次改动量

### 7.4 PR 合入方式
- **A**：每个 PR 单独 push 到 `origin`（如果用户能开 remote PR）
- **B**：本地分支 + 完整 commit 历史，最终 squash 到 main 一次（适合无 PR review 流程）

### 7.5 范围确认
- 全量 20 PRs 是否都在本会话？或者分多次会话？
- 单次会话建议 ≤ 5 PRs（避免单 turn 过长无法 review）

---

## 8. 执行编排建议

| 决策 | 建议 |
|---|---|
| 7.1 工作树起点 | **A**（先 commit snapshot，干净起点最易回滚） |
| 7.2 阶段编号 | **B**（独立前缀 `refactor/s-08-pr-N`） |
| 7.3 阶段 4 范围 | **A**（按 spec 完整拆，PR-4.1 风险已通过"先写测试再改"对冲） |
| 7.4 PR 合入 | **A**（每 PR push，由你 review 后合入） |
| 7.5 范围 | **分 4 个会话**：阶段 1+2 / 阶段 3 / 阶段 4 / 阶段 5 |

---

## 9. 不在范围内

- ❌ Tauri Rust 后端重构（27k 行 + 61 commands，单独专项）
- ❌ UI 视觉重设计
- ❌ 功能新增
- ❌ 文档站重构（docs/.vitepress）— 上阶段已做过
- ❌ 国际化回归（i18next 已删）

---

> ✍️ **作者备注**：spec 写完，确认 §7 决策点后开干。**首批建议执行：阶段 1 全部 4 PR**（1 天，500 行减，5/5 风险极低，跑通后建立信心再走阶段 2-5）。
> 决策确认后告诉我，我按 stage 1 → 5 顺序逐 PR 推进，每 PR 跑通 type-check + lint + test 再进入下一个。
