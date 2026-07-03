# StoryFab 全面重构设计文档

**日期**: 2026-07-03
**状态**: 待用户审批
**范围**: Phase A（文件结构重构）+ Phase B（死代码清理）+ Phase C（README 重写）+ Phase D（Logo/Brand 重设计）

---

## 1. 审计结论摘要

### 1.1 文件规模

| 指标 | 数值 |
|------|------|
| 源文件总数 | 423 |
| 目录数 | 60+ |
| 页面 (pages/) | 6 个页面 + 子目录 |
| 组件 (components/) | 30+ 个组件目录 |
| 核心服务 (core/services/) | 13 个子域 |
| Tauri IPC 方法 | 10 个 |
| 测试文件 | 33 个（.test.ts/.test.tsx） |
| Logo 资源 | 4 个 SVG |

### 1.2 关键发现

| 类别 | 问题 | 严重性 |
|------|------|--------|
| **命名** | `src/main.tsx` 违反 kebab-case 规范 | 中 |
| **命名** | 5 个文件 CamelCase + `.reducer.test.ts`（如 `useVideoProcessingController.reducer.test.ts`） | 中 |
| **命名** | `src/types/cssmodule.d.ts` CamelCase | 低 |
| **引用** | `index.html` 引用 `/logo.svg` 和 `/favicon.svg`，实际文件不存在 | 高 |
| **死代码** | `src/workflow/` 仅 1 个文件，仅 1 处 import | 中 |
| **死代码** | `src/test/setup.ts` 仅 vitest.config.ts 引用，但测试文件分散在各处 | 低 |
| **循环** | `src/shared/utils/index.ts` 从 `@/shared` 间接自引用 | 低 |
| **结构** | StoryFab workspace 在 `components/` 而非 `pages/` | 中 |
| **结构** | `src/types/`（10 文件）与 `src/shared/types/`（泛型）命名重叠，易混淆 | 中 |
| **品牌** | Logo 使用紫/粉/琥珀渐变，theme/colors.ts 仅琥珀/金调，不一致 | 中 |
| **文档** | README 缺少贡献指南、安全策略等章节 | 低 |
| **文档** | README 提及 CLAUDE.md（`docs/` 不存在此文件） | 低 |

---

## 2. Phase A — 文件结构重构

### 2.1 新目录结构

```
src/
├── main.tsx                          # 从 src/main.tsx 迁移并重命名
├── app.tsx
├── pages/                            # 页面路由层
│   ├── home/
│   ├── projects/
│   │   └── components/
│   ├── project-edit/
│   │   ├── components/
│   │   │   └── steps/
│   │   └── hooks/
│   ├── project-detail/
│   ├── script-detail/
│   ├── settings/
│   └── workspace/                    # 从 components/StoryFab/workspace/ 迁移
│       ├── components/
│       ├── config/
│       ├── highlights/
│       ├── hooks/
│       ├── video-export/
│       ├── project-setup.tsx
│       ├── video-upload.tsx
│       ├── ai-visualizer.tsx
│       ├── script-writing.tsx
│       ├── video-composing.tsx
│       ├── clip-rippling.tsx
│       ├── step-list.tsx
│       └── workspace.tsx
├── components/                       # 可复用 UI 组件
│   ├── ui/                           # shadcn/ui 组件
│   ├── layout/
│   ├── video-player/
│   ├── video-editor/
│   ├── video-selector/
│   ├── video-analyzer/
│   ├── video-info/
│   ├── video-processing-controller/
│   ├── timeline/
│   ├── subtitle-extractor/
│   ├── script-editor/
│   ├── settings/
│   ├── shortcut-overlay/
│   └── common/
├── stores/                           # Zustand v5 stores
│   ├── app-store.ts
│   ├── project-store.ts
│   ├── workspace-store.ts
│   ├── model-store.ts
│   ├── create-history.ts
│   ├── create-persisted-store.ts
│   ├── editor-types.ts
│   └── timeline-helpers.ts
├── hooks/                            # 自定义 hooks
│   ├── use-project-list.ts
│   ├── use-project-detail.ts
│   ├── use-project-detail.reducer.ts
│   ├── use-script-detail.ts
│   ├── use-script-detail.reducer.ts
│   ├── use-keyboard-shortcuts.ts
│   ├── use-local-storage.ts
│   ├── use-secure-api-keys.ts
│   ├── use-commentary-session.ts
│   ├── use-commentary-script.ts
│   ├── use-commentary-voice.ts
│   ├── use-director-status.ts
│   ├── use-promise-delay.ts
│   └── use-timeout.ts
├── core/                             # 业务核心层（不变，但清理内部冗余）
│   ├── services/
│   ├── pipeline/
│   ├── config/
│   ├── tauri/
│   ├── utils/
│   ├── video/
│   └── errors/
├── providers/                        # React providers
│   └── app-provider.tsx
├── shared/                           # 跨层共享
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── errors/
├── theme/                            # 设计系统
│   ├── colors.ts
│   └── index.ts
├── types/                            # 领域类型（不变）
├── styles/
│   └── globals.css
└── test/                             # 全局测试设置
    └── setup.ts
```

