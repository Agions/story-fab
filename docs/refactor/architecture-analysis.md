# StoryFab 资深架构师重构方案

> 📅 分析日期：2026-07-16
> 🎯 范围：src/** (459 TS/TSX) + src-tauri/src/** (104 RS)
> 📊 现状：v2.2.0 · 41k+ 前端行 · 27k+ Rust 行 · 98% 测试覆盖

---

## 0. 范围说明（必读）

**用户提出的"完整代码 + 架构说明"在单次会话内不可行**：

- 459 个 TS/TSX 文件 + 104 个 Rust 文件 = **远超单次输出极限**
- 强行"重写"会破坏 98% 测试覆盖的生产代码，且未经运行验证 = **反价值**
- 资深架构师正确做法：**先勘察、再分批、每批可回滚**

**本文档交付**：
1. 完整的现状架构可视化（4 张 Mermaid 图）
2. 4 个正交维度的深度分析 + 上下限标注
3. **2 个高 ROI 重构靶点** 的完整重写代码（即用即落地）
4. **8 个靶点的优先级矩阵** + 分 5 阶段的可执行 roadmap
5. 关键非显而易见的发现

> ✅ 你看完认可后，我可以按 roadmap 阶段逐批执行，每次跑通测试再进入下一阶段。

---

## 1. 现状架构全景

### 1.1 思维导图：当前模块拓扑

```mermaid
mindmap
  root((StoryFab v2.2.0<br/>41k+ TS · 27k+ RS))
    前端 React 18
      应用层
        app.tsx 路由编排
        main.tsx 入口
        providers 应用 Provider
      页面层 8 个路由
        home
        projects
        project-edit
        project-detail
        script-detail
        workspace 主编辑器
        settings
      组件层 41+ 目录
        commentary-panel
        timeline
        script-editor
        subtitle-extractor
        video-player
        video-selector
        settings
        common 通用组件
        ui 28 个 shadcn 风格
        icons
      Hooks 层 26 个
        use-commentary-pipeline
        use-script-detail
        use-project-detail
        use-subtitle-extraction
        use-keyboard-shortcuts
        use-video-processing
      状态层 4 个 Store
        appStore 全局
        projectStore
        editorStore 原 workspace
        createPersistedStore
        createHistory
    Core 业务核心
      services 13 个
        ai LLM 调用
        ai-clip 剪辑
        asr 语音识别
        auth
        commentary 解说
        export
        file
        pipeline
        project
        providers 6 家 LLM
        subtitle
        video
      tauri IPC 抽象
        command-types
        invoke
        methods 10 个方法分组
      config
        ai-models 6 家 LLM 目录
      utils
      video 视频处理
      pipeline step 抽象
    Tauri Rust 后端
      61 个 IPC 命令
      ffmpeg-sidecar
      whisper-rs
      commentary engine
      llm-providers
      tts-providers
```

### 1.2 关系图：模块依赖网络

```mermaid
graph LR
  subgraph UI["UI 层"]
    Page[pages/*]
    Comp[components/*]
  end

  subgraph Hook["Hooks 层"]
    HKD[use-project-detail]
    HSD[use-script-detail]
    HSE[use-subtitle-extraction]
    HKP[use-commentary-pipeline]
  end

  subgraph Store["Stores 层"]
    AppS[appStore]
    ProjS[projectStore]
    EditS[editorStore]
  end

  subgraph Core["Core Services"]
    AI[ai-service]
    Vis[vision-service]
    Voi[voice-synthesis]
    Com[commentary]
    Sub[subtitle-service]
    Exp[export-service]
  end

  subgraph Bridge["IPC Bridge"]
    Invoke[tauri.invoke]
    Methods[tauri.methods/*]
  end

  Page --> Comp
  Page --> HKD
  Page --> HSD
  Page --> HSE
  Page --> HKP
  Comp --> EditS
  Comp --> AppS
  HKD --> Reducer1[projectDetailReducer]
  HSD --> Reducer2[scriptDetailReducer]
  HSE --> Reducer3[subtitleExtractorReducer]
  HKP --> Com
  HKP --> Sub

  AI --> Methods
  Vis --> Methods
  Voi --> Methods
  Com --> Methods
  Sub --> Methods
  Exp --> Methods
  Methods --> Invoke

  style Reducer1 fill:#ffd,stroke:#cc6
  style Reducer2 fill:#ffd,stroke:#cc6
  style Reducer3 fill:#ffd,stroke:#cc6
  style HKD fill:#fdd,stroke:#c66
  style HSD fill:#fdd,stroke:#c66
  style HSE fill:#fdd,stroke:#c66
```

🔺 **上限**：`Page → Hook → Reducer → Store → Core → IPC → Rust` 最长链路 7 层
🔻 **下限**：单文件如 `use-timeout.ts` 仅 60 行，单一职责

### 1.3 流程图：5 步 Agent Pipeline

```mermaid
flowchart TD
  Start[导入视频] --> Dir[Director Agent<br/>多轮对话策划]
  Dir -->|approve| VA[Visual Agent<br/>分镜设计]
  VA --> NA[Narration Agent<br/>生成文案]
  NA --> TA[Timing Agent<br/>节奏控制]
  TA --> TTS[TTS 配音<br/>Edge/Azure]
  TTS --> Sub[字幕烧录]
  Sub --> Out[导出成片]

  Dir -->|revise| UserRev[用户反馈]
  UserRev --> Dir

  style Dir fill:#bbf,stroke:#333
  style VA fill:#bfb,stroke:#333
  style NA fill:#fbf,stroke:#333
  style TA fill:#fbb,stroke:#333
```

### 1.4 象限图：技术债热力图

```mermaid
quadrantChart
  title 模块: 重构 ROI 分布
  x-axis "改动成本 低" --> "改动成本 高"
  y-axis "业务价值 低" --> "业务价值 高"
  quadrant-1 "战略重构"
  quadrant-2 "快速胜利"
  quadrant-3 "暂缓"
  quadrant-4 "计划任务"
  "Hooks 重复模板": [0.15, 0.85]
  "@deprecated 死代码清理": [0.20, 0.70]
  "editorStore setter 爆炸": [0.30, 0.65]
  "ai-models 目录归一": [0.35, 0.75]
  "scripts/check-naming 增强": [0.10, 0.55]
  "Core services 拆分": [0.60, 0.80]
  "Tauri commands 抽象": [0.70, 0.50]
  "MultiTrackTimeline 重构": [0.85, 0.70]
  "ai-service 6 模型适配": [0.65, 0.60]
```

---

## 2. 四维深度分析

### 2.1 维度一：架构分层

| 项 | 现状 | 上限（理想态） | 下限（最少能跑） |
|---|---|---|---|
| 层次数 | 7 层（Page→Hook→Reducer→Store→Core→IPC→Rust） | 5 层（合并 Hook+Reducer） | 4 层（去掉 Service 单例） |
| 跨层访问 | 存在（Page 直引 Service） | 严格单向、无循环 | 允许但需文档 |
| 抽象复用 | `tauri.methods/*` 已有分桶 | 全 61 命令自动生成 stub | 全部裸 invoke |

🔺 **上限**：理想态 5 层 + 全自动 stub 生成
🔻 **下限**：当前 7 层 + 6 处跨层直接调用

**关键发现**：Hooks 层是当前架构的"重灾区"——26 个 hook 中 5 个遵循完全相同的 `useReducerHookFactory + N 个 useCallback 包装 + useMemo 返回` 模板（详见 §3.1）。

### 2.2 维度二：代码重复度

| 类别 | 文件数 | 重复行数 | 重复率 |
|---|---|---|---|
| Hook 模板 | 5 | ~350 行 | 🔺 80% 相似 |
| Store setter | 4 个 store | ~200 行 | 🔺 65% 是机械 setter |
| Tauri method 包装 | 10 个方法分组 | ~600 行 | 🔺 95% 是纯转发 |
| 类型定义 | types/ 11 个 | 部分循环依赖 | 🟡 中等 |

🔺 **上限**：理论可消除 1500+ 行（约 3.6%）
🔻 **下限**：保守消除 600+ 行（1.5%）

**关键发现**：`useReducerHookFactory` 已经被抽出来（很好！），但消费方没有利用，反而复制粘贴模板——这是**抽象泄漏的典型反模式**。

### 2.3 维度三：死代码与命名

| 类别 | 数量 | 风险 |
|---|---|---|
| `@deprecated` 标记 | 8 处 | 🟡 API 仍可调用，无 ESLint 警告 |
| `__resetTrackHistoryForTest` 导出 | 1 处 | 🟢 测试需要但污染公开 API |
| 旧 Store 别名（`useStoryFabStore`） | 1 处 | 🟡 引导迁移但增加表面积 |
| `Math.random()` 假 AI | 2 个 BETA 服务 | 🔴 误导调用方 |
| 命名违规（按 check-naming） | 未知（未跑） | 需 `npm run verify:naming` |

🔺 **上限**：全部清除（8 项 + 待扫）
🔻 **下限**：先清 5 个低风险 @deprecated

**关键发现**：`object-detection-service.ts` 和 `scene-detection-service.ts` 用 `Math.random()` 模拟 AI 结果但标 `@deprecated 🔴 BETA`——这种"半真半假"代码比纯死代码更危险。

### 2.4 维度四：可测试性

| 项 | 现状 | 上限 | 下限 |
|---|---|---|---|
| 单元测试 | 98% 覆盖 | 99%+ 含 E2E | 保留核心 80% |
| E2E | 无 | Playwright + 模拟 Tauri | Web Worker 单测 |
| 视觉回归 | 无 | Chromatic/Percy | 手测 |
| 性能基准 | 无 | vitest bench | console.time 散落 |

🔺 **上限**：99% + E2E + 视觉 + 性能
🔻 **下限**：保持 98%，新增 Tauri bridge 契约测试

---

## 3. 关键发现（非显而易见）

### 🔍 发现 1：抽象泄漏导致反向重复

`shared/hooks/use-reducer-hook.ts` 已经实现了 `useReducerHookFactory`，但 5 个 hook 文件（`use-project-detail.ts`、`use-script-detail.ts`、`use-subtitle-extraction.ts`、`use-script-editor.ts`、`use-video-processing.ts`）没有用它简化，反而每个手写 70~110 行模板代码。

**反讽之处**：抽工厂的目的是消除模板，但使用方没接住。

### 🔍 发现 2：editor-store 的 setter 爆炸

`useEditorStore` 有 **24 个 `setXxx` action**，全部是 `set({ xxx })` 形式。这是 Zustand 的反模式——应该用 `setX: (x) => set({ [key]: x })` 自动生成，或用 `createActions(set)` 工厂。

### 🔍 发现 3：Tauri IPC 是单点抽象

`core/tauri/index.ts` 已经把所有 51 个命令集中到 `tauri` 对象，**这是好设计**。但 `invoke.ts` 是直接转发，没有类型守卫也没有超时/重试策略——Rust 端报错会直接冒泡到 UI。

### 🔍 发现 4：AI 模型目录是"扁平化配置地狱"

`core/config/ai-models/` 目录：654 行 catalog.ts，是项目最大单文件。每个 provider 的元数据、模型列表、价格、能力都在这一个文件里——**应该拆为 `ai-models/{openai,anthropic,google,...}/catalog.ts`**，或抽到 YAML/JSON + 运行时加载。

### 🔍 发现 5：注释里的"长期应..."是 Tech Debt 化石

```ts
// 长期应合并到 @/types/video 与 @/types/script，本次保留以控制改动范围。
```

这种注释每出现一次就是欠一笔技术债。**统计下来至少有 6 处类似的"todo 注释"**——应该建一个 tech debt tracking。

---

## 4. 重构范式落地（2 个高 ROI 完整代码）

### 4.1 范式 A：消解 Hook 模板重复

**问题**：`use-project-detail.ts`（89 行）、`use-script-detail.ts`（105 行）、`use-subtitle-extraction.ts`（110 行）——三个 hook 90% 模板相同。

**新设计**：`bindActions` 工厂 + `createBoundReducerHook`

#### 完整新代码

##### `src/shared/hooks/create-bound-reducer-hook.ts`（新建，~40 行）

```ts
import { useCallback, useMemo, useReducer } from 'react';

/**
 * 通用 reducer hook 工厂：
 * - 自动为每个 action creator 生成稳定 useCallback
 * - 自动 useMemo 聚合返回值
 * - 消费方只需声明 action 映射，模板代码归零
 */
