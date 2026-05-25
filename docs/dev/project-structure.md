# Project Structure

## Repository Layout

```
CutDeck/
├── src/                              # React 前端
│   ├── components/                   # React UI 组件
│   │   ├── AIClip/                   # AI 剪辑面板
│   │   ├── CommentaryPanel/          # 🆕 解说模式面板
│   │   │   ├── CommentaryPanel.tsx   # 主容器
│   │   │   ├── ScriptEditor.tsx      # 解说词编辑器
│   │   │   ├── StyleSelector.tsx      # 风格选择器
│   │   │   ├── CommentaryPreview.tsx # 解说预览（含配音播放）
│   │   │   └── CommentaryTimeline.tsx # 解说时间轴
│   │   ├── CutDeck/                  # 主编辑器（context + workspace）
│   │   ├── Layout/                   # 布局组件
│   │   ├── ModelSelector/            # 模型选择器
│   │   ├── ScriptEditor/             # 脚本编辑器
│   │   ├── Settings/                 # 设置页
│   │   └── common/                   # 通用组件
│   ├── core/                         # 核心业务逻辑
│   ├── services/
│   │   ├── ai/                  # AI 模型适配（多提供商）
│   │   ├── aiClip/             # AI 剪辑分析
│   │   ├── clip-pipeline/      # 剪辑管道（7步）
│   │   ├── commentary/          # 🆕 解说服务
│   │   │   ├── index.ts         # 导出入口
│   │   │   ├── DirectorAgent.ts # AI 导演状态机
│   │   │   ├── ScriptGenerator.ts # LLM 解说词生成
│   │   │   ├── CommentarySynth.ts # 配音合成服务
│   │   │   └── types.ts         # 解说相关类型
│   │   ├── editor/             # 编辑器操作
│   │   ├── export/             # 导出服务（剪映/Jianying）
│   │   ├── subtitle/           # 字幕服务
│   │   ├── providers/          # API 提供商（OpenAI/Anthropic/...）
│   │   ├── video/              # 视频处理
│   │   │   ├── audio-mix.service.ts  # 🆕 TTS 配音混音服务
│   │   │   └── transition-suggestion.ts  # 🆕 自动转场建议（30+ 规则矩阵）
│   │   └── pipeline/           # Step 模式管道
│   │   ├── hooks/                   # React Hooks
│   │   ├── config/                  # AI 模型 / 平台预设配置
│   │   ├── types/                   # 共享类型（Jianying/Timeline）
│   │   ├── video/                   # 视频抽象层（TauriVideoProcessor）
│   │   └── tauri/                   # TauriBridge 封装
│   ├── pages/                        # 路由页面
│   │   ├── Projects/                # 项目列表
│   │   ├── ScriptDetail/            # 脚本详情
│   │   ├── Settings/                # 设置页
│   │   └── VideoEditor/             # 视频编辑器
│   ├── store/                        # Zustand 状态管理
│   ├── shared/                       # 跨层共享工具
│   │   ├── types/                  # 共享类型
│   │   └── utils/                  # 工具函数
│   └── theme/                        # 主题色彩
│
├── src-tauri/                        # Rust 后端
│   ├── src/
│   │   ├── lib.rs                  # 库入口 + 命令注册 + plugin 配置
│   │   ├── main.rs                 # 二进制入口
│   │   ├── types.rs               # 共享 Rust 类型（IPC 输入/输出结构体）
│   │   ├── binary.rs              # FFmpeg/FFprobe 路径解析
│   │   ├── utils.rs               # 日志、时间戳、错误辅助函数
│   │   ├── video_processor.rs     # 视频裁剪/混音（FFmpeg）
│   │   ├── highlight_detector.rs  # 高光检测（音频能量峰值）
│   │   ├── smart_segmenter.rs     # 智能分段（场景/静默/对话）
│   │   ├── subtitle.rs            # Whisper 字幕转录
│   │   ├── llm_proxy.rs          # 🆕 LLM API 代理（隐藏密钥）
│   │   └── commands/              # Tauri IPC 命令处理
│   │       ├── mod.rs             # 命令模块统一导出
│   │       ├── ai.rs             # Whisper / 高光检测 / AI 导演
│   │       ├── llm.rs            # 🆕 LLM 交互（代理）
│   │       ├── commentary.rs     # 🆕 解说专用命令
│   │       ├── project.rs        # 项目文件 CRUD
│   │       ├── ffprobe.rs        # 视频元数据分析
│   │       ├── file_ops.rs       # 文件系统操作
│   │       ├── auto_save.rs      # 自动保存
│   │       ├── export_state.rs   # 导出状态
│   │       └── render/            # 渲染子模块
│   │           ├── mod.rs
│   │           ├── transcode.rs          # 比例裁剪 + 完整导出
│   │           ├── autonomous_cut.rs     # AI 多段切割
│   │           ├── preview.rs            # 预览生成
│   │           ├── subtitle_burnin.rs    # 字幕烧录
│   │           └── ffmpeg_builder.rs     # FFmpeg 命令构建器
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│
├── docs/                             # VitePress 文档
│   ├── dev/                         # 开发者文档
│   │   ├── architecture.md         # 系统架构 v3（🆕 Commentary 架构）
│   │   ├── commentary-workflow.md  # 🆕 解说工作流设计
│   │   ├── director-agent.md       # 🆕 AI Director Agent 设计
│   │   ├── script-generation.md    # 🆕 LLM 文案生成原理
│   │   ├── backend.md             # Rust 后端
│   │   ├── frontend.md            # React 前端
│   │   ├── tauri-commands.md      # IPC 命令参考（🆕 Commentary 命令）
│   │   ├── project-structure.md   # 项目结构（🆕 新增模块）
│   │   ├── ai-services.md         # AI 服务抽象
│   │   └── build-release.md       # 构建发布
│   ├── guide/                       # 用户指南
│   │   ├── index.md               # 介绍（🆕 解说模式说明）
│   │   ├── quick-start.md         # 快速开始
│   │   ├── ai-analysis.md        # AI 分析原理
│   │   ├── script-generation.md   # 🆕 解说词生成
│   │   ├── commentary-mode.md     # 🆕 解说模式使用指南
│   │   ├── export.md             # 导出
│   │   ├── configuration.md       # 配置
│   │   ├── keyboard-shortcuts.md  # 快捷键
│   │   └── installation.md        # 安装
│   └── reference/                   # 参考文档
│       └── faq.md                  # 常见问题
├── public/                          # 静态资源（logo, icons）
├── package.json
└── vite.config.ts
```

---

## Commentary Mode 新增模块

### TypeScript 前端（`src/core/services/commentary/`）

```
commentary/
├── index.ts              # 导出入口，DirectorAgent 工厂函数
├── DirectorAgent.ts      # AI 导演状态机（核心编排引擎）
├── ScriptGenerator.ts    # LLM 解说词生成（Prompt 工程）
├── CommentarySynth.ts   # 配音合成（TTS + 时间轴对齐）
└── types.ts             # Commentary 相关类型定义
```

**核心类**：
- `DirectorAgent` — 管理 Commentary Mode 全流程状态机
- `ScriptGenerator` — 生成解说词（含 prompt 模板 + 质量检查）
- `CommentarySynth` — 调用 Edge TTS，生成配音音频

### Rust 后端新增（`src-tauri/src/`）

```
llm_proxy.rs            # 🆕 LLM API 代理（隐藏密钥，统一路由）
commands/commentary.rs   # 🆕 解说专用命令（LLM 调用 / 配音合成 / 渲染）
```

---

## 关键文件

| 文件 | 用途 |
|---|---|
| `src/core/tauri/TauriBridge.ts` | 所有前端 → Rust IPC 调用 |
| `src/core/services/commentary/DirectorAgent.ts` | 🆕 Commentary Mode 状态机 |
| `src/core/services/commentary/ScriptGenerator.ts` | 🆕 LLM 解说词生成 |
| `src/core/services/providers/` | AI 提供商抽象（OpenAI / Anthropic / DeepSeek 等） |
| `src/components/CutDeck/context/CutDeckProvider.tsx` | 主工作流状态 |
| `src/components/CommentaryPanel/` | 🆕 解说模式 UI 组件 |
| `src-tauri/src/lib.rs` | Tauri 应用配置、命令注册 |
| `src-tauri/src/llm_proxy.rs` | 🆕 LLM API 代理 |
| `src-tauri/src/commands/commentary.rs` | 🆕 解说专用命令 |
| `src-tauri/src/commands/ai.rs` | Whisper、高光检测、AI 导演 |
| `src-tauri/src/commands/render/` | 视频导出管道 |
| `src-tauri/src/types.rs` | Rust IPC 类型定义 |
| `tauri.conf.json` | Tauri 应用配置（标题、identifier、capabilities） |

---

## 新增文件清单（v3.0 Commentary）

### TypeScript 前端

|| 文件 | 说明 |
|---|---|
| `src/core/services/commentary/index.ts` | 导出入口 |
| `src/core/services/commentary/DirectorAgent.ts` | AI 导演状态机 |
| `src/core/services/commentary/ScriptGenerator.ts` | LLM 解说词生成 |
| `src/core/services/commentary/CommentarySynth.ts` | TTS 配音合成 |
| `src/core/services/commentary/types.ts` | 类型定义 |
| `src/core/services/video/audio-mix.service.ts` | 🆕 TTS 配音混音服务 |
| `src/core/services/video/transition-suggestion.ts` | 🆕 自动转场建议（30+ 规则矩阵）|
| `src/components/CommentaryPanel/CommentaryPanel.tsx` | 解说面板主容器 |
| `src/components/CommentaryPanel/ScriptEditor.tsx` | 解说词编辑器 |
| `src/components/CommentaryPanel/StyleSelector.tsx` | 风格选择器 |
| `src/components/CommentaryPanel/CommentaryPreview.tsx` | 解说预览 |
| `src/components/CommentaryPanel/CommentaryTimeline.tsx` | 解说时间轴 |

### Rust 后端

| 文件 | 说明 |
|---|---|
| `src-tauri/src/llm_proxy.rs` | LLM API 代理（隐藏密钥） |
| `src-tauri/src/commands/commentary.rs` | 解说专用命令 |

### 文档

| 文件 | 说明 |
|---|---|
| `docs/dev/architecture.md` | 系统架构 v3（重写） |
| `docs/dev/commentary-workflow.md` | 解说工作流设计（新增） |
| `docs/dev/director-agent.md` | AI Director Agent 设计（新增） |
| `docs/dev/script-generation.md` | LLM 文案生成原理（新增） |
| `docs/guide/commentary-mode.md` | 解说模式使用指南（新增） |
| `docs/guide/script-generation.md` | 解说词生成指南（新增） |

---

## 模块依赖关系

```
CommentaryPanel (UI)
    │
    ▼
DirectorAgent (状态机编排)
    │
    ├──► ScriptGenerator (LLM 生成解说词)
    │       │
    │       └──► call_llm (Rust 代理)
    │
    ├──► CommentarySynth (TTS 配音)
    │       │
    │       ├──► synthesize_commentary_audio (Rust)
    │       └──► mix_audio (Rust)
    │
    └──► Render Engine (Rust)
            │
            └──► render_with_commentary (Rust)
```