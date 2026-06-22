<!--
SPDX-License-Identifier: MIT
-->

# StoryFab

> AI 影视解说创作工坊 · 本地优先 · Tauri 2 + React + Rust

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri&logoColor=black)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust 1.77+](https://img.shields.io/badge/Rust-1.77+-DEA584?logo=rust&logoColor=black)](https://www.rust-lang.org/)

---

## 这是什么

StoryFab 把「素材 → 高光拆条 → 解说文案 → TTS 配音 → 字幕烧录」全链路放在本地桌面应用里。

| 工作模式 | 适用场景 | 输出 |
| --- | --- | --- |
| **剪辑模式** | 直播回放、会议记录、游戏集锦 | 智能高光片段，多格式导出 |
| **解说模式** | 短剧、电影、综艺 | 5 步 Agent Pipeline 生成解说视频 |

**核心原则**：原始视频、字幕草稿、解说文案 100% 不离开设备。Whisper 离线转字幕、Edge TTS / Azure TTS 离线合成、FFmpeg 本地渲染，**零云端依赖**。

---

## 快速开始

### 下载安装

前往 [Releases](https://github.com/Agions/story-fab/releases) 下载对应平台安装包。

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| Windows | x64 | `StoryFab_*_x64-setup.exe` |
| macOS | Apple Silicon | `StoryFab_*_aarch64.dmg` |
| macOS | Intel | `StoryFab_*_x64.dmg` |
| Linux | x64 | `StoryFab_*_amd64.AppImage` |

**首次启动**会自动下载 FFmpeg 和 Whisper 二进制。

### 从源码构建

前置依赖：Node.js ≥ 18、npm、Rust ≥ 1.77、FFmpeg。

```bash
git clone https://github.com/Agions/story-fab.git
cd story-fab
npm install
npm run tauri -- dev        # 开发模式（Vite + Tauri 热重载）
npm run tauri -- build      # 生产构建
```

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│  前端   React 18 · TypeScript 5 · Vite · TailwindCSS           │
│           Zustand (5 store) · shadcn/ui · MultiTrackTimeline    │
└────────────────────────────┬────────────────────────────────────┘
                             │  Tauri 2 IPC (invoke)
┌────────────────────────────┴────────────────────────────────────┐
│  后端   Rust · Tauri 2 · tokio                                  │
│   ├─ ffmpeg         转码 / 硬字幕烧录 / 裁剪                    │
│   ├─ whisper        离线语音转字幕                              │
│   ├─ llm-providers  OpenAI · Anthropic · Google · DeepSeek · Qwen · 智谱 · 讯飞 · Moonshot · Local · Custom (10 家) │
│   ├─ tts-providers  Edge TTS · Azure TTS                        │
│   └─ commentary     Director → Visual → Narration → Timing → Overlay │
└─────────────────────────────────────────────────────────────────┘
```

详细：[docs/dev/architecture.md](docs/dev/architecture.md)

---

## 项目结构

```
story-fab/
├── src/                   # 前端源码
│   ├── components/        # React 组件 (按 PascalCase 目录)
│   ├── core/              # 核心业务层 (双服务层：core/ + services/)
│   ├── pages/             # 路由页面
│   ├── hooks/             # 自定义 React hooks
│   ├── store/             # Zustand 状态
│   └── shared/            # 跨层共享工具、类型、常量
├── src-tauri/             # Rust 后端
│   └── src/
│       ├── commands/      # Tauri IPC 命令
│       ├── llm/           # LLM Provider 实现
│       ├── render/        # FFmpeg 渲染
│       └── subtitle/      # Whisper 字幕
├── docs/                  # VitePress 文档站
│   ├── guide/             # 用户指南
│   ├── dev/               # 开发文档 + ADR
│   └── reference/         # 参考文档
├── assets/                # 品牌资源 (logo SVG)
├── scripts/               # 校验脚本 (lint / check-antd / check-naming)
└── .github/workflows/     # CI/CD
```

---

## 开发命令

```bash
# 前端
npm run dev                  # Vite 开发服务器（端口 1430）
npm run build                # 生产构建
npm run build:budget         # Bundle 预算校验
npm run build:ci             # 构建 + 预算校验
npm run build:prod           # 生产模式构建
npm run preview              # 预览生产构建
npm run test                 # Vitest 单元测试
npm run test:run             # Vitest 一次性跑（CI 风格）
npm run test:coverage        # 覆盖率
npm run test:ui              # Vitest 交互式 UI
npm run test:ci              # 覆盖率 + CI 报告
npm run lint                 # ESLint（src/, max-warnings 200）
npm run lint:fix             # ESLint 自动修复
npm run format               # Prettier 格式化
npm run format:check         # Prettier 检查
npm run type-check           # tsc --noEmit
npm run clean                # 删除 dist/

# Tauri
npm run tauri -- dev            # 启动桌面应用开发
npm run tauri -- build          # 桌面应用生产构建

# 文档
npm run docs:dev             # VitePress 文档开发
npm run docs:build           # VitePress 构建静态站点
npm run docs:preview         # 预览文档站

# 验证 (CI 同样执行)
npm run verify:antd          # 禁止 antd 引用
npm run verify:naming        # 命名规范校验
npm run verify:all           # 一键运行所有验证

# Git hooks
bash scripts/install-hooks.sh        # 安装 pre-commit 校验
```

---

## 命名规范

| 实体 | 规则 | 示例 |
| --- | --- | --- |
| React 组件 | PascalCase | `MultiTrackTimeline.tsx` |
| Hook | camelCase + `use` 前缀 | `useProjectList.ts` |
| 工具函数 | camelCase | `formatTime.ts` |
| 业务目录（`pages/`、`components/` 等） | PascalCase | `pages/VideoEditor/` |
| 顶级目录（`core/`、`services/` 等） | kebab-case | `core/services/` |
| 常量 | SCREAMING_SNAKE_CASE | `MODEL_PROVIDERS` |

校验脚本：`npm run verify:naming`（`scripts/check-naming.mjs`）。

---

## 文档导航

- [用户指南](docs/guide/index.md)
- [快速开始](docs/guide/quick-start.md)
- [解说模式](docs/guide/commentary-mode.md)
- [系统架构](docs/dev/architecture.md)
- [架构优化 ADR](docs/dev/architecture-optimization.md)
- [Tauri 命令](docs/dev/tauri-commands.md)
- [构建与发布](docs/dev/build-release.md)
- [FAQ](docs/reference/faq.md)
- [配置参考](docs/reference/config.md)

---

## 贡献

Fork → 分支 → 提交（遵循 [Conventional Commits](https://www.conventionalcommits.org/)）→ PR。

提交类型：`feat` / `fix` / `docs` / `refactor` / `perf` / `test` / `chore` / `style`。

新增 LLM / TTS Provider：实现 `core/services/providers/` 下的对应 trait，详见 [dev/ai-services.md](docs/dev/ai-services.md)。

---

## 许可证

[MIT](LICENSE)