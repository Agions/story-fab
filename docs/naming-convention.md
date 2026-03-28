# StoryForge 文件命名规范 & 重构指南

> 版本：1.0.0 | 更新：2026-03-28

---

## 📌 目录

```
1. 总体原则
2. 目录命名规范
3. 文件命名规范
4. 命名风格对照表
5. 重构清单（待处理）
6. 实施优先级
```

---

## 1. 总体原则

| 原则 | 说明 |
|------|------|
| **单一规范** | 一个目录内只使用一种命名风格 |
| **自描述** | 名称直接反映功能，无需猜测 |
| **无冗余** | 避免重复（目录名 = 组件名时，禁止目录内再有同名 tsx） |
| **层级清晰** | 同类文件放在同类目录 |

---

## 2. 目录命名规范

### ✅ 规范风格：全小写 + kebab-case

| 类别 | 正确 ✅ | 错误 ❌ |
|------|---------|---------|
| 页面目录 | `pages/project-edit/` | `pages/ProjectEdit/` |
| 组件目录 | `components/video-player/` | `components/VideoPlayer/` |
| 服务目录 | `services/ai-clip/` | `services/AIClip/` |
| Hook 目录 | `hooks/use-project/` | `hooks/useProject/` |

### 📂 目录分层规范

```
src/
├── components/          # PascalCase（= 组件名）
│   ├── VideoPlayer/      # 主组件
│   │   ├── index.tsx    # 主入口
│   │   └── VideoPlayer.module.less
│   └── AIClipPanel/
│       ├── index.tsx
│       └── AIClipPanel.module.less
├── pages/               # kebab-case（= 路由路径）
│   ├── project-edit/
│   │   ├── index.tsx
│   │   └── index.module.less
│   └── video-editor/
├── services/            # kebab-case
│   ├── ai-clip/
│   │   ├── index.ts
│   │   ├── ai-clip.service.ts
│   │   └── types.ts
│   └── asr/
├── hooks/               # kebab-case
│   ├── use-project.ts
│   └── use-video.ts
├── stores/              # kebab-case
│   └── app-store.ts
├── utils/               # kebab-case
│   └── api-client.ts
├── types/               # kebab-case（全项目统一类型）
│   └── index.ts
└── styles/              # kebab-case
    └── variables.less
```

---

## 3. 文件命名规范

### 3.1 React 组件

| 元素 | 规范 | 示例 |
|------|------|------|
| **主文件** | `index.tsx` | `VideoPlayer/index.tsx` |
| **样式文件** | `PascalName.module.less` | `VideoPlayer.module.less` |
| **类型文件** | `types.ts` | `VideoPlayer/types.ts` |

**✅ 正确结构：**
```
VideoPlayer/
├── index.tsx
├── VideoPlayer.module.less
└── types.ts
```

**❌ 错误结构：**
```
VideoPlayer/
├── VideoPlayer.tsx      ← 文件名 = 目录名，冗余
├── VideoPlayer.module.less
└── index.tsx
```

### 3.2 服务层

| 元素 | 规范 | 示例 |
|------|------|------|
| **服务文件** | `kebab-case.service.ts` | `ai-clip.service.ts` |
| **入口文件** | `index.ts` | `index.ts` |
| **子模块** | `kebab-case.ts` | `analyzer.ts` |
| **类型** | `types.ts` | `types.ts` |

### 3.3 Hooks

| 元素 | 规范 | 示例 |
|------|------|------|
| **自定义 Hook** | `use-{noun}.ts` | `use-project.ts` |
| **复合 Hook** | `use-{noun}-{detail}.ts` | `use-project-edit.ts` |

**禁止**：`useProjectEdit.ts`（应为 `use-project-edit.ts`）

### 3.4 页面

| 元素 | 规范 | 示例 |
|------|------|------|
| **入口文件** | `index.tsx` | `project-edit/index.tsx` |
| **样式文件** | `index.module.less` | `project-edit/index.module.less` |
| **类型文件** | `types.ts` | `project-edit/types.ts` |

### 3.5 工具函数

| 元素 | 规范 | 示例 |
|------|------|------|
| **工具函数** | `kebab-case.ts` | `api-client.ts` |
| **测试文件** | `{name}.test.ts` | `api-client.test.ts` |

---

## 4. 命名风格对照表

| 类别 | 规范风格 | 示例 |
|------|---------|------|
| React 组件目录 | PascalCase | `AIClipPanel/` |
| 页面目录 | kebab-case | `video-editor/` |
| 服务目录 | kebab-case | `ai-clip/` |
| Hook 目录 | kebab-case | `use-project/` |
| 组件文件 | `index.tsx` | `index.tsx` |
| 服务文件 | kebab-case.service.ts | `ai-clip.service.ts` |
| Hook 文件 | use-{noun}.ts | `use-project.ts` |
| 工具文件 | kebab-case.ts | `api-client.ts` |
| 类型文件 | types.ts 或 kebab-case.types.ts | `video.types.ts` |
| 样式文件 | PascalName.module.less | `AIClipPanel.module.less` |
| 配置文件 | kebab-case.config.ts | `export.config.ts` |
| 常量文件 | kebab-case.ts | `models.ts` |

---

## 5. 重构清单

### 🔴 高优先级（影响编译）

| 当前路径 | 问题 | 目标路径 | 状态 |
|---------|------|---------|------|
| `src/core/types.ts` | canonical types 位置混乱 | 统一到 `src/types/` | 待处理 |
| `src/types/index.ts` | 循环引用风险 | 确认无循环后保留 | 待处理 |
| `src/core/types/index.ts` | 简单 re-export | 保持 | 确认安全 |
| `src/shared/types/index.ts` | 空壳 re-export | 清理合并 | 待处理 |

### 🟡 中优先级（统一命名）

| 当前路径 | 问题 | 目标路径 |
|---------|------|---------|
| `src/core/hooks/useAIClip.ts` | PascalCase 命名 | `src/core/hooks/use-ai-clip.ts` |
| `src/core/hooks/useAutoSave.ts` | PascalCase 命名 | `src/core/hooks/use-auto-save.ts` |
| `src/core/hooks/useSmartModel.ts` | PascalCase 命名 | `src/core/hooks/use-smart-model.ts` |
| `src/core/services/ai-director.service.ts` | camelCase | `src/services/ai-director.service.ts` |
| `src/core/services/smart-cut.service.ts` | 命名不一致 | `src/services/smart-cut/smart-cut.service.ts` |
| `src/core/services/clip-workflow.service.ts` | camelCase | `src/services/clip-workflow/clip-workflow.service.ts` |

### 🟢 低优先级（清理）

| 当前路径 | 问题 | 处理方式 |
|---------|------|---------|
| `src/components/ScriptEditor.tsx` | 冗余（已有目录） | 删除，保留目录 |
| `src/components/ScriptGenerator.tsx` | 冗余（已有目录） | 删除，保留目录 |
| `src/core/hooks/useEditor.ts` | 与 `src/hooks/useEditor.ts` 重复 | 合并或删除 |
| `src/core/hooks/useModel.ts` | 与 `src/hooks/useModel.ts` 重复 | 合并或删除 |
| `src/core/hooks/useProject.ts` | 与 `src/hooks/useProject.ts` 重复 | 合并或删除 |
| `src/core/hooks/useVideo.ts` | 与 `src/hooks/useVideo.ts` 重复 | 合并或删除 |
| `src/core/hooks/useWorkflow.ts` | 与 `src/hooks/useWorkflow.ts` 重复 | 合并或删除 |
| `.learnings/ERRORS.md` | 临时文件 | 删除 |
| `.learnings/LEARNINGS.md` | 临时文件 | 删除 |
| `DEVELOPMENT_PLAN.md` | 临时文件 | 删除 |
| `DEVELOPMENT_PROGRESS.md` | 临时文件 | 删除 |
| `docs/multi-agent-remediation-plan.md` | 临时文件 | 删除 |
| `docs/replan-2026-03-workflow.md` | 临时文件 | 删除 |

---

## 6. 实施优先级

### Phase 1：清理临时文件（风险最低）

```bash
# 安全删除（无依赖关系）
Delete:  .learnings/
Delete:  DEVELOPMENT_PLAN.md
Delete:  DEVELOPMENT_PROGRESS.md
Delete:  docs/multi-agent-remediation-plan.md
Delete:  docs/replan-2026-03-workflow.md
```

### Phase 2：删除冗余组件文件（安全删除）

```bash
Delete:  src/components/ScriptEditor.tsx      # 已有目录版本
Delete:  src/components/ScriptGenerator.tsx  # 已有目录版本
```

### Phase 3：统一 Hooks 命名（需 codemod）

```bash
# 使用 codemod 批量重命名
npx jscodeshift --dry --print \
  --extensions=ts,tsx --parser=typescript \
  -t rename-hooks.tscodemod.js \
  src/core/hooks/
```

### Phase 4：合并重复 Hooks

```
src/hooks/ + src/core/hooks/
     ↓
统一保留一份，删除另一份
```

### Phase 5：重组服务层目录

```
src/core/services/ai-director.service.ts
     ↓
src/services/ai-director/ai-director.service.ts
```

---

*本规范将随项目结构演进持续更新。建议在每次 PR 中附带对应的命名规范检查。*
