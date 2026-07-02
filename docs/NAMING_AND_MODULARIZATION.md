# 命名与模块化规范 (Naming & Modularization)

> 本文档由 `scripts/check-naming.mjs` 强制校验（`npm run verify:naming`）。
> 规范以代码库**已落地的实际约定**为准，而非理想化目标。

## 1. 文件命名

| 类型 | 约定 | 示例 |
|------|------|------|
| React 组件 (`.tsx`) | **kebab-case** | `video-editor.tsx`, `commentary-panel.tsx` |
| React Hook | `use` 前缀 + kebab-case | `use-video-analysis.ts`, `use-clip-rippling.ts` |
| 工具 / 服务 / 类型 (`.ts`) | kebab-case | `export-service.ts`, `command-types.ts` |
| 入口文件（例外） | 保留 | `main.tsx`, `App.tsx` |
| 桶文件 | `index.ts` / `index.tsx` | — |

> 历史说明：项目早期使用 PascalCase 组件文件名，已通过一系列
> `refactor(naming)` 提交统一迁移到 kebab-case（108/108 组件文件）。
> 校验脚本据此强制 kebab-case。

## 2. 目录命名

- **业务组件目录**：PascalCase（`components/VideoEditor/`, `components/Timeline/`）
- **顶级 / 分层目录**：kebab-case 或既定小写名（`core/`, `shared/`, `hooks/`, `pages/`, `store/`）
- **禁止的模糊目录名**：`util`, `helper(s)`, `misc`, `tmp`, `temp`, `new`, `old`, `v2`
  —— 应使用具体语义命名（如 `utils/`, `formats/`）。

## 3. 类型归属 (Type Home)

- **领域类型**统一放在 `src/types/`（媒体、项目、脚本、时间线等），通过 `@/types` 导入。
- **通用基础设施类型**（分页、表单、Modal、主题）放在 `src/shared/types/`。
- 不在 `store/`、`core/services/` 等目录内新增领域类型定义。

## 4. 校验

```bash
npm run verify:naming   # 文件名 + 目录名 (warn-only, 不阻塞构建)
npm run verify:all      # antd + naming
```
