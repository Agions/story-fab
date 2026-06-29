<!--
SPDX-License-Identifier: MIT
-->

# StoryFab

> 开源 AI 影视解说创作工坊 · 本地优先 · Tauri 2 + React 18 + Rust

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri&logoColor=black)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust 1.77+](https://img.shields.io/badge/Rust-1.77+-DEA584?logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![Version](https://img.shields.io/badge/version-2.2.0-brightgreen.svg)](CHANGELOG.md)

[更新日志](CHANGELOG.md) · [文档站](https://agions.github.io/story-fab/)

---

## 这是什么

StoryFab 把「素材 → 高光拆条 → 解说文案 → TTS 配音 → 字幕烧录」全链路放在**本地桌面应用**里。视频、字幕草稿、解说文案 100% 不离开设备。

| 工作模式 | 适用场景 | 核心能力 |
| --- | --- | --- |
| **剪辑模式** | 直播回放、会议记录、游戏集锦 | AI 高光检测 + 多比例导出 |
| **解说模式** | 短剧、电影、综艺 | 5 步 Agent Pipeline 生成解说视频 |

**核心原则**：Whisper 离线转字幕、Edge TTS / Azure TTS 本地合成、FFmpeg 本地渲染——**零云端依赖**。

---

## 特性

- 🎬 **两种工作模式** — 剪辑模式（高光拆条）+ 解说模式（5 步 Agent Pipeline）
- 🤖 **10 家 LLM Provider** — OpenAI、Anthropic、Google、Alibaba（Qwen）、Zhipu（智谱）、iFlytek（讯飞）、DeepSeek、Moonshot（Kimi）、Local、Custom
- 🗣️ **2 套 TTS 引擎** — Edge TTS（免费几十种音色）+ Azure TTS（需 API 密钥）
- 🎙️ **本地 Whisper** — `faster-whisper` 离线转写，6 档模型（tiny / base / small / medium / large-v2 / large-v3）
- 🎞️ **多比例导出** — 9:16、1:1、16:9、4:5、21:9，硬字幕烧录 + 软字幕双轨
- 🧠 **Director Agent** — 多轮对话式策划，节奏 / 停顿 / 语气可控
- 🔒 **100% 本地** — 原始视频、字幕、脚本不上传任何云端
- ⚡ **GPU 加速渲染** — FFmpeg NVENC / VideoToolbox 硬编

---

## 快速开始

### 下载安装

前往 [Releases](https://github.com/Agions/story-fab/releases) 下载对应平台安装包：

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| Windows | x64 | `StoryFab_*_x64-setup.exe` |
| macOS | Apple Silicon | `StoryFab_*_aarch64.dmg` |
| macOS | Intel | `StoryFab_*_x64.dmg` |
| Linux | x64 | `StoryFab_*_amd64.AppImage` |

**首次启动**会自动下载 FFmpeg 和 Whisper 二进制到本地配置目录。

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
│  前端   React 18 · TypeScript 5 · Vite 6 · TailwindCSS 4       │
│           Zustand (5 store) · shadcn/ui · MultiTrackTimeline    │
└────────────────────────────┬────────────────────────────────────┘
                             │  Tauri 2 IPC (61 个 invoke 命令)
┌────────────────────────────┴────────────────────────────────────┐
│  后端   Rust 1.77+ · Tauri 2 · tokio                            │
│   ├─ ffmpeg-sidecar    转码 / 硬字幕烧录 / 裁剪                 │
│   ├─ whisper-rs        离线语音转字幕（faster-whisper）         │
│   ├─ llm-providers     10 家 LLM（统一 `call_llm` 入口）        │
│   ├─ tts-providers     Edge TTS · Azure TTS                    │
│   └─ commentary        Director → Visual → Narration → Timing → Overlay │
└─────────────────────────────────────────────────────────────────┘
```

详细架构：[docs/dev/architecture.md](docs/dev/architecture.md)

---

## 项目结构

```
story-fab/
├── src/                   # 前端源码（React 18 + TS 5）
│   ├── components/        # React 组件（按 PascalCase 业务目录）
│   ├── core/              # 核心业务层（双服务层：core/services + services）
│   │   ├── pipeline/      # Pipeline 编排（解说模式 5 步）
│   │   ├── services/      # 业务服务（13 个子目录，editor/ 内含 storage.ts）
│   │   ├── tauri/         # Tauri IPC 桥接
│   │   ├── interfaces/    # 业务接口
│   │   └── types/         # 全局类型
│   ├── pages/             # 路由页面（9 个懒加载）
│   ├── hooks/             # 自定义 React hooks
│   ├── store/             # Zustand 状态（5 个 store）
│   └── shared/            # 跨层共享工具 / 类型 / 常量
├── src-tauri/             # Rust 后端
│   └── src/
│       ├── commands/      # Tauri IPC 命令（61 个，按域分组）
│       ├── llm/           # LLM Provider（含 providers/ 子目录）
│       ├── render/        # FFmpeg 渲染
│       └── subtitle/      # Whisper 字幕
├── docs/                  # VitePress 文档站
│   ├── guide/             # 用户指南
│   ├── dev/               # 开发文档 + ADR
│   └── reference/         # 参考文档
├── assets/                # 品牌资源（logo SVG）
├── scripts/               # 校验脚本（lint / check-antd / check-naming）
└── .github/workflows/     # CI/CD
```

详细目录说明：[docs/dev/project-structure.md](docs/dev/project-structure.md)

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
npm run test                 # Vitest 单元测试（watch 模式）
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

# 验证（CI 同样执行）
npm run verify:antd          # 禁止 antd 引用
npm run verify:naming        # 命名规范校验
npm run verify:all           # 一键运行所有验证
```

---

## 命名规范

| 实体 | 规则 | 示例 |
| --- | --- | --- |
| React 组件（业务） | PascalCase 文件 + 目录 | `VideoEditor/index.tsx` |
| React 组件（通用） | kebab-case 目录 | `components/ui/button.tsx` |
| Hook | camelCase + `use` 前缀 | `useProjectList.ts` |
| 工具函数 | camelCase | `formatTime.ts` |
| 业务目录（`pages/`、`components/` 等） | PascalCase | `pages/VideoEditor/` |
| 顶级目录（`core/`、`services/` 等） | kebab-case | `core/services/` |
| 常量 | SCREAMING_SNAKE_CASE | `MODEL_PROVIDERS` |

校验脚本：`npm run verify:naming`（`scripts/check-naming.mjs`）。

---

## 文档导航

### 用户指南

- [用户指南首页](docs/guide/index.md)
- [安装指南](docs/guide/installation.md)
- [快速开始](docs/guide/quick-start.md)
- [解说模式](docs/guide/commentary-mode.md)
- [AI 分析](docs/guide/ai-analysis.md)
- [脚本生成](docs/guide/script-generation.md)
- [导出](docs/guide/export.md)
- [配置](docs/guide/configuration.md)
- [键盘快捷键](docs/guide/keyboard-shortcuts.md)

### 开发文档

- [系统架构](docs/dev/architecture.md)
- [项目结构](docs/dev/project-structure.md)
- [解说工作流](docs/dev/commentary.md)
- [AI 服务](docs/dev/ai-services.md)
- [Tauri 命令](docs/dev/tauri-commands.md)
- [构建与发布](docs/dev/build-release.md)

### 参考

- [配置参考](docs/reference/config.md)
- [常见问题](docs/reference/faq.md)

---

## 贡献

Fork → 分支 → 提交（遵循 [Conventional Commits](https://www.conventionalcommits.org/)）→ PR。

提交类型：`feat` / `fix` / `docs` / `refactor` / `perf` / `test` / `chore` / `style`。

新增 LLM / TTS Provider：实现 `core/services/providers/` 下的对应 trait，详见 [dev/ai-services.md](docs/dev/ai-services.md)。

---

## 许可证

[MIT](LICENSE)
