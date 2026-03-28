# StoryForge 文件命名规范 & 重构指南

> 版本：1.0.0 | 更新：2026-03-28 | 状态：规范制定中

---

## 📌 目录

```
1. 总体原则
2. 目录命名规范
3. 文件命名规范
4. 命名风格对照表
5. 重构清单（待处理文件）
6. 实施优先级
```

---

## 1. 总体原则

| 原则 | 说明 |
|------|------|
| **单一规范** | 一个目录内只使用一种命名风格 |
| **自描述** | 名称直接反映功能，无需猜测 |
| **无冗余** | 避免重复词（`Component/Component.tsx`） |
| **层级清晰** | 同类文件放在同类目录 |

---

## 2. 目录命名规范

### ✅ 规范风格：全小写 + kebab-case

| 类别 | 正确 ✅ | 错误 ❌ |
|------|--------|---------|
| 页面目录 | `pages/project-edit/` | `pages/ProjectEdit/` |
| 页面目录 | `pages/video-editor/` | `pages/VideoEditor/` |
| 组件目录 | `components/video-player/` | `components/VideoPlayer/` |
| 服务目录 | `services/ai-clip/` | `services/AIClip/` |
| 工具目录 | `utils/api-client/` | `utils/apiClient/` |
| Hook 目录 | `hooks/use-project/` | `hooks/useProject/` |
| 类型目录 | `types/` | `core/types/` |

### 📂 目录分层规范

```
src/
├── components/          # UI 组件（PascalCase）
│   ├── VideoPlayer/     # 组件目录 = 组件名（PascalCase）
│   └── AIClipPanel/
├── pages/               # 页面（kebab-case）
│   ├── project-edit/    # 页面 = 路由路径一致
│   └── video-editor/
├── services/            # 服务层（全小写）
│   ├── ai-clip/         # 内部文件用 kebab-case
│   │   ├── index.ts
│   │   ├── analyzer.ts
│   │   └── types.ts
│   └── asr/
├── hooks/               # 自定义 Hooks（kebab-case）
│   ├── use-project.ts
│   └── use-video.ts
├── stores/              # 状态管理（全小写）
│   └── app-store.ts
├── utils/               # 工具函数（kebab-case）
│   ├── api-client.ts
│   └── logger.ts
├── constants/           # 常量（全小写）
│   └── models.ts
├── types/               # 类型定义（全小写）
│   ├── project.ts
│   └── video.ts
└── styles/              # 样式（全小写）
    └── variables.less
```

---

## 3. 文件命名规范

### 3.1 React 组件文件

| 元素 | 规范 | 示例 |
|------|------|------|
| **组件文件** | `ComponentName.tsx`（PascalCase）| `VideoPlayer.tsx` |
| **组件样式** | `ComponentName.module.less` | `VideoPlayer.module.less` |
| **组件入口** | `index.ts` | `index.ts` |
| **子组件** | `ComponentName.sub.tsx` | `TimelineClip.tsx` |

**原则：**
- 目录名 = 组件名（PascalCase）
- 主文件 `index.tsx` 导出组件
- 不允许目录内文件与目录名重复

**正确结构：**
```
VideoPlayer/
├── index.tsx           # 主入口，导出组件
├── VideoPlayer.module.less
└── VideoPlayer.types.ts
```

**错误结构（冗余）：**
```
VideoPlayer/
├── VideoPlayer.tsx     # ❌ 文件名 = 目录名，冗余
└── VideoPlayer.module.less
```

### 3.2 服务层文件

| 元素 | 规范 | 示例 |
|------|------|------|
| **服务实现** | `kebab-case.service.ts` | `ai-clip.service.ts` |
| **服务入口** | `index.ts` | `index.ts` |
| **子模块** | `kebab-case.module.ts` | `analyzer.ts` |
| **类型** | `kebab-case.types.ts` | `analyzer.types.ts` |
| **常量配置** | `kebab-case.config.ts` | `dedup.config.ts` |

**原则：**
- 服务名以 `service` 结尾（如 `asr.service.ts`）
- 同一服务的子文件放同一目录

### 3.3 Hooks 文件

