---
title: 系统架构
---

# 系统架构

StoryFab 是 Tauri 2 桌面应用：前端 React 18 + TypeScript，后端 Rust 1.77+。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | React 18、TypeScript 5、Vite、TailwindCSS |
| UI 组件 | shadcn/ui、Radix UI |
| 状态管理 | Zustand（5 store） |
| 桌面框架 | Tauri 2.x、Rust、tokio |
| AI 能力 | faster-whisper（6 档）、10 LLM Provider、2 TTS Provider |
| 媒体处理 | FFmpeg（转码 / 烧字幕 / 裁剪） |

## 双服务层（ADR-101）

```
src/services/        shim 层：薄包装，封装 Tauri IPC
src/core/services/   业务层：纯逻辑，可独立测试
```

shim 层的唯一职责是 Tauri IPC 桥接，业务逻辑全在 core/services。

## 工作流

### 剪辑模式

```
视频 → Whisper 转录 → 高光检测 → 时间轴编辑 → 多比例导出
```

### 解说模式（5 步 Pipeline）

```
Director → Visual → Narration → Timing → Overlay → 成片
```

详见 [commentary-workflow.md](commentary-workflow.md)。

## Zustand Stores

| Store | 职责 |
| --- | --- |
| `appStore` | 全局应用状态（主题、设置） |
| `projectStore` | 项目列表、CRUD |
| `editorStore` | 当前编辑上下文 |
| `timelineStore` | 时间轴轨道与片段 |
| `modelStore` | AI 模型配置 |

Store 边界详见 `src/store/README.md`。

## TauriBridge

前后端通信通过 `@tauri-apps/api/core` 的 `invoke` 完成。所有 IPC 调用集中在 `src/core/tauri/methods/` 下，业务接口定义在 `src/core/interfaces/`（`editor.interface.ts` / `timeline.interface.ts` 等），核心数据类型在 `src/core/types/`（`commentary.ts` / `video-project.ts` / `timeline.ts` / `voice.ts` / `jianying.ts`）。

## 数据流

```
视频源 ──► 智能拆条 ──► 语义分段 ──► Director Agent
                                       │
                                       ▼
                                LLM Provider × 5
                                       │
                                       ▼
                                  解说词脚本
                                       │
                                       ▼
                                TTS Provider × 2
                                       │
                                       ▼
                              FFmpeg 混音 + 烧字幕
                                       │
                                       ▼
                                   成片导出
```

## 关键设计决策

1. **本地优先**：所有 AI 在本地，原始数据零上传
2. **状态层边界**：view → hook → store → service → backend，单向依赖
3. **类型驱动**：核心数据流用 TypeScript interface 串联，编译时捕获错误
4. **渐进式渲染**：渲染任务可暂停 / 恢复 / 重试，从失败点继续

## 验证

```bash
pnpm type-check       # tsc --noEmit
pnpm lint             # ESLint
pnpm test             # Vitest 单元测试
```