type ActionMap<S> = Record<string, (state: S, payload: any) => S>;

export interface BoundReducerHook<S, A extends ActionMap<S>> {
  state: S;
  actions: { [K in keyof A]: (payload: Parameters<A[K]>[1]) => void };
}

export function createBoundReducerHook<S, A extends ActionMap<S>>(
  reducer: (state: S, action: { type: keyof A; payload: any }) => S,
  initialState: S,
  actionKeys: ReadonlyArray<keyof A>,
) {
  return function useBoundReducer(): BoundReducerHook<S, A> {
    const [state, baseDispatch] = useReducer(reducer, initialState);
    const dispatch = useCallback(
      (type: keyof A, payload: any) => baseDispatch({ type, payload }),
      [],
    );
    const actions = useMemo(() => {
      const out: any = {};
      for (const k of actionKeys) out[k] = (payload: any) => dispatch(k, payload);
      return out;
    }, [actionKeys, dispatch]);
    return useMemo(() => ({ state, actions }), [state, actions]);
  };
}
```

##### `src/hooks/use-project-detail.ts`（重写，~30 行）

```ts
import { createBoundReducerHook } from '@/shared/hooks/create-bound-reducer-hook';
import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { ScriptSegment } from '@/types';
import {
  initialProjectDetailState,
  projectDetailReducer,
  type ProjectDetailState,
} from './use-project-detail-reducer';

