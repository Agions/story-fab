---
title: 系统架构
description: StoryFab v2.2.0 整体架构 · 前后端 + 双服务层 + 解说模式 5 步 Pipeline
---

# 系统架构

StoryFab 是 Tauri 2 桌面应用:前端 React 18 + TypeScript,后端 Rust 1.77+。所有处理在本地完成,原始数据零上传。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | React 18、TypeScript 5、Vite 6、TailwindCSS 4 |
| UI 组件 | Base UI (`@base-ui/react`)、shadcn 风格 + Radix UI |
| 状态管理 | Zustand (5 个 store) |
| 路由 | React Router v6 (9 个懒加载页面) |
| 桌面框架 | Tauri 2.x、Rust 1.77+、tokio |
| AI 能力 | `faster-whisper` (6 档模型) + 10 LLM Provider + 2 TTS Provider |
| 媒体处理 | FFmpeg (转码 / 烧字幕 / 裁剪,GPU 加速) |

---

## 顶层架构

```
┌─────────────────────────────────────────────────────────────────┐
│  前端   React 18 · TypeScript 5 · Vite 6 · TailwindCSS 4       │
│           Zustand (5 store) · Base UI · MultiTrackTimeline      │
└────────────────────────────┬────────────────────────────────────┘
                             │  Tauri 2 IPC (61 个 invoke 命令)
┌────────────────────────────┴────────────────────────────────────┐
│  后端   Rust 1.77+ · Tauri 2 · tokio                            │
│   ├─ ffmpeg-sidecar     转码 / 硬字幕烧录 / 裁剪                │
│   ├─ whisper-rs         faster-whisper 离线语音转字幕           │
│   ├─ llm-providers      10 家 LLM (统一 `call_llm` 入口)        │
│   ├─ tts-providers      Edge TTS · Azure TTS                   │
│   └─ commentary         Director → Visual → Narration → Timing → Overlay │
└─────────────────────────────────────────────────────────────────┘
```

---

## 双服务层 (ADR-101)

`src/services/` 与 `src/core/services/` 职责严格分离:

| 层 | 路径 | 职责 | 依赖 |
| --- | --- | --- | --- |
| **shim 层** | `src/services/` | 薄包装,封装 Tauri IPC `invoke` | 只能调 `core/tauri` |
| **业务层** | `src/core/services/` | 纯业务逻辑,可独立测试 | 无 Tauri 依赖 |

**依赖方向**(严格单向):

```
view → hook → store → service (core) → backend
```

任何反向引用视为架构违规。`src/services/README.md` 记录完整边界说明。

---

## 5 步解说模式 Pipeline (ADR-103)

```
视频 + Whisper 字幕
        │
        ▼
  1. Director     策划节奏 / 段落优先级 / 风格定位
        │
        ▼
  2. Visual       镜头语义分段 + 关键帧提取
        │
        ▼
  3. Narration    LLM 生成逐句解说词
        │
        ▼
  4. Timing       字幕与配音时间轴对齐
        │
        ▼
  5. Overlay      烧字幕 + 视觉叠加层
        │
        ▼
      成片
```

**累积式 state chain**: 每步的输入 = 上一步的输出 + 当前步配置,类型安全 + 单元测试覆盖。

实现位置: `src/core/pipeline/steps/commentary/`

- `CommentaryDirectorStep` — Director Agent 策划
- `CommentaryVisualStep` — 视觉分析
- `CommentaryNarrationStep` — LLM 生成
- `CommentaryTimingStep` — 时间对齐
- `CommentaryOverlayStep` — 字幕烧录
- `CompositeCommentaryPipeline` — 编排器
- `commentary.test.ts` — 单元测试覆盖

详细流程: [commentary.md](commentary.md)

---

## 前端结构

```
src/
├── App.tsx                  路由 + Provider
├── main.tsx                 入口
├── components/              React 组件
│   ├── ui/                  Base UI 基座 (kebab-case 目录)
│   ├── common/              通用业务组件
│   ├── AIClip/              AI 智能拆条组件
│   ├── CommentaryPanel/     解说编辑面板
│   ├── ScriptEditor/        脚本编辑器
│   ├── Timeline/            时间轴
│   ├── VideoEditor/         视频编辑器
│   └── ...                  其他业务组件 (PascalCase 目录)
├── core/                    核心业务层
│   ├── pipeline/            Pipeline 编排
│   │   └── steps/
│   │       └── commentary/  5 步 Agent 实现
│   ├── services/            业务服务 (14 个子模块)
│   │   ├── ai/              LLM 调用层
│   │   ├── aiClip/          AI 拆条
│   │   ├── asr/             Whisper 集成 (含 providers/ 子目录)
│   │   ├── auth/            认证
│   │   ├── commentary/      解说模式入口
│   │   ├── editor/          时间轴编辑
│   │   ├── export/          渲染 + 转码
│   │   ├── file/            文件元数据
│   │   ├── pipeline/        剪辑模式流水线
│   │   ├── project/         项目存储
│   │   ├── providers/       LLM Provider 实现
│   │   ├── storage/         配置存储
│   │   ├── subtitle/        字幕 + 对齐
│   │   └── video/           视频元数据 (含 audioMix / transition-suggestion)
│   ├── tauri/               IPC 桥接
│   │   ├── TauriBridge.ts   invoke 入口
│   │   └── methods/         按域分组的方法
│   ├── interfaces/          业务接口
│   ├── types/               全局类型
│   ├── config/              配置项
│   ├── constants/           内部常量
│   ├── errors/              错误处理 (AppError)
│   ├── utils/               工具
│   └── workflow/            状态机
├── pages/                   路由页面 (9 个, 全部懒加载)
│   ├── Home/
│   ├── Dashboard/
│   ├── Projects/
│   ├── ProjectDetail/
│   ├── ProjectEdit/
│   ├── ScriptDetail/
│   ├── VideoEditor/
│   ├── AIVideoEditor/
│   └── Settings/
├── hooks/                   自定义 React hooks
├── store/                   Zustand 状态
│   ├── appStore             全局应用状态
│   ├── projectStore         项目 CRUD
│   ├── editorStore          当前编辑上下文
│   ├── timelineStore        时间轴轨道与片段
│   └── modelStore           AI 模型配置
├── shared/                  跨层共享
│   ├── constants/
│   ├── utils/
│   └── types/
├── providers/               React Provider
├── context/                 Context
└── styles/                  全局样式
```

