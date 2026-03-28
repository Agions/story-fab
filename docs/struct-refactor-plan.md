# StoryForge 类型系统重构方案

> 状态：待执行 | 优先级：高 | 影响范围：全项目

---

## 当前类型系统问题

```
src/
├── types/index.ts          ← 自身有类型 + 引用 core/types（循环风险）
├── core/types.ts            ← 真正的 canonical types（Project 等）
└── core/types/index.ts     ← 简单 re-export from './types'
```

### 循环依赖风险

`src/types/index.ts` 导入 `@/core/types`（`src/core/types.ts`）
如果 `src/core/types.ts` 反向导入 `src/types`，则形成循环。

---

## 重构目标

```
src/
├── types/                   ← canonical 位置
│   ├── index.ts             ← 统一导出所有类型
│   ├── project.types.ts     ← Project 相关类型
│   ├── video.types.ts       ← VideoProject 相关类型
│   ├── editor.types.ts      ← 编辑器类型
│   ├── workflow.types.ts    ← 工作流类型
│   └── ai.types.ts          ← AI 模型相关类型
└── core/types/
    └── index.ts             ← re-export from '@/types'（向后兼容）
       ⚠️ DEPRECATED: 请直接 import from '@/types'
```

---

## 执行步骤

### Step 1：创建 `src/types/index.ts`（统一版）

合并以下内容：
- `src/types/index.ts` 原有类型（VideoAnalysis, KeyMoment, Emotion, Script 等）
- `src/core/types.ts` 全部类型（Project, ProjectSettings, AIModel 等）

### Step 2：更新 `src/core/types/index.ts`

```typescript
/**
 * @deprecated
 * 请直接 import from '@/types'
 * 此文件仅用于向后兼容旧引用路径
 */
export * from '@/types';
```

### Step 3：更新 `src/core/types.ts`

```typescript
/**
 * @deprecated 请使用 '@/types'
 * 类型已迁移至 src/types/index.ts
 */
export * from '@/types';
```

### Step 4：用 codemod 批量更新导入（可选）

```bash
npx jscodeshift -t \
  --extensions=ts,tsx \
  --parser=typescript \
  --import-options=absolute \
  'src/**/*.{ts,tsx}' \
  -e 's/@/core\/types/@/types/g'
```

---

## 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 重写 | `src/types/index.ts` | 合并所有类型 |
| 更新 | `src/core/types/index.ts` | re-export from '@/types' |
| 废弃 | `src/core/types.ts` | export * from '@/types' |
| 删除 | `src/shared/types/index.ts` | 空壳文件，统一到 '@/types' |

---

## 命名规范（Types 目录）

| 文件 | 内容 |
|------|------|
| `types/project.types.ts` | Project, ProjectStatus, ProjectSettings |
| `types/video.types.ts` | VideoProject, VideoAnalysis, KeyMoment, Emotion |
| `types/editor.types.ts` | Timeline, Track, Segment 相关 |
| `types/workflow.types.ts` | WorkflowStep, WorkflowState, WorkflowResult |
| `types/ai.types.ts` | AIModel, AIModelSettings, AIModelConfig |
| `types/index.ts` | 统一导出 |

---

*执行时间估算：30 分钟（含 codemod 批量更新）*