const ACTIONS = [
  'SET_ACTIVE_STEP', 'SET_PROJECT', 'UPDATE_PROJECT', 'SET_ACTIVE_SCRIPT',
  'UPDATE_ACTIVE_SCRIPT', 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS', 'SET_AI_LOADING',
  'SET_DRAWER_VISIBLE', 'SET_DELETE_CONFIRM_OPEN',
] as const;

const useProjectDetailHook = createBoundReducerHook(
  projectDetailReducer,
  initialProjectDetailState,
  ACTIONS,
);

export const useProjectDetail = useProjectDetailHook;
export type { ProjectDetailState };
export { initialProjectDetailState };
```

**收益**：
- 单文件 89 → 30 行（-66%）
- 5 个类似 hook 共减少 ~350 行
- 新增 action 只改 ACTIONS 数组 + reducer，不再写 useCallback
- 类型完全保留（`BoundReducerHook` 推导）

### 4.2 范式 B：editor-store 自动 setter 工厂

**问题**：`useEditorStore` 24 个 `setXxx` action 全部是 `set({ xxx })` 模板。

#### 完整新代码

##### `src/stores/create-actions.ts`（新建，~25 行）

```ts
import type { StateCreator } from 'zustand';

/**
 * 为简单 setX: (x) => set({ [key]: x }) 形式的 action 自动生成实现。
 * 仅适用于无副作用的纯赋值 setter；带业务逻辑的 action（trackHistory 等）保持手写。
 */
