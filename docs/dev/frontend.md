---
title: 前端架构
---

# 前端架构

## 技术栈

- React 18 + TypeScript 5
- Vite 6 构建
- TailwindCSS 4
- Zustand 状态
- shadcn/ui + Radix UI

## 目录结构

```
src/
├── App.tsx                      路由 + Provider
├── main.tsx                     入口
├── components/                  React 组件
│   ├── ui/                      shadcn 基座
│   └── common/                  通用组件
├── core/                        核心业务层
│   ├── pipeline/                Pipeline 编排
│   ├── services/                业务服务（ADR-101）
│   ├── tauri/                   Tauri IPC 桥接
│   ├── types/                   全局类型
│   └── config/                  配置
├── pages/                       路由页面
│   ├── Home/
│   ├── Dashboard/
│   ├── Projects/
│   ├── ProjectEdit/
│   ├── ProjectDetail/
│   ├── ScriptDetail/
│   ├── VideoEditor/
│   ├── AIVideoEditor/
│   └── Settings/
├── hooks/                       自定义 hooks
├── store/                       Zustand 状态
├── shared/                      跨层共享
│   ├── constants/
│   ├── utils/
│   └── types/
├── providers/                   React Provider
├── context/                     Context
└── styles/                      全局样式
```

## 分层规则

依赖方向严格单向：

```
view → hook → store → service (core) → backend
```

## 工作流

剪辑模式：

```
视频 → useVideo() →  store → core/services/video/ → tauri/video
```

解说模式（5 步 Pipeline）：

```
Director → Visual → Narration → Timing → Overlay → 成片
```

每步实现 `src/core/pipeline/steps/commentary/` 下的一个 Step。

## 5 个 Store

| Store | 职责 |
| --- | --- |
| `appStore` | 全局状态 |
| `projectStore` | 项目 CRUD |
| `editorStore` | 编辑器 |
| `timelineStore` | 时间轴 |
| `modelStore` | AI 模型配置 |

## TauriBridge

`src/core/tauri/methods/` 下集中所有 IPC 调用，业务接口在 `src/core/interfaces/`，核心数据类型在 `src/core/types/`。

## 路由

| 路由 | 组件 | 懒加载 |
| --- | --- | --- |
| `/` | Home | 是 |
| `/dashboard` | Dashboard | 是 |
| `/projects` | Projects | 是 |
| `/projects/:id` | ProjectDetail | 是 |
| `/projects/:id/edit` | ProjectEdit | 是 |
| `/scripts/:id` | ScriptDetail | 是 |
| `/editor/:id` | VideoEditor | 是 |
| `/ai-editor/:id` | AIVideoEditor | 是 |
| `/settings` | Settings | 是 |

## 验证

```bash
pnpm type-check       # tsc --noEmit
pnpm lint             # ESLint
pnpm test             # Vitest
pnpm verify:all       # 一键运行所有 verify
```