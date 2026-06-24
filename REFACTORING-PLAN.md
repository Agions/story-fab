# StoryFab 影视解说系统深度重构方案

> 目标：将 StoryFab 从"通用视频编辑器+解说功能"改造为"影视/短剧解说业务专用高性能系统"

---

## 第一部分：业务流程调研结论

### 影视/短剧解说行业标准工作流

经深入研究，影视解说行业的标准化制作流程为 **6 步线性流水线**：

```
素材导入 → 智能分析 → 脚本创作 → 语音合成 → 视频合成 → 导出发布
 Ingest    Analyze    Script     Voice     Compose    Export
```

#### 各环节核心逻辑与技术需求

| 步骤 | 业务逻辑 | 技术需求 | 当前覆盖度 |
|------|----------|----------|-----------|
| **1. 素材导入** | 导入视频文件，提取元数据（时长/分辨率/帧率/码率） | FFmpeg probe、文件 I/O | ✅ 已覆盖（ffprobe.rs + file_ops.rs） |
| **2. 智能分析** | 场景检测 + 关键帧提取 + 音频能量分析 + 高光片段识别 | 场景分割算法、音频分析（能量/ZCR）、关键帧提取 | ✅ 已覆盖（highlight/ + segment/） |
| **3. 脚本创作** | LLM 生成解说词（悬念开头→剧情梳理→高潮→结尾），支持 5 种风格预设 | LLM 调用、prompt engineering、风格控制 | ✅ 已覆盖（llm.rs + script_generator/） |
| **4. 语音合成** | TTS 合成解说音频，支持音色/语速/情感调节 | Edge TTS / Azure TTS / 本地 TTS | ✅ 已覆盖（synthesizer/ + ai.rs） |
| **5. 视频合成** | 按脚本时间轴裁剪画面 + 烧录字幕 + 混合解说音频 + 转场特效 | FFmpeg 滤镜链、字幕烧录、音频混合 | ⚠️ 部分覆盖（render/ + autonomous_cut/ 分散） |
| **6. 导出发布** | 多格式导出（MP4/WebM/GIF）、多分辨率（720p-4K）、平台适配 | FFmpeg 编码、硬件加速（NVENC/VideoToolbox/VAAPI） | ✅ 已覆盖（export_state.rs + render/） |

#### 行业趋势与技术要点

1. **AI Agent 化**：多模态 Agent 自动分析剧情（Qwen-VL、Gemini 视觉理解）
2. **一键成片**：从素材到成片的全自动化程度大幅提升
3. **风格化模板**：AI 自动适配不同解说风格（幽默/严肃/悬疑/温情）
4. **批量生产**：支持批量套用模板、批量生成
5. **本地优先**：隐私保护 + 零上传 + 离线可用（StoryFab 的核心优势）

### 调研结论

**StoryFab 的 5 步流水线（Director → Visual → Narration → Timing → Overlay）与行业标准 6 步流程高度吻合**，但存在以下差距：

1. 流水线不是强制路径——存在大量绕过流水线的替代入口
2. 步骤粒度不匹配——行业标准的"素材导入"和"导出"是独立步骤，当前被吞没
3. 存在大量与解说流程无关的通用编辑功能

---

## 第二部分：当前架构深度诊断

### 问题 1：身份模糊——通用编辑器 vs 解说专用系统

**症状**：存在两套并行的功能路径

```
路径 A（通用编辑器）：Home → Projects → VideoEditor（独立页面）
路径 B（解说流水线）：Home → Projects → StoryFab/Workspace（5步流水线）
```

**具体表现**：
- `src/components/Timeline/` vs `src/components/VideoEditor/Timeline.tsx` — 两套时间线
- `src/components/ScriptEditor/` vs `src/components/CommentaryPanel/CommentaryScriptEditor.tsx` — 两套脚本编辑器
- `src/components/VideoEditor/` vs `src/components/StoryFab/workspace/` — 两套视频处理流程
- `src/components/VideoProcessingController/` — 独立的第三方视频处理控制器