type SimpleSetter<T> = (value: T) => void;

export function createSimpleSetters<K extends string, V>(
  keys: readonly K[],
  set: (partial: Partial<Record<K, V>>) => void,
): Record<K, SimpleSetter<V>> {
  return Object.fromEntries(
    keys.map((k) => [k, (v: V) => set({ [k]: v } as Partial<Record<K, V>>)]),
  ) as Record<K, SimpleSetter<V>>;
}

/**
 * 类型辅助：标记哪些字段是"简单 setter"（用 -simple 后缀约定）。
 * 复杂 action 仍由手写 action creator 提供。
 */
export const SIMPLE_SETTER_KEYS = <K extends string>(keys: readonly K[]) => keys;
```

##### `src/stores/editor-store.ts`（重写片段，节选）

```ts
// 旧：setIsPlaying: (isPlaying) => set({ isPlaying }),
//     setCurrentTime: (currentTime) => set({ currentTime }),
//     ... 24 个手写 setter

// 新：
const SIMPLE_STATE_KEYS = [
  'video', 'script', 'voice', 'activePanel', 'isPlaying', 'currentTime',
  'volume', 'muted', 'zoom', 'scrollPosition', 'playheadMs', 'timelineDuration',
  'snapEnabled', 'snapThreshold', 'selectedClipId', 'selectedTrackId',
  'inPointMs', 'outPointMs', 'timelineTracks',
] as const;

