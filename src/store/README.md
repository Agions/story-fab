# src/store/ — Zustand State Stores

> **架构决策 ADR-102**：4 个 store 严格**单向依赖**（appStore → projectStore → editorStore → timelineStore），modelStore 平行独立。

## 状态依赖图

```
              ┌──────────────┐
              │   appStore   │  全局 (用户/主题/通知)
              └──────┬───────┘
                     │ (读 user / push notify)
                     ▼
              ┌──────────────┐
              │ projectStore │  项目列表 + 当前项目
              └──────┬───────┘
                     │ (currentProject 切换)
                     ▼
              ┌──────────────┐         ┌──────────────┐
              │  editorStore │ ──────▶ │ timelineStore│  (timeline = editor 子状态)
              └──────────────┘         └──────────────┘
                     ▲
                     │
              ┌──────────────┐
              │  modelStore  │  AI 模型 (平行 store)
              └──────────────┘
```

## Store 清单

| Store | 持久化 | 主要字段 | 边界 |
|---|---|---|---|
| `appStore` | ✓ (zustand/persist) | user / theme / notifications / settings / autoSave | 全局只读 |
| `projectStore` | ✓ | projects[] / currentProject / sortBy / filter | 业务核心 |
| `editorStore` | ✗ | editor state (clip selection / cursor / mode) | editor 内部 |
| `timelineStore` | ✗ | tracks[] / clips[] / playhead | editor 子状态 |
| `modelStore` | ✓ | selectedAIModel / aiModelsSettings | 平行独立 |

## 单向依赖规则

✅ **允许**：
- `appStore` 被任意 store / 组件读取
- `projectStore` 读 `appStore`，被 `editorStore` 读取
- `editorStore` 读 `appStore + projectStore + modelStore`
- `timelineStore` 读 `editorStore`（视作 editor 的子状态）
- `modelStore` 平行存在，可被任意 store 读取

❌ **禁止**（ESLint 报错）：
- `appStore` 引用 `projectStore`（全局不该依赖业务）
- `projectStore` 引用 `editorStore`（避免循环）
- `editorStore` 写 `projectStore`（单向数据流）
- `timelineStore` 引用 `projectStore`（应该通过 editor）

## 跨 store 通信

✅ **推荐**：通过 hook 选择性订阅
```ts
// 组件内
const user = useAppStore((s) => s.user);
const project = useProjectStore((s) => s.currentProject);
```

⚠️ **可接受**：通过 `getState()` 在 action 内部读取
```ts
useProjectStore.getState().setLoading(true);
```

❌ **禁止**：A store 的 setter 写 B store（应通过事件/回调）

## 修复记录 (v2.1)

- ✅ `modelStore.ts` 类型错位修复：`AppState` → `AIModelState`，并 export interface

详见 [docs/dev/architecture.md §双服务层 (ADR-101)](../../docs/dev/architecture.md)