**影响**：用户困惑、维护成本翻倍、功能不一致

### 问题 2：模块冗余严重

| 冗余模块 | 问题 |
|----------|------|
| `src/core/services/auth/` | 本地优先应用无需认证 |
| `src/core/services/aiClip/` | 与 commentary pipeline 功能重叠 |
| `src/core/services/pipeline/clip-pipeline/` | 与 core/pipeline/ 功能重叠 |
| `src/core/video/BaseVideoProcessor.ts` + `TauriVideoProcessor.ts` | 两层抽象过度 |
| `src-tauri/src/commands/commentary/synthesizer/` + `commentary_synthesizer/` | 功能重叠 |
| `src-tauri/src/commands/render/autonomous_cut/` + `autonomous_cut_impl/` | 两层目录过度 |
| `src/core/config/aiModels.config.ts` + `src/core/config/ai-models/` | 配置分散在两处 |
| `src/shared/` vs `src/core/utils/` vs `src/lib/` | 工具函数分散在三处 |

### 问题 3：命名混乱

```
# 目录命名：PascalCase vs kebab-case 混用
src/components/StoryFab/          # PascalCase
src/components/ui/                # kebab-case
src/components/VideoEditor/       # PascalCase
src/components/common/            # kebab-case

# 文件命名：三种风格混用
appStore.ts                       # camelCase
AppError.ts                       # PascalCase
alert-dialog.tsx                  # kebab-case

# 类型定义：6+ 个位置
src/core/types.ts                 # 510 行巨型文件
src/core/types/commentary.ts      # 子目录
src/core/video/types.ts           # 视频专用
src/core/video/highlight.types.ts # 高光专用
src/core/export/types.ts          # 导出专用
各组件自己的 types.ts              # 组件专用
```

### 问题 4：类型系统碎片化

`src/core/types.ts` 单文件 510 行，包含 Project、VideoAsset、Scene、Script、Voice、Subtitle、AIModel、WorkflowState、ExportSettings 等 **15+ 个不相关的类型定义**，违反单一职责原则。

### 问题 5：状态管理过度分散

5 个 Zustand Store 的依赖链：`appStore` ← `projectStore` ← `editorStore` ← `timelineStore`，加上独立的 `modelStore`。其中 `editorStore` 和 `timelineStore` 职责边界模糊。

### 问题 6：Tauri IPC 命令膨胀

61 个命令中，很多可以合并：
- `get_video_info` + `get_video_thumbnail` + `get_video_keyframes` + `extract_video_audio` → 素材导入子命令
- `detect_highlights` + `detect_scenes` + `get_audio_peaks` + `smart_segment` → 分析子命令
- `synthesize_tts` + `list_voices` + `commentary_synthesize` → 语音子命令

---

## 第三部分：目标架构设计

### 设计原则

1. **流水线驱动**：6 步解说流水线是唯一的主干路径
2. **单一职责**：每个模块只做一件事，每个类型只在一个位置定义
3. **消除二义性**：不存在两条路径做同一件事
4. **极致精简**：以最少的代码量实现最稳健的功能
5. **命名统一**：文件/目录 kebab-case，类型/组件 PascalCase

### 前端目标架构

```
src/
├── main.tsx                        # 入口
├── App.tsx                         # 路由（4 个页面）
├── app.css                         # 全局样式
│
├── types/                          # ★ 统一类型层（唯一类型源）
│   ├── index.ts                    # barrel export
│   ├── project.ts                  # 项目模型
│   ├── media.ts                    # 视频/音频媒体类型
│   ├── script.ts                   # 解说脚本类型
│   ├── voice.ts                    # 语音/TTS 类型
│   ├── timeline.ts                 # 时间线模型
│   ├── pipeline.ts                 # 流水线状态类型
│   ├── analysis.ts                 # AI 分析结果类型
│   └── export.ts                   # 导出配置类型
│
├── pipeline/                       # ★ 核心：6 步解说流水线引擎
│   ├── index.ts
│   ├── engine.ts                   # PipelineEngine 状态机
│   ├── context.ts                  # PipelineContext（步骤间数据流转）
│   ├── steps/                      # 6 个步骤实现
│   │   ├── ingest.ts               # 步骤 1：素材导入
│   │   ├── analyze.ts              # 步骤 2：智能分析
│   │   ├── script.ts               # 步骤 3：脚本创作
│   │   ├── voice.ts                # 步骤 4：语音合成
│   │   ├── compose.ts              # 步骤 5：视频合成
│   │   └── export.ts               # 步骤 6：导出发布
│   └── validators.ts               # 步骤间数据校验
│
├── services/                       # ★ 统一服务层
│   ├── ai.ts                       # AI 服务（LLM + 视觉分析）
│   ├── tts.ts                      # TTS 语音合成
│   ├── video.ts                    # 视频处理
│   ├── subtitle.ts                 # 字幕（ASR + 烧录）
│   ├── highlight.ts                # 高光检测
│   ├── project.ts                  # 项目存储
│   └── export.ts                   # 导出
│
├── bridge/                         # ★ Tauri IPC 桥接
│   ├── index.ts
│   ├── invoke.ts                   # 类型安全 invoke
│   ├── commands.ts                 # 命令常量（~30 个核心命令）
│   └── error.ts                    # 桥接错误类型
│
├── store/                          # ★ 状态管理（3 个 Store）
│   ├── index.ts
│   ├── app-store.ts                # 全局状态
│   ├── project-store.ts            # 项目 + 流水线状态
│   └── editor-store.ts             # 编辑器 + 时间线状态
│
├── hooks/                          # ★ 自定义 Hooks
│   ├── use-pipeline.ts             # 流水线 Hook
│   ├── use-project.ts              # 项目 Hook
│   ├── use-timeline.ts             # 时间线 Hook
│   ├── use-settings.ts             # 设置 Hook
│   └── use-keyboard.ts             # 快捷键 Hook
│
├── pages/                          # ★ 页面（4 个）
│   ├── home.tsx                    # 首页/欢迎页
│   ├── projects.tsx                # 项目列表
│   ├── workspace.tsx               # 主工作区（流水线 + 编辑器 + 导出）
│   └── settings.tsx                # 设置
│
├── components/                     # ★ UI 组件
│   ├── ui/                         # 基础 UI 原子组件（kebab-case，保持不变）
│   ├── layout/                     # 布局组件
│   │   ├── app-layout.tsx
│   │   ├── sidebar.tsx
│   │   └── top-bar.tsx
│   ├── workspace/                  # 工作区组件（对应流水线 6 步）
│   │   ├── ingest-panel.tsx        # 素材导入面板
│   │   ├── analyze-panel.tsx       # 智能分析面板
│   │   ├── script-panel.tsx        # 脚本创作面板
│   │   ├── voice-panel.tsx         # 语音合成面板
│   │   ├── compose-panel.tsx       # 视频合成面板
│   │   ├── export-panel.tsx        # 导出面板
│   │   └── step-navigator.tsx      # 步骤导航器
│   ├── editor/                     # 编辑器组件
│   │   ├── timeline.tsx            # 多轨时间线
│   │   ├── player.tsx              # 视频播放器
│   │   ├── track-header.tsx        # 轨道头
│   │   └── clip-renderer.tsx       # 片段渲染器
│   └── shared/                     # 共享业务组件
│       ├── style-selector.tsx      # 解说风格选择器
│       ├── voice-selector.tsx      # 语音选择器
│       └── subtitle-viewer.tsx     # 字幕预览器
│
├── context/
│   └── theme-context.tsx           # 主题 Context
│
└── lib/                            # 纯工具函数
    ├── format.ts                   # 格式化
    ├── cn.ts                       # className 工具
    ├── logger.ts                   # 日志
    └── notify.ts                   # 通知
```