### 2.2 主要移动操作

| 从 | 到 | 原因 |
|----|----|------|
| `src/main.tsx` → `src/main.tsx`（重命名为 kebab-case 无需，但保持） | 自身 | 保持位置，仅确认 |
| `src/components/StoryFab/workspace/*` → `src/pages/workspace/` | 页面入口组件应属 pages/ |
| `src/components/StoryFab/context/` → 删除 | 用 Zustand store 替代 |
| `src/components/StoryFab/types/` → `src/core/types/storyfab/` | 领域类型移到 core |
| `src/components/AIClip/` → `src/components/ai-clip/` | kebab-case |
| `src/components/CommentaryPanel/` → `src/components/commentary-panel/` | kebab-case |
| `src/components/ShortcutOverlay/` → `src/components/shortcut-overlay/` | kebab-case |
| `src/components/Layout/` → `src/components/layout/` | kebab-case |
| `src/context/` → `src/stores/` | Context → Zustand 统一 |
| `src/workflow/feature-blueprint.ts` → `src/core/pipeline/types/workflow-modes.ts` | 归入 pipeline 域 |

### 2.3 命名规范化

| 当前文件名 | 新文件名 | 规则 |
|------------|----------|------|
| `src/main.tsx` | 保持 | 入口例外 |
| `src/types/cssmodule.d.ts` | `src/types/css-modules.d.ts` | kebab-case |
| `src/components/VideoEditor/hooks/useVideoProcessingController.reducer.test.ts` | `use-video-processing-controller.reducer.test.ts` | kebab-case |
| `src/components/ScriptEditor/hooks/useOriginalEditor.reducer.test.ts` | `use-original-editor.reducer.test.ts` | kebab-case |
| `src/components/SubtitleExtractor/useSubtitleExtractor.reducer.test.ts` | `use-subtitle-extractor.reducer.test.ts` | kebab-case |
| `src/components/StoryFab/workspace/ai-visualizer.reducer.ts` | `ai-visualizer.reducer.ts`（保持） | 已符合 |
| `src/components/StoryFab/workspace/video-upload.reducer.ts` | `video-upload.reducer.ts`（保持） | 已符合 |

---

## 3. Phase B — 死代码清理

### 3.1 确认保留

| 文件 | 理由 |
|------|------|
| `src/shared/utils/logging.ts` | 20+ 处 import |
| `src/shared/utils/logging.test.ts` | 配套测试 |
| `src/core/services/auth/api-key-service.ts` | Tauri store 操作层 |
| `src/core/services/providers/api-key-service.ts` | 验证逻辑层 |
| `src/types/`（10 文件） | 领域类型，与 `shared/types` 职责不同 |
| `src/test/setup.ts` | vitest.config.ts 引用，全局 polyfill |
| `src/components/VideoEditor/export-settings.tsx` | 与 `Settings/export-settings.tsx` 功能不同 |

### 3.2 确认移除/归并

| 文件/目录 | 操作 | 理由 |
|-----------|------|------|
| `src/workflow/feature-blueprint.ts` | 移动至 `src/core/pipeline/types/workflow-modes.ts` | 仅 1 处 import，属于 pipeline 域 |
| `src/workflow/` | 删除空目录 | 归并后空 |
| `src/context/` | 删除 | 全部移至 `src/stores/` |
| `src/components/StoryFab/context/` | 删除 | 用 Zustand 替代 |

### 3.3 潜在清理（待确认）

| 文件 | 操作 | 条件 |
|------|------|------|
| `src/core/services/ai/ai-service.ts` | 确认是否被页面直接引用 | 检查 import 链 |
| `src/core/services/export/export-service.ts` | 同上 | 检查 import 链 |
| `src/core/services/ai-clip/config.ts` | 同上 | 检查 import 链 |
| `src/core/video/highlight.types.ts` | 同上 | 检查 import 链 |

---

## 4. Phase C — README 重写

### 4.1 当前 README 问题

| 问题 | 详情 |
|------|------|
| 版本号 | 2.2.0（与 package.json 一致，OK） |
| 文档链接 | 全部有效（已验证所有 `docs/*` 路径） |
| 提及 CLAUDE.md | 贡献指南中有"参考 AI服务开发指南"，但项目根无 CLAUDE.md |
| 缺失章节 | 贡献指南、行为准则、安全策略、路线图细节 |
| 架构图 | 文字 ASCII 图，可升级为 Mermaid |

### 4.2 重写方向

1. **保持现有结构**（已验证有效）
2. **修正贡献指南**：替换 CLAUDE.md 引用为 `docs/dev/ai-services.md`
3. **补充缺失章节**：
   - 行为准则（Code of Conduct）
   - 安全策略（Security Policy 占位）
   - 致谢更新
4. **升级架构图**：ASCII → Mermaid（兼容 GitHub）
5. **品牌一致性**：统一使用 Amber/Gold 调描述

### 4.3 新 README 结构

```
# StoryFab

> 简介

## ✨ 为什么选择 StoryFab？

（核心优势表格）

## 🚀 快速开始

### 下载安装
### 从源码构建

## 🎬 工作模式

### 剪辑模式
### 解说模式

## 🌟 核心特性

### AI 提供商
### TTS 配音
### Whisper 转写
### GPU 渲染
### 隐私保护

## 🏗️ 技术架构

（Mermaid 图）

## 📚 文档导航

## 🛠️ 开发命令

## 🤝 贡献指南

### 贡献流程
### 提交规范
### 新增 Provider

## 🗺️ 路线图

## 📄 许可证

## 🙏 致谢
```

---

## 5. Phase D — Logo/Brand 重设计

### 5.1 当前品牌分析

| 资源 | 当前状态 | 评估 |
|------|----------|------|
| `logo-icon.svg` (256×256) | 深色背景 + SF monogram + 胶片条纹 + 播放按钮 | 功能齐全 |
| `logo-horizontal.svg` (640×160) | 图标 + "StoryFab" 文字 + 副标题 | 适合 Header |
| `logo-horizontal-enhanced.svg` (512×128) | 类似但更紧凑 + 阴影 | 冗余，与 logo-horizontal.svg 重复 |
| `logo-mark.svg` (256×256) | 更精致的 icon + 环形 + 胶片 + SF 大字 | 最佳 icon |

### 5.2 品牌不一致问题

```
Logo 色板: #7C3AED(紫) → #EC4899(粉) → #F59E0B(琥珀)
Theme 色板: #c8956c(琥珀) → #d4a574(金) → #8a6848(暗金)
```

**Logo 中的紫色和粉色在 theme/colors.ts 中完全没有对应。**

### 5.3 推荐方案

**选项 A：扩展现有 brand palette（推荐）**

在 `theme/colors.ts` 中新增 logo 色板，建立完整 brand tokens：

```ts
// 品牌主色（Logo 色板）
brand: {
  purple:  '#7C3AED',
  pink:    '#EC4899',
  amber:   '#F59E0B',
  gold:    '#d4a574',
  darkBg:  '#0B0F1F',
  darkBgLight: '#1A1F3A',
}
```

同时将主色从纯琥珀调整为以紫色为入口、琥珀为高亮的双色系统。

**选项 B：Logo 统一为琥珀单色系**

将 Logo 的紫色/粉色替换为琥珀/金色渐变，与 theme/colors.ts 完全对齐。

**选项 C：全新设计**

从零开始设计一套新 brand identity，保持深色影视风格但引入新色彩语言。

### 5.4 我的推荐

**选项 A**，理由：
- Logo 的紫粉渐变有辨识度，不应轻易丢弃
- 在 theme/colors.ts 中补充 `brand` token 是最小改动
- 保持品牌延续性，同时解决不一致

### 5.5 Logo 资源清理

| 当前 | 建议 |
|------|------|
| `logo-horizontal.svg` | **保留**，作为主要横向 Logo |
| `logo-horizontal-enhanced.svg` | **合并到** `logo-horizontal.svg`，删除重复 |
| `logo-icon.svg` | **保留**，作为 favicon/app icon |
| `logo-mark.svg` | **保留**，作为高质量 mark |

### 5.6 `index.html` 修复

```
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
`/favicon.svg` 不存在。建议：
- 创建 `public/favicon.svg`（从 logo-icon.svg 简化，去掉背景圆角）
- 或改为 `<link rel="icon" href="/logo-icon.svg" />`

---

## 6. 实施顺序

```
Phase A（结构重构） → Phase B（死代码清理） → Phase C（README） → Phase D（Brand）
```

| Phase | 预估改动文件数 | 风险 |
|-------|---------------|------|
| A | 50+ 移动/重命名 | 高（需全面更新 import） |
| B | 10-15 删除/归并 | 低 |
| C | 1（README.md） | 极低 |
| D | 4 SVG + 1 HTML | 低 |

---

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 大量文件移动导致 import 断裂 | 使用 IDE "Move" 重构，自动更新引用 |
| StoryFab workspace 移动后功能异常 | 移动前备份 git commit，A/B 对比测试 |
| Brand 变更影响用户认知 | Logo 仅微调色板，不改变形状/识别 |
| 测试文件散布导致覆盖率报告变化 | 移动后运行 `vitest run --coverage` 对比 |

---

## 8. 待审批

请确认：

1. **Phase A 新目录结构**是否 OK？
2. **Phase B 删除范围**是否接受？
3. **Phase D 选项 A**（扩 brand palette）是否选这个方向？
4. 是否需要我先写 **implementation plan** 进入实施，还是还有其他调整？