| 元素 | 规范 | 示例 |
|------|------|------|
| **自定义 Hook** | `use-{noun}.ts`（kebab-case）| `use-project.ts` |
| **Hook 子逻辑** | `use-{noun}-{detail}.ts` | `use-project-edit.ts` |

**原则：**
- 统一使用 `use-` 前缀
- 目录内一个 `index.ts` 统一导出
- 不用 PascalCase 的 `useProject.ts`

### 3.4 页面文件

| 元素 | 规范 | 示例 |
|------|------|------|
| **页面入口** | `index.tsx` | `index.tsx` |
| **页面样式** | `index.module.less` | `index.module.less` |
| **页面类型** | `types.ts` | `types.ts` |

**原则：**
- 页面目录 = 路由路径（kebab-case）
- 页面目录下只有 `index.tsx` + `index.module.less` + `types.ts`
- 不在页面目录下放组件

### 3.5 类型定义文件

| 元素 | 规范 | 示例 |
|------|------|------|
| **模块类型** | `{module}.types.ts` | `video.types.ts` |
| **统一导出** | `types/index.ts` | `index.ts` |

### 3.6 工具函数文件

| 元素 | 规范 | 示例 |
|------|------|------|
| **工具函数** | `kebab-case.ts` | `api-client.ts` |
| **测试** | `{filename}.test.ts` | `api-client.test.ts` |

---

## 4. 命名风格对照表

| 类别 | 规范风格 | 示例 |
|------|---------|------|
| React 组件目录 | PascalCase | `AIClipPanel/` |
| 页面目录 | kebab-case | `video-editor/` |
| 服务目录 | kebab-case | `ai-clip/` |
| Hooks 目录 | kebab-case | `use-project/` |
| 组件文件 | PascalCase.tsx | `AIClipPanel.tsx` |
| 服务文件 | kebab-case.service.ts | `ai-clip.service.ts` |
| Hook 文件 | use-{noun}.ts | `use-project.ts` |
| 工具文件 | kebab-case.ts | `api-client.ts` |
| 类型文件 | kebab-case.types.ts | `video.types.ts` |
| 常量文件 | kebab-case.ts | `models.ts` |
| 样式文件 | PascalCase.module.less | `AIClipPanel.module.less` |
| 配置文件 | kebab-case.config.ts | `export.config.ts` |
| 路由文件 | kebab-case.ts | `routes.ts` |
| 中间件文件 | kebab-case.middleware.ts | `auth.middleware.ts` |

---

## 5. 重构清单（待处理文件）

### 🔴 高优先级（影响编译/类型安全）

| 当前路径 | 问题 | 目标路径 |
|---------|------|---------|
| `src/core/types.ts` | 根级冗余类型文件 | 合并至 `src/types/index.ts` |
| `src/types/index.ts` | 空壳文件 | 清理重新导出 |
| `src/core/types/index.ts` | 空壳文件 | 清理重新导出 |
| `src/components/ScriptEditor/types.ts` | 组件内嵌类型 | 移至 `src/types/` |
| `src/components/VideoProcessingController/types.ts` | 组件内嵌类型 | 移至 `src/types/` |
| `src/pages/Projects/types.ts` | 页面内嵌类型 | 移至 `src/types/` |
| `src/core/services/editor/types.ts` | 服务内嵌类型 | 移至 `src/types/` |

### 🟡 中优先级（统一命名）