### Rust 后端目标架构

```
src-tauri/src/
├── main.rs
├── lib.rs                          # 注册 ~30 个命令
├── error.rs                        # 统一错误类型
│
├── commands/                       # IPC 命令（按流水线步骤分组）
│   ├── mod.rs
│   ├── ingest.rs                   # 素材导入（合并 file_ops + ffprobe）
│   ├── analyze.rs                  # 分析（合并 highlight + segment 检测）
│   ├── script.rs                   # 脚本（合并 llm + script_generator）
│   ├── voice.rs                    # 语音（合并 synthesizer + commentary_synthesizer）
│   ├── compose.rs                  # 合成（合并 render + autonomous_cut）
│   ├── export.rs                   # 导出
│   ├── project.rs                  # 项目 CRUD
│   └── system.rs                   # 系统（auto_save + crash_recovery + binary）
│
├── ai/                             # AI 服务（合并 llm/）
│   ├── mod.rs
│   ├── provider.rs                 # 统一 Provider trait
│   ├── openai.rs
│   ├── anthropic.rs
│   ├── gemini.rs
│   └── deepseek.rs
│
├── media/                          # 媒体处理（合并 video/ + subtitle/ + highlight/ + segment/）
│   ├── mod.rs
│   ├── ffmpeg.rs                   # FFmpeg 封装
│   ├── metadata.rs                 # 媒体元数据
│   ├── keyframe.rs                 # 关键帧提取
│   ├── subtitle.rs                 # Whisper 字幕
│   ├── highlight.rs                # 高光检测
│   └── segment.rs                  # 智能分段
│
├── tts/                            # TTS 语音合成
│   ├── mod.rs
│   ├── edge.rs
│   └── azure.rs
│
└── util/                           # 工具（合并 utils/ + binary/）
    ├── mod.rs
    ├── time.rs
    ├── process.rs
    ├── binary.rs                   # FFmpeg/Whisper 二进制管理
    ├── accel.rs                    # 硬件加速检测
    └── resilience.rs               # 容错 + 资源限制
```

### 关键量化对比

| 维度 | 当前 | 重构后 | 降幅 |
|------|------|--------|------|
| 页面数 | 9 个 | 4 个 | -56% |
| Store 数 | 5 个 | 3 个 | -40% |
| Service 目录 | 14 个 | 7 个文件 | -50% |
| Tauri 命令 | 61 个 | ~30 个 | -51% |
| 类型定义位置 | 6+ 处 | 1 处 | -83% |
| 组件目录 | 15 个 | 4 个 | -73% |
| Rust 模块目录 | 8 个 | 5 个 | -38% |

---

## 第四部分：代码优化路线图

### Phase 1：类型统一与命名规范化（基础层）

**目标**：建立统一类型源 + kebab-case 命名规范
**风险**：低（纯重命名 + 类型移动，不改逻辑）
**预计工时**：3-5 天

| 步骤 | 具体操作 | 影响范围 |
|------|----------|----------|
| 1.1 | 创建 `src/types/` 统一类型层，从 6+ 处迁移所有类型定义 | 全项目 import |
| 1.2 | 全项目文件名重命名为 kebab-case（~200+ 文件） | 全项目文件 |
| 1.3 | 更新所有 import 路径 | 全项目文件 |
| 1.4 | 更新 ESLint 规则强制 kebab-case 文件名 | 配置文件 |
| 1.5 | 更新 CI 的 verify:naming 脚本 | CI 配置 |

### Phase 2：流水线引擎重构（核心层）

**目标**：建立 6 步强制线性流水线
**风险**：中（核心逻辑重构）
**预计工时**：5-7 天

