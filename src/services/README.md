# src/services/ — Service Layer (双层架构)

> **架构决策 ADR-101**：本目录与 `src/core/services/` **并存**，职责不同，**不重复不互相替代**。

## 目录定位

| 层 | 路径 | 职责 | 数量 |
|---|---|---|---|
| **Shim / Adapter** | `src/services/` | UI 关心的文件操作、向后兼容 re-export | 2 个文件 (tauri.ts + README.md) |
| **Domain / Business** | `src/core/services/` | 厚业务逻辑（AI/ASR/Pipeline/Workflow 等） | 13 个子目录（editor/ 内含 storage.ts） |

## 文件清单

### `src/services/file/` — UI 关心的 FS 操作
- `configStorage.ts` — 应用配置本地存储（基于 Tauri FS）
- `fileOperations.ts` — 文件选择/读取/保存（用户级操作）
- `projectFiles.ts` — 项目文件增删改查（应用级）
- `index.ts` — barrel export

**与 `src/core/services/file/fileInfoService.ts` 区分**：
- `src/services/file/*` —— 关注**用户操作**（选择、保存、加载）
- `src/core/services/file/fileInfoService.ts` —— 关注**视频元数据解析**（duration / size / codec）

### `src/services/tauri.ts` — 向后兼容 re-export
- 这是 **shim 设计的范例**：`tauri.ts` 集中 re-export 来自 `core/services/` 的 API
- 用途：让老代码 `import { xxx } from '@/services/tauri'` 继续工作
- **新增代码应该直接** import from `@/core/services/...`

## 何时用哪层？

```ts
// ✅ 推荐：直接 import from core
import { scriptService } from '@/core/services/ai/scriptService';
import { saveProjectToFile } from '@/core/services/project/projectFileService';

// ⚠️ 兼容层：只在无法改路径时用
import { getApiKey } from '@/services/tauri';  // re-export from core/services/auth
```

## ESLint 跨层引用规则

`.eslintrc.json` 禁止：
- ❌ `src/core/**` 引用 `src/services/**`（核心层不该依赖 shim）
- ✅ `src/services/**` 引用 `src/core/**`（shim 可以 re-export core）
- ✅ 页面 / 组件层可引用两者

详见 [docs/dev/architecture.md §双服务层 (ADR-101)](../../docs/dev/architecture.md)
