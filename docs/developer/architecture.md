---
title: 系统架构
description: StoryFab v2.2.0 整体架构 · 前后端 + 解说模式 5 步 Pipeline + 一键成片
---

# 系统架构

StoryFab 是 Tauri 2 桌面应用:前端 React 18 + TypeScript 5,后端 Rust 1.77+。所有处理在本地完成,原始数据零上传。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | React 18、TypeScript 5、Vite 6、TailwindCSS 4 |
| UI 组件 | Base UI (`@base-ui/react`)、shadcn 风格 + Radix UI |
| 状态管理 | Zustand (4 个 store + history) |
| 路由 | React Router v6 (7 个页面,全部懒加载) |
| 桌面框架 | Tauri 2.x、Rust 1.77+、tokio |
| AI 能力 | `faster-whisper` (离线 ASR) + 10 LLM Provider + 多 TTS Provider |
| 媒体处理 | FFmpeg (转码 / 烧字幕 / 裁剪,GPU 加速) |

---

## 顶层架构

```
┌─────────────────────────────────────────────────────────────────┐
│  前端   React 18 · TypeScript 5 · Vite 6 · TailwindCSS 4       │
│           Zustand (4 store) · Base UI · MultiTrackTimeline      │
└────────────────────────────┬────────────────────────────────────┘
                             │  Tauri 2 IPC (50 个 invoke 命令)
┌────────────────────────────┴────────────────────────────────────┐
│  后端   Rust 1.77+ · Tauri 2 · tokio                            │
│   ├─ ffmpeg-sidecar     转码 / 硬字幕烧录 / 裁剪                │
│   ├─ whisper-rs         faster-whisper 离线语音转字幕           │
│   ├─ llm-providers      10 家 LLM (统一 `call_llm` 入口)        │
│   ├─ tts-providers      Edge TTS · Azure TTS 等                │
│   └─ commentary         Director → Visual → Narration → Timing → Overlay │
└─────────────────────────────────────────────────────────────────┘
```

---

## 依赖方向 (严格单向)

```
view → hook → store → service (core) → backend
```

任何反向引用视为架构违规。

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

详细流程: [commentary-workflow.md](commentary-workflow.md)

---

## 一键成片 Pipeline (FullPipeline)

新增端到端「一键成片」模式 — 串联 7 个步骤,用户只需选择素材 + 风格 + 点击生成。

实现位置: `src/core/pipeline/steps/full-pipeline.ts`

```
分析 → 拆条 → 文案 → 配音 → 字幕 → 合成 → 导出
```

特性:
- AsyncGenerator 模式 — 实时 yield 进度事件
- 单步可重试 / 跳过,错误不中断整体流程
- `cancel()` 支持用户中断
- 预留 facade payload 对齐位 (未来按真实 Tauri API 调整)

---

## 前端结构