| 步骤 | 具体操作 | 影响范围 |
|------|----------|----------|
| 2.1 | 实现 PipelineEngine 状态机 | 新模块 |
| 2.2 | 实现 6 个 Step 接口（validate → execute → output） | 新模块 |
| 2.3 | 实现 PipelineContext 数据流转 | 新模块 |
| 2.4 | 合并 14 个 service 为 7 个文件 | src/core/services/ → src/services/ |
| 2.5 | 合并 5 个 store 为 3 个 | src/store/ |
| 2.6 | 实现 usePipeline hook | src/hooks/ |

### Phase 3：页面与组件整合（视图层）

**目标**：精简为 4 个页面 + 统一组件结构
**风险**：中（UI 重构）
**预计工时**：5-7 天

| 步骤 | 具体操作 | 影响范围 |
|------|----------|----------|
| 3.1 | 合并 Dashboard/Projects/ProjectDetail → projects.tsx | pages/ |
| 3.2 | 整合 VideoEditor/AIVideoEditor/StoryFab → workspace.tsx | pages/ + components/ |
| 3.3 | 消除重复组件（Timeline、ScriptEditor 等） | components/ |
| 3.4 | 统一组件目录结构（layout/ + workspace/ + editor/ + shared/） | components/ |
| 3.5 | 迁移 LESS 样式到 Tailwind | 全项目样式 |

### Phase 4：Rust 后端精简（后端层）

**目标**：合并 61 个命令为 ~30 个
**风险**：高（涉及 Rust 编译）
**预计工时**：5-7 天

| 步骤 | 具体操作 | 影响范围 |
|------|----------|----------|
| 4.1 | 合并 commands/ 子模块为按流水线步骤分组 | src-tauri/ |
| 4.2 | 合并 media/ 统一视频/音频/字幕处理 | src-tauri/ |
| 4.3 | 合并 ai/ 统一 LLM provider | src-tauri/ |
| 4.4 | 统一错误处理（error.rs） | src-tauri/ |
| 4.5 | 更新 bridge/ 层对应新命令 | src/bridge/ |

### Phase 5：清理与验证（收尾层）

**目标**：消除所有死代码，确保构建通过
**风险**：低
**预计工时**：2-3 天

| 步骤 | 具体操作 | 影响范围 |
|------|----------|----------|
| 5.1 | 删除所有未使用的文件和导出 | 全项目 |
| 5.2 | 运行 tree-shaking 验证 | 构建系统 |
| 5.3 | 更新文档（docs/） | 文档 |
| 5.4 | 更新测试覆盖 | 测试 |
| 5.5 | 性能基准测试 | 验证 |

---

## 第五部分：性能优化策略

| 优化点 | 策略 | 预期收益 |
|--------|------|----------|
| **懒加载** | 每个流水线步骤组件按需加载，非当前步骤不渲染 | 首屏加载 -40% |
| **Web Worker** | 视频分析、脚本生成移入 Worker 线程 | UI 不卡顿 |
| **增量更新** | 流水线状态变更只 diff 变化部分 | 减少 re-render |
| **缓存策略** | 步骤结果缓存到本地，支持断点续做 | 避免重复计算 |
| **并发执行** | analyze 步骤的子任务（场景检测 + 关键帧 + 音频分析）并行 | 分析速度 +200% |
| **硬件加速** | 利用 NVENC/VideoToolbox/VAAPI 加速视频编码 | 导出速度 +300% |

---

## 第六部分：执行优先级

```
Phase 1 (基础层) ──→ Phase 2 (核心层) ──→ Phase 3 (视图层) ──→ Phase 4 (后端层) ──→ Phase 5 (收尾层)
    ↓                    ↓                    ↓                    ↓                    ↓
类型统一 + 命名       流水线引擎           页面整合            Rust 精简            清理验证
  规范化              重构                 组件整合            命令合并             死代码删除
```

每阶段独立可交付，可分批 PR。Phase 1 和 Phase 2 是最关键的基础设施，必须首先完成。
