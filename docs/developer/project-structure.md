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
| `src/stores/` | camelCase (复数) | Zustand stores |
| `src/shared/` | camelCase 文件 | 跨层共享 |
| `src/providers/` | PascalCase | React Provider |
| `src/types/` | PascalCase 接口 | 全局类型 (统一 @/types) |

## 核心业务层 src/core/

```
src/core/
├── pipeline/                Pipeline 编排
│   └── steps/
│       ├── commentary/      5 步 Agent (Director/Visual/Narration/Timing/Overlay)
│       └── full-pipeline.ts  一键成片入口
├── services/                业务服务 (12 个子目录)
│   ├── ai/                  LLM 调用层 + 视觉/语音/脚本
│   ├── ai-clip/             AI 拆条
│   ├── asr/                 Whisper 集成
│   ├── auth/                认证
│   ├── commentary/          解说模式入口
│   ├── export/              渲染 + 转码
│   ├── file/                文件元数据
│   ├── pipeline/            剪辑模式流水线
│   ├── project/             项目存储
│   ├── providers/           LLM Provider 实现
│   ├── subtitle/            字幕 + 对齐
│   └── video/               视频元数据 (含 audioMix / transition-suggestion)
├── tauri/                   IPC 桥接
│   ├── invoke.ts            invoke 入口
│   ├── command-types.ts     命令名常量 (50 个)
│   └── methods/             按域分组的方法模块
├── config/                  配置项
│   └── ai-models/           AI 模型提供者元数据 + 动态目录
├── types/                   全局类型 (storyfab 域)
├── errors/                  错误处理 (AppError)
├── utils/                   工具
└── video/                   视频处理抽象
```

## 工作台子包 (pages/workspace/)

```
pages/workspace/
├── edit-step/              项目初始 + 文案创作
│   ├── project-setup.tsx   项目配置
│   ├── script-writing.tsx  文案生成
│   ├── video-upload.tsx    视频上传
│   ├── function-config.tsx 功能配置
│   ├── step-list.tsx       步骤列表
│   └── script-config.ts    文案风格常量
├── assemble/               剪辑 + 高光 + 合成
│   ├── ai-visualizer.tsx   AI 分析可视化
│   ├── clip-rippling.tsx   AI 拆条
│   ├── video-composing.tsx 视频合成
│   ├── use-clip-rippling.ts
│   └── Highlights/         高光片段子目录
├── export/                 导出
│   └── VideoExport/        多格式导出子目录
├── shared/                 跨包配置
│   ├── function-mode-map.ts
│   ├── clip-rippling-config.ts
│   └── compose-config.ts
├── components/             多包复用面板 (voice/subtitle/effectsettings)
├── hooks/                  业务 hook (use-script-generation / use-video-synthesize)
├── config/                 任务配置
└── workspace.tsx / index.tsx / index.ts  编排层
```

## globals 类型系统

全局类型统一从 `@/types` 导入 (src/types/),含:

- `Project` / `ProjectData` / `ProjectView` / `ProjectUIStats`
- `VideoInfo` / `VideoAsset`
- `Script` / `ScriptData`
- `Voice` / `SubtitleSegment`
- `VideoAnalysis` / `ModelProvider` / `AIModelSettings`
- `ExportSettings`

模块内局部类型 (VideoData/VoiceData/EditorPanel 等) 正在逐步收口到 @/types。

## 命名约定

- **文件**: kebab-case (组件/服务), camelCase (hooks/stores), PascalCase 仅组件目录
- **组件**: PascalCase
- **hooks**: `use*` 前缀
- **stores**: `use*Store` 后缀
- **类型**: PascalCase,禁止使用 `I` 前缀
- **CSS Modules**: `*.module.less`
