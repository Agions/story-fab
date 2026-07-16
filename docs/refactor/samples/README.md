# 重构范式示例

> 本目录是 §4 章节的可运行代码样本。**不要直接 import 到生产** — 等你确认应用后我会按阶段 1 实际落地并跑测试。

## 文件清单

| 文件 | 用途 | 落地位置（建议） | 预计减行 |
|---|---|---|---|
| `create-bound-reducer-hook.ts` | 消解 Hook 模板 | `src/shared/hooks/` | -350 |
| `create-simple-setters.ts` | 消解 Store setter 模板 | `src/stores/` | -100 |

## 应用前测试

```bash
# 1. 复制文件
cp docs/refactor/samples/create-bound-reducer-hook.ts src/shared/hooks/
cp docs/refactor/samples/create-simple-setters.ts src/stores/

# 2. 跑类型检查（确保不破坏现有推导）
npm run type-check

# 3. 跑测试
npm test

# 4. 如果都绿，再开始改 5 个 consumer hook
```

## 应用顺序（建议）

1. 先落 `create-bound-reducer-hook.ts`，改 `use-project-detail.ts` 一个文件
2. 跑 `npm test use-project-detail` 验证
3. 改剩下 4 个 hook：`use-script-detail`、`use-subtitle-extraction`、`use-script-editor`、`use-video-processing`
4. 再落 `create-simple-setters.ts`，改 `editor-store.ts`
5. 全量 `npm run type-check && npm test`