| 当前路径 | 问题 | 目标路径 |
|---------|------|---------|
| `src/core/services/ai-director.service.ts` | camelCase 服务名 | `src/services/ai-director/ai-director.service.ts` |
| `src/core/services/smart-cut.service.ts` | 命名不一致 | `src/services/smart-cut/smart-cut.service.ts` |
| `src/core/services/clip-workflow.service.ts` | 命名不一致 | `src/services/clip-workflow/clip-workflow.service.ts` |
| `src/core/hooks/useAIClip.ts` | PascalCase | `src/hooks/use-ai-clip.ts` |
| `src/core/hooks/useAutoSave.ts` | PascalCase | `src/hooks/use-auto-save.ts` |
| `src/core/hooks/useEditor.ts` | 重复（`src/hooks/useEditor.ts`）| 删除或合并 |
| `src/core/hooks/useModel.ts` | 重复 | 删除或合并 |
| `src/core/hooks/useProject.ts` | 重复 | 删除或合并 |
| `src/core/hooks/useVideo.ts` | 重复 | 删除或合并 |
| `src/core/hooks/useWorkflow.ts` | 重复 | 删除或合并 |
| `src/hooks/useEditor.ts` | 与 core/hooks 重复 | 合并 |
| `src/hooks/useHistory.ts` | 与 core/hooks 重复 | 合并 |
| `src/hooks/useLocalStorage.ts` | 通用工具 | 移至 `src/utils/` |
| `src/hooks/usePerformance.ts` | 通用工具 | 移至 `src/utils/` |
| `src/hooks/useProjects.ts` | 重复 | 合并 |
| `src/hooks/useSettings.ts` | 重复 | 合并 |
| `src/hooks/useWorkflow.ts` | 重复 | 合并 |
| `src/components/ScriptEditor.tsx` | 与 `ScriptEditor/` 目录冗余 | 删除，保留目录版本 |
| `src/components/ScriptGenerator.tsx` | 与 `ScriptGenerator/` 目录冗余 | 删除，保留目录版本 |
| `src/components/WorkflowMonitor.tsx` | 应在 pages/ 下 | 移至 `src/pages/workflow/` |

### 🟢 低优先级（清理）

| 当前路径 | 问题 | 目标 |
|---------|------|------|
| `.learnings/ERRORS.md` | 临时文件 | 删除或移至 docs/ |
| `.learnings/LEARNINGS.md` | 临时文件 | 删除或移至 docs/ |
| `DEVELOPMENT_PLAN.md` | 临时文件 | 删除或合并至 docs/ |
| `DEVELOPMENT_PROGRESS.md` | 临时文件 | 删除 |
| `docs/multi-agent-remediation-plan.md` | 临时文件 | 删除 |
| `docs/replan-2026-03-workflow.md` | 临时文件 | 删除 |
| `src/components/AnimatedContainer.tsx` | 通用组件 | 移至 `src/components/common/` |
| `src/components/common/motion-shim.tsx` | 技术债务 | 评估是否需要 |

---

## 6. 实施优先级

### Phase 1：清理类型系统（最先做）
```
src/types/index.ts          → 统一导出所有类型
src/core/types.ts           → 删除，内容合并至 types/
src/core/types/index.ts     → 清理，重新导出
src/core/services/*/types.ts → 逐个移动到 src/types/
src/components/*/types.ts   → 逐个移动到 src/types/
src/pages/*/types.ts        → 逐个移动到 src/types/
```

### Phase 2：合并重复 Hooks
```
src/hooks/         +  src/core/hooks/
     ↓
统一到 src/hooks/（core/hooks/ 删除）
```

### Phase 3：统一服务层目录
```
src/core/services/  →  拆分为 src/services/ + src/core/services/
AIClip 相关         →  src/services/ai-clip/
PlotAnalysis       →  src/services/plot-analysis/
```

### Phase 4：统一组件目录
```
保留：components/{PascalName}/
      index.tsx + ComponentName.module.less + types.ts
删除：与目录同名的 tsx 文件（已冗余）
```

### Phase 5：页面目录规范化
```
pages/ProjectDetail/   →  pages/project-detail/
pages/AIVideoEditor/  →  pages/ai-video-editor/
```

### Phase 6：清理临时文件
```
删除 .learnings/
删除 DEVELOPMENT_PLAN.md
删除 DEVELOPMENT_PROGRESS.md
删除 docs/multi-agent-*.md
```

---

## 7. ESLint 规则建议

新增以下规则强制规范：

```json
{
  "rules": {
    "max-nested-callbacks": [2, 4],
    "filename/match-exported": [2, ["PascalCase", "kebab-case"]],
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          { "target": "src/core/services", "from": "src/components" }
        ]
      }
    ]
  }
}
```

---

*本文档为 StoryForge 项目内部使用，后续随着项目结构演进持续更新。*