### Zustand Stores

| Store | 职责 |
| --- | --- |
| `appStore` | 全局应用状态 (主题、设置) |
| `projectStore` | 项目列表、CRUD |
| `editorStore` | 当前编辑上下文 (含 track undo/redo) |
| `timelineStore` | 时间轴轨道与片段 |
| `modelStore` | AI 模型配置 |

Store 边界详见 `src/store/README.md`。

### 路由

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

---

## 后端结构 (Rust)

```
src-tauri/
├── src/
│   ├── main.rs                  Tauri 入口
│   ├── lib.rs                   库入口
│   ├── commands/                IPC 命令 (按域分组, 61 个命令)
│   │   ├── ai/                  TTS / 模型列表
│   │   ├── auto_save/           自动保存与崩溃恢复
│   │   ├── commentary/          解说模式后端
│   │   │   ├── commentary_synthesizer/
│   │   │   ├── director/        Director Agent
│   │   │   ├── script_generator/
│   │   │   └── synthesizer/     TTS 合成
│   │   ├── project/             项目管理
│   │   └── render/              渲染 + 智能拆条
│   │       ├── autonomous_cut/      自动拆条
│   │       └── autonomous_cut_impl/  自动拆条实现
│   ├── llm/                     LLM Provider
│   │   ├── anthropic.rs
│   │   ├── deepseek_qwen.rs
│   │   ├── gemini.rs
│   │   ├── openai.rs
│   │   ├── router.rs
│   │   └── providers/           按域分组实现
│   ├── render/                  FFmpeg 渲染
│   ├── subtitle/                Whisper 字幕
│   ├── video/                   视频元数据 + 抽帧
│   ├── highlight/               高光检测
│   ├── segment/                 语义分段
│   ├── binary/                  FFmpeg / Whisper 二进制管理
│   ├── utils/                   工具函数
│   ├── types.rs                 全局类型
│   └── lib.rs                   库入口
├── tests/                       Rust 集成测试
│   ├── resilience.rs            panic hook + 资源限额
│   ├── crash_recovery.rs        崩溃恢复
│   └── audio_mix.rs             音频混音纯函数
├── capabilities/                Tauri 权限配置
└── icons/                       应用图标
```

### 关键 IPC 命令 (代表性)

| 域 | 命令 | 用途 |
| --- | --- | --- |
| commentary | `start_director_analysis` | 启动 Director Agent 分析 |
| commentary | `generate_commentary_script` | 生成解说脚本 |
| commentary | `synthesize_commentary_audio` | 合成解说音频 |
| render | `render_autonomous_cut` | 智能拆条渲染 |
| render | `burn_subtitles` | 烧录字幕 |
| render | `detect_highlights` | 检测高光 |
| llm | `call_llm` | LLM 统一调用入口 |
| subtitle | `whisper_transcribe` | Whisper 离线转写 |
| project | `analyze_video` | 视频元数据 |
| ai | `synthesize_speech` | TTS 语音合成 |

完整 61 个命令: [tauri-commands.md](tauri-commands.md)

### 二进制管理

首次启动自动下载 FFmpeg / Whisper 二进制到 `<config-dir>/bin/`,可通过环境变量覆盖:

```bash
export CUTDECK_FFMPEG_PATH=/custom/path/ffmpeg       # FFmpeg 路径 (旧名前缀)
export CUTDECK_EDGE_TTS_PATH=/custom/path/edge-tts   # Edge TTS 路径 (旧名前缀)
export STORYFAB_RESOURCE_PERMITS=200                 # 进程资源限额
```

> 注: `CUTDECK_` 前缀是项目前身命名残留,保留以保持向后兼容。

### 错误处理

所有命令返回 `Result<T, TauriCommandError>`,错误枚举定义在 `src-tauri/src/` 下各域:

- `WhisperError` — 转写失败
- `FFmpegError` — 渲染失败
- `LLMError` — LLM 调用失败
- `IOError` — 文件 IO 失败
- `ConfigError` — 配置错误

### 异步模型

所有 IO 命令 `async`,CPU 密集任务 (编码、转码) 用 `tokio::task::spawn_blocking` 派发到 blocking 线程池,避免阻塞事件循环。

---

## 关键设计决策

1. **本地优先**: 所有 AI 在本地,原始数据零上传
2. **状态层边界**: view → hook → store → service → backend,单向依赖
3. **类型驱动**: 核心数据流用 TypeScript interface 串联,编译时捕获错误
4. **渐进式渲染**: 渲染任务可暂停 / 恢复 / 重试,从失败点继续
5. **状态机迁移**: 18 个组件迁移到 useReducer 状态机 (消除 141 个 useState, +469 tests)

---

## 验证

```bash
# 前端
npm run type-check       # tsc --noEmit
npm run lint             # ESLint
npm run test             # Vitest 单元测试
npm run verify:all       # 一键运行所有 verify

# 后端
cargo check --manifest-path src-tauri/Cargo.toml
cargo test  --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
```