```
src/
├── App.tsx                  路由 + Provider
├── main.tsx                 入口
├── components/              React 组件
│   ├── ui/                  Base UI 基座 (kebab-case 目录)
│   ├── common/              通用业务组件
│   ├── ai-clip/             AI 智能拆条组件
│   ├── commentary-panel/    解说编辑面板
│   ├── script-editor/       脚本编辑器
│   ├── timeline/            时间轴
│   ├── video-editor/        视频编辑器
│   └── video-info/          视频信息面板
├── core/                    核心业务层
│   ├── pipeline/            Pipeline 编排
│   │   └── steps/
│   │       ├── commentary/  5 步 Agent 实现
│   │       └── full-pipeline.ts  一键成片入口
│   ├── services/            业务服务 (12 个子目录)
│   │   ├── ai/              LLM 调用层 + 视觉/语音/脚本
│   │   ├── ai-clip/         AI 拆条
│   │   ├── asr/             Whisper 集成 (含 providers/ 子目录)
│   │   ├── auth/            认证
│   │   ├── commentary/      解说模式入口
│   │   ├── export/          渲染 + 转码
│   │   ├── file/            文件元数据
│   │   ├── pipeline/        剪辑模式流水线
│   │   ├── project/         项目存储
│   │   ├── providers/       LLM Provider 实现
│   │   ├── subtitle/        字幕 + 对齐
│   │   └── video/           视频元数据 (含 audioMix / transition-suggestion)
│   ├── tauri/               IPC 桥接
│   │   ├── invoke.ts        invoke 入口
│   │   ├── methods/         按域分组的方法
│   │   └── command-types.ts 命令名常量
│   ├── config/              配置项
│   │   └── ai-models/       AI 模型提供者元数据 + 动态目录
│   ├── types/               全局类型 (storyfab 域)
│   ├── errors/              错误处理 (AppError)
│   ├── utils/               工具
│   └── video/               视频处理抽象
├── pages/                   路由页面 (7 个, 全部懒加载)
│   ├── Home/
│   ├── Projects/
│   ├── ProjectDetail/
│   ├── ProjectEdit/
│   ├── ScriptDetail/
│   ├── Settings/
│   └── workspace/           工作台 (子包三分: edit-step/assemble/export/shared)
├── hooks/                   全局 React hooks
├── stores/                  Zustand 状态
│   ├── app-store.ts         运行时外观 (主题/侧边栏/最近项目)
│   ├── project-store.ts     项目元数据 + 步骤状态机
│   ├── editor-store.ts      时间线/剪辑/播放
│   ├── settings-store.ts    用户偏好持久层
│   ├── timeline-store.ts    时间轴 (测试用)
│   └── create-history.ts    撤销/重做栈
├── shared/                  跨层共享
│   ├── constants/
│   ├── errors/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── types/                   全局类型 (统一 @/types)
└── providers/                React Provider
```

### Zustand Stores

| Store | 职责 |
| --- | --- |
| `useAppStore` | 运行时外观 (主题、侧边栏、最近项目、autoSave) |
| `useProjectStore` | 项目元数据 + 步骤状态机 (project/mode/step/video/script/voice/synthesis) |
| `useEditorStore` | 时间线轨道/剪辑/播放 (含 undo/redo) |
| `useSettingsStore` | 用户偏好持久层 (AI 选择 + 密钥) |

Store 边界:
- `useAppStore` / `useSettingsStore`: 设备级,跨项目
- `useProjectStore`: 项目级元数据
- `useEditorStore`: 工作态 (按项目切换)

### 路由

| 路由 | 组件 | 懒加载 |
| --- | --- | --- |
| `/` | Home | 是 |
| `/projects` | Projects | 是 |
| `/projects/:id` | ProjectDetail | 是 |
| `/projects/:id/edit` | ProjectEdit | 是 |
| `/scripts/:id` | ScriptDetail | 是 |
| `/editor/:id` | Workspace | 是 |
| `/settings` | Settings | 是 |

---

## 后端结构 (Rust)

```
src-tauri/
├── src/
│   ├── main.rs                  Tauri 入口
│   ├── lib.rs                   库入口
│   ├── commands/                IPC 命令 (按域分组, 50 个命令)
│   │   ├── commentary/          解说模式后端
│   │   ├── project/             项目管理
│   │   └── render/              渲染 + 智能拆条
│   ├── llm/                     LLM Provider
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
├── capabilities/                Tauri 权限配置
└── icons/                       应用图标
```

### 关键 IPC 命令 (代表性,共 50 个)

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

完整命令列表: [tauri-commands.md](tauri-commands.md)

### 二进制管理

首次启动自动下载 FFmpeg / Whisper 二进制到 `<config-dir>/bin/`,可通过环境变量覆盖:

```bash
export STORYFAB_FFMPEG_PATH=/custom/path/ffmpeg
export STORYFAB_EDGE_TTS_PATH=/custom/path/edge-tts
export STORYFAB_RESOURCE_PERMITS=200
```

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
5. **状态机迁移**: 17 个组件迁移到 useReducer 状态机 + createReducer 工厂 (统一范式)

---

## 验证

```bash
# 前端
npm run type-check       # tsc --noEmit
npm run lint             # ESLint
npm run test             # Vitest 单元测试 (721 tests)
npm run verify:all       # 一键运行所有 verify

# 后端
cargo check --manifest-path src-tauri/Cargo.toml
cargo test  --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
```