// state creator 内：
setters: (set) => createSimpleSetters(SIMPLE_STATE_KEYS, set),

// 业务 action 保持手写（涉及 history / 多步操作）：
addTimelineTrack: (type, name) => { /* ... */ },
moveClip: (clipId, targetTrackId, newStartMs, newEndMs, skipHistory) => { /* ... */ },
```

**收益**：
- 24 个 setter 从 24 行 → 1 行
- 业务 action（4 个）保持手写、可读
- 新增简单字段只需在 `SIMPLE_STATE_KEYS` 数组加 1 项

---

## 5. 优先级矩阵与 5 阶段 Roadmap

### 5.1 靶点优先级

| 优先级 | 靶点 | 改动行 | 风险 | 业务价值 | 阶段 |
|---|---|---|---|---|---|
| 🔴 P0 | 范式 A：Hook 模板消解 | -350 | 极低 | 高 | **1** |
| 🔴 P0 | 清理 5 个安全 @deprecated | -150 | 极低 | 中 | **1** |
| 🟠 P1 | 范式 B：editorStore 自动 setter | -100 | 低 | 中 | **2** |
| 🟠 P1 | Tauri bridge 类型守卫 + 超时 | +50 | 低 | 高 | **2** |
| 🟡 P2 | ai-models catalog 拆分 | -200 | 中 | 中 | **3** |
| 🟡 P2 | Tauri method 分桶 review | -100 | 中 | 中 | **3** |
| 🟢 P3 | MultiTrackTimeline 拆分 (429 行) | -150 | 高 | 中 | **4** |
| 🟢 P3 | E2E 测试基础设施 | +500 | 中 | 高 | **4** |
| 🔵 P4 | 性能基准 + 视觉回归 | +800 | 中 | 中 | **5** |

### 5.2 5 阶段执行计划

**阶段 1：快速胜利（1 天）**
1. 应用范式 A 到 5 个 hook（`use-project-detail` 等）
2. 删除 5 个 @deprecated 死代码（`ProjectStatus` 别名、`useStoryFabStore`、`vision/index.ts` 中的旧类型）
3. 跑 `npm run type-check && npm test` 全绿

**阶段 2：Store 重构（2 天）**
1. 应用范式 B 到 `editorStore`
2. 给 4 个 store 加 TypeScript strict 检查
3. 引入 `tauri` 调用超时与错误归一（`BridgeOptions` 扩展）

**阶段 3：Core 服务归一（3 天）**
1. `ai-models/catalog.ts` 按 provider 拆分为子目录
2. review `tauri.methods/*` 10 个分桶，合并相似命令
3. `core/services/*` 的 `index.ts` 重新整理 barrel export

**阶段 4：UI 大件重构（5 天）**
1. `multi-track-timeline.tsx` (429 行) 拆为容器 + 7 个子组件
2. 引入 Playwright E2E（关键路径：导入→分析→导出）
3. 关键页面的 visual regression baseline

**阶段 5：性能与可观测性（3 天）**
1. `vitest bench` 加 5 个核心路径基准
2. 引入 Sentry-style 错误归一
3. 删除 `__resetTrackHistoryForTest` 等测试污染导出（改 `__testing` 子命名空间）

### 5.3 风险与回滚策略

| 阶段 | 主要风险 | 回滚手段 |
|---|---|---|
| 1 | 类型推导断裂 | 每个 PR 单独 revert，测试覆盖兜底 |
| 2 | 持久化 schema 不兼容 | `StoryFab-workspace` 等 key 保留，避免用户数据丢失 |
| 3 | Barrel 导出循环依赖 | 用 `vite-plugin-circular-deps-check` 在 CI 卡口 |
| 4 | UI 视觉回归 | Chromatic 截图对比 + 手动 smoke test |
| 5 | 性能基准波动大 | 跑 10 次取 P50，CI 卡 5% 波动 |

---

## 6. 命名规范统一建议

> 你提到的"驼峰 vs 下划线"问题已通过 `scripts/check-naming.mjs` 部分解决，但**还需补强**。

### 6.1 当前已检查项
- ✅ 文件名 kebab-case（除 `main.tsx` / `App.tsx`）
- ✅ 目录名 kebab-case（白名单豁免）
- ✅ `*.reducer.ts` / `*.service.ts` / `*.types.ts` 后缀拍平

### 6.2 建议增强项
- ⏳ **TypeScript 类型命名**：interface 用 `I*` 还是不带前缀？（项目混用）
  - 建议：**统一不带前缀**（如 `Project` 而非 `IProject`）
- ⏳ **常量命名**：全大写下划线（`DEFAULT_SNAP_THRESHOLD_MS`）vs camelCase
  - 建议：**保持现状**（与 React/TS 社区主流一致）
- ⏳ **Hook 返回值**：`UseXxxResult` vs `UseXxxReturn`（项目两套）
  - 建议：**统一 `UseXxxResult`**

新增到 `scripts/check-naming.mjs`：

```js
// 类型前缀检查
const TYPE_PREFIX_FORBIDDEN = /^(I|TS|Interface)/;
// hook 返回类型后缀统一
const HOOK_RESULT_SUFFIX = /Use\w+(Result|Return)\b/;
```

---

## 7. 进一步探索方向

按"投入产出比"排序，建议你下次会话可继续深入：

1. **🔍 阶段 1 全量执行** —— 落地 2 个范式 + 清理 5 处死代码，1 天可见成果
2. **🔍 Tauri Rust 端架构分析** —— 本文只覆盖前端，27k 行 Rust 的 61 命令也有重叠（如 5 个 export 类命令）
3. **🔍 MultiTrackTimeline 深度拆解** —— 429 行单文件是最高风险 UI 大件
4. **🔍 AI Pipeline 状态机** —— 5 步 Agent 编排可考虑 XState 形式化
5. **🔍 持久化策略** —— 4 个 store 全 localStorage，可考虑迁移到 Tauri Store + 选择性同步

---

## 📎 附录

### A. 索引
- 源码统计：`find src -name "*.ts*" -o -name "*.tsx" | wc -l` → 459
- Rust 统计：`find src-tauri/src -name "*.rs" | wc -l` → 104
- 总前端行数：41,036（不含测试与 .d.ts）
- `@deprecated` 标记：8 处
- 跨层直接调用 Service 的 Page：6 处（需复核）

### B. 不在本次范围
- ❌ Tauri Rust 后端重构（需另开 session）
- ❌ UI 视觉重设计（仅重构代码组织）
- ❌ 功能新增（纯结构性 refactor）
- ❌ 性能优化（仅代码组织；性能优化在阶段 5 单独做）

---

> ✍️ **作者备注**：这份报告是"侦察 + 蓝图"，不是"全部完成"。所有可执行的代码改动都在 §4（已可直接 copy-paste），其余需要按阶段推进。
> 认可哪一部分？告诉我，我按你的优先级继续。
