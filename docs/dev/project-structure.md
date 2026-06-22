---
title: 项目结构
description: StoryFab 目录结构与模块说明
---

# 项目结构

## 顶层结构

```
story-fab/
├── src/                前端源码
├── src-tauri/          Rust 后端
├── docs/               VitePress 文档
├── assets/             品牌资源
├── public/             静态资源
├── scripts/            校验脚本
└── .github/workflows/  CI/CD
```

## 前端 src/

| 目录 | 命名风格 | 用途 |
| --- | --- | --- |
| `src/components/` | PascalCase 业务目录，kebab-case `ui/` `common/` | React 组件 |
| `src/core/` | kebab-case 顶级 | 核心业务层 |
| `src/pages/` | PascalCase 业务目录 | 路由页面 |
| `src/hooks/` | camelCase | React hooks |
| `src/store/` | camelCase | Zustand stores |
| `src/shared/` | camelCase 文件 | 跨层共享 |
| `src/providers/` | PascalCase | React Provider |
| `src/context/` | PascalCase | Context |
| `src/styles/` | camelCase | 全局样式 |

## 核心业务层 src/core/

```
src/core/
├── pipeline/                Pipeline 编排
│   └── steps/
│       └── commentary/      5 步 Agent（Director/Visual/Narration/Timing/Overlay）
├── services/                业务服务（14 个子目录）
│   ├── ai/                  LLM 调用层 + 视觉/语音/脚本
│   ├── aiClip/              AI 拆条
│   ├── asr/                 Whisper 集成
│   ├── auth/                认证
│   ├── commentary/          解说模式入口
│   ├── editor/              时间轴编辑
│   ├── export/              渲染 + 转码
│   ├── file/                文件元数据
│   ├── pipeline/
│   │   └── clip-pipeline/   剪辑模式流水线
│   ├── project/             项目存储
│   ├── providers/           LLM Provider 实现
│   ├── storage/             配置存储
│   ├── subtitle/            字幕 + 对齐
│   └── video/               视频元数据（含 audioMix / transition-suggestion）
├── tauri/                   IPC 桥接
│   ├── TauriBridge.ts       invoke 入口
│   └── methods/             按域分组的方法
├── types/                   全局类型
├── interfaces/              业务接口（editor/timeline 等）
├── constants/               内部常量
├── config/                  配置项
├── utils/                   工具
└── index.ts                 顶层 barrel
```

## 后端 src-tauri/

| 目录 | 用途 |
| --- | --- |
| `src/commands/ai/` | AI 子命令（TTS 等） |
| `src/commands/auto_save/` | 自动保存与崩溃恢复 |
| `src/commands/commentary/` | 解说模式后端 |
| `src/commands/project/` | 项目管理 |
| `src/commands/render/` | 渲染 + 智能拆条 |
| `src/llm/` | LLM Provider（含 `providers/` 子目录） |
| `src/subtitle/` | Whisper 字幕 |
| `src/video/` | 视频元数据 + 抽帧 |
| `src/highlight/` | 高光检测 |
| `src/segment/` | 语义分段 |
| `src/binary/` | FFmpeg / Whisper 二进制管理 |
| `src/utils/` | 工具函数 |
| `tests/` | Rust 集成测试（resilience / crash_recovery / audio_mix） |
| `capabilities/` | Tauri 权限 |
| `icons/` | 应用图标 |

## 命名规范

| 实体 | 规则 |
| --- | --- |
| React 组件 | PascalCase（业务目录） |
| 通用组件 | kebab-case（`ui/`、`common/`） |
| Hook | camelCase + `use` 前缀 |
| 工具函数 | camelCase |
| 业务目录 | PascalCase |
| 顶级目录 | kebab-case |
| 常量 | SCREAMING_SNAKE_CASE |

校验：`pnpm verify:naming`（`scripts/check-naming.mjs`）。

## 已清理（v2.1+）

- 删除 `src/constants/` —— 转发层，已被 `@/shared/constants` 取代
- 删除 `src/core/index.ts` —— 转发层，无外部引用
- 删除 `src/hooks/useProject.ts` —— 与 `useProjectList.ts` 同名重复
- 重命名 `subtitle_scene_aligner.ts` → `SubtitleSceneAligner.ts`
- 删除 `scripts/code-review-dashboard.ts` —— CI 用 `.mjs` 版本
- 删除 `useApiKeyState`、`useEditor` 默认导出、`formatNumber`、`formatPercent` 等孤儿