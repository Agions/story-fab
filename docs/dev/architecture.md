# System Architecture v3.0

> CutDeck Commentary Mode — AI 影视/短剧解说创作工具

---

## 1. 设计目标与背景

### 1.1 从"剪辑工具"到"解说创作工具"

| 维度 | 旧定位（v2 Clip Mode） | 新定位（v3 Commentary Mode） |
|------|----------------------|------------------------------|
| 核心能力 | 长视频 → 精彩片段 | 视频 → 完整解说视频 |
| 用户目标 | 快速剪辑分发 | 理解剧情 + 生成文案 + 配音合成 + 剪辑成片 |
| AI 介入点 | 高光检测 + 场景分段 | 剧情理解 + 文案生成 + 配音 + 编排 |
| 输出形态 | 多个短片段 | 带解说配音的完整视频 |

### 1.2 Commentary Mode 核心升级

```
旧架构：视频 → SmartSegmenter → 高光检测 → 渲染导出
新架构：视频 → SmartSegmenter → AI Director → Script Gen → Commentary → 渲染导出
```

---

## 2. 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CutDeck Application                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    UI Layer (React 18 + TypeScript)                   │    │
│  │                                                                        │    │
│  │   Landing · Dashboard · Projects · Settings (通用)                   │    │
│  │   ──────────────────────────────────────────────────────────          │    │
│  │   CutDeck Provider (工作流编排)                                        │    │
│  │     ├── StepList · Workspace · AIVisualizer (剪辑模式)                │    │
│  │     └── CommentaryPanel · ScriptEditor · CommentaryPreview (解说模式)│    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────┐   │
│  │                    Services Layer (TypeScript)                        │    │
│  │                                                                        │    │
│  │   AI Provider Service ──────────► 多提供商统一抽象（OpenAI/DeepSeek/...）│   │
│  │   Clip Pipeline ────────────────► 7步剪辑管道（已有）                  │   │
│  │   Commentary Pipeline ──────────► 解说管道（新增）                     │   │
│  │     ├── DirectorAgent.ts        AI 导演状态机                          │   │
│  │     ├── ScriptGenerator.ts      LLM 解说词生成                         │   │
│  │     └── CommentarySynth.ts     配音合成 + 时间轴对齐                  │   │
│  │   Subtitle Service ─────────────► Whisper 字幕（已有）                  │   │
│  │   Export Service ──────────────► 多格式导出（已有）                    │   │
│  │   TauriBridge ─────────────────► IPC 封装（已有）                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────┐   │
│  │                    Tauri Bridge (IPC invoke/emit)                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────┐   │
│  │                    Rust Backend (Tauri 2.x)                            │    │
│  │                                                                        │    │
│  │   Commands (IPC Handler)                                               │    │
│  │   ├── ai.rs                    Whisper / 高光检测（已有）                │    │
│  │   ├── llm.rs                   LLM API 代理（隐藏密钥，新增）           │    │
│  │   ├── project.rs              项目 CRUD（已有）                        │    │
│  │   ├── ffprobe.rs              视频元数据（已有）                        │    │
│  │   ├── file_ops.rs             文件操作（已有）                          │    │
│  │   ├── auto_save.rs            自动保存（已有）                          │    │
│  │   ├── export_state.rs         导出状态（已有）                          │    │
│  │   ├── commentary.rs           🆕 解说专用命令                          │    │
│  │   └── render/                  渲染（已有）                             │    │
│  │       ├── autonomous_cut.rs   AI 多段切割（复用）                       │    │
│  │       ├── transcode.rs        比例裁剪 + 导出（复用）                   │    │
│  │       ├── preview.rs          预览生成（复用）                          │    │
│  │       └── subtitle_burnin.rs  字幕烧录（复用）                          │    │
│  │                                                                        │    │
│  │   Core Modules                                                        │    │
│  │   ├── smart_segmenter.rs     场景/能量分段（已有，优化）                │    │
│  │   ├── highlight_detector.rs   高光检测（已有）                          │    │
│  │   ├── subtitle.rs             Whisper 字幕（已有）                      │    │
│  │   ├── video_processor.rs      视频裁剪/混音（已有）                     │    │
│  │   ├── llm_proxy.rs            🆕 LLM API 代理（隐藏密钥）               │    │
│  │   └── types.rs                 共享类型定义                             │    │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    External Dependencies                              │   │
│  │                                                                        │   │
│  │   FFmpeg          视频编解码 / 裁剪 / 混音 / 字幕烧录                    │   │
│  │   faster-whisper  本地 ASR 字幕转录（断网可用）                          │   │
│  │   Edge TTS        配音合成（Windows/macOS 内置）                        │   │
│  │   LLM APIs        OpenAI / DeepSeek / Anthropic / Google / ...        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Commentary Pipeline（解说管道）

### 3.1 管道概览

```
视频输入
  │
  ▼
┌─────────────────────┐
│  SmartSegmenter     │  粗分：能量/场景/静默检测
│  (Rust, 已有)        │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  LLM Semantic       │  细分：剧情/人物/情绪理解
│  Segmentation        │  (TypeScript Service)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Director Agent     │  状态机：Plan → Review → Revise → Execute
│  (TypeScript)        │  用户可在每阶段介入
└──────────┬──────────┘
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐   ┌──────────┐
│ Script │   │ Commentary│
│ Gen    │   │ Synth    │
│ (LLM)  │   │ (TTS)   │
└───┬────┘   └────┬─────┘
    │             │
    ▼             ▼
┌─────────────────────┐
│  Render Engine      │  autonomous_cut 扩展
│  (Rust)              │  多轨混音 + 字幕
└──────────┬──────────┘
           ▼
      成片输出
```

### 3.2 各阶段详解

#### Stage 1: SmartSegmenter（粗分）

**已有能力**（`smart_segmenter.rs`）：
- 音频能量分析（500ms 窗口）
- 场景切换检测（scdet）
- 静默检测
- 播放速度推荐（1x–6x）

**保留优化**：继续使用，不改变已有逻辑

#### Stage 2: LLM Semantic Segmentation（细分）

**目标**：在粗分基础上，用 LLM 理解每段的语义（剧情/人物/情绪）

**输入**：粗分 segments + 视频关键帧/音频特征
**输出**：语义标注

```typescript
interface SemanticSegment {
  // 继承自 VideoSegment（粗分）
  start_ms: number;
  end_ms: number;
  segment_type: string; // "dialogue" | "action" | "transition" | "silence" | "content"

  // LLM 新增语义标注
  semantic_label: string;       // "主角对话" | "动作场景" | "过渡转场" | ...
  plot_summary: string;         // 剧情摘要（1-2句话）
  characters: string[];         // 出现的人物
  emotional_tone: "happy" | "sad" | "tense" | "calm" | "comedic" | ...;
  commentary_tone_suggestion: string; // 建议的解说语气
  highlight_potential: number; // 0.0-1.0，这段作为解说的潜力
}
```

**LLM 调用示例**（在 TypeScript Service 中）：

```typescript
async function semanticSegment(
  videoPath: string,
  segments: VideoSegment[],
  apiProvider: AIProviderService
): Promise<SemanticSegment[]> {
  // 构建 prompt：将 segments 转为文本描述 + 关键帧描述
  const prompt = buildSemanticSegmentationPrompt(segments, videoMetadata);

  // 调用 LLM（DeepSeek V4-Pro 推荐，性价比最高）
  const response = await apiProvider.chat({
    model: 'deepseek-v4-pro',
    messages: [{ role: 'user', content: prompt }]
  });

  // 解析 JSON 输出
  return parseSemanticSegments(response.content);
}
```

#### Stage 3: Director Agent（导演 Agent）

**设计原则**：多轮状态机，用户可介入

```typescript
type DirectorPhase =
  | 'idle'
  | 'analyzing'        // 分析视频内容
  | 'planning'         // 生成解说计划
  | 'review'           // 用户审核计划
  | 'revising'         // 根据用户反馈修改
  | 'executing'        // 执行渲染
  | 'completed';

interface DirectorState {
  phase: DirectorPhase;
  videoPath: string;
  semanticSegments: SemanticSegment[];
  commentaryPlan: CommentaryPlan | null;
  userFeedback: string | null;
  errors: string[];
}

interface CommentaryPlan {
  intro: SegmentSelection;      // 开场片段选择 + 解说词
  acts: Act[];                  // 主体段落
  outro: SegmentSelection;      // 结尾片段选择 + 解说词
  totalDuration: number;       // 预计总时长
  style: CommentaryStyle;       // 解说风格
}

interface Act {
  order: number;
  segments: SegmentSelection[];
  commentary: {
    script: string;            // 解说词
    tone: string;              // 语气
    pacing: 'fast' | 'normal' | 'slow';
  };
  transition_to_next: string; // 转场描述
}
```

**状态机流转**：

```
┌─────────┐
│  idle   │ ◄────── 用户发起解说任务
└────┬────┘
     ▼
┌──────────┐
│analyzing │──── AI 分析视频 + 语义分段
└────┬─────┘
     ▼
┌──────────┐
│ planning │──── AI 生成解说计划（开场/主体/结尾）
└────┬─────┘
     ▼
┌──────────┐
│  review  │──── 用户审核（可修改/重写/确认）
└────┬─────┘
     │ 用户通过
     ▼
┌──────────┐
│executing │──── 执行渲染 + 配音合成
└────┬─────┘
     ▼
┌──────────┐
│completed │──── 输出成片
└──────────┘

     ▲ 若用户要求修改
     │
┌────┴─────┐
│ revising  │──── 根据反馈重新规划
└────┬─────┘
     │
     └──► planning（重新生成）
```

#### Stage 4: Script Generator（解说词生成）

**每个 Act 的解说词生成**：

```typescript
interface ScriptGenInput {
  segments: SegmentSelection[];    // 选中的视频片段
  emotional_tone: string;          // 情绪基调
  style: CommentaryStyle;          // 解说风格（幽默/严肃/接地气/...）
  target_duration: number;         // 目标解说时长
  characters: string[];            // 人物列表（用于称呼）
}

interface ScriptGenOutput {
  script: string;                  // 解说词正文
  reading_time_ms: number;         // 预计朗读时长
  keywords: string[];              // 关键词（用于字幕高亮）
  suggested_emphasis: number[];     // 重音位置（时间戳数组）
}
```

**LLM Prompt 示例**：

```
你是一位专业的影视解说博主，擅长用生动有趣的语言解说短剧。
风格：接地气、口语化、有梗
目标观众：喜欢看短剧的大众用户

视频片段剧情：
[这里根据 semantic segment 的 plot_summary 填充]

解说词要求：
- 开头要有吸引力（抓眼球）
- 中间逻辑清晰，节奏明快
- 结尾要有悬念或情感升华
- 总时长：约 {target_duration} 秒
- 不要太长，控制在核心内容

请生成一段 60-90 秒的解说词：
```

#### Stage 5: Commentary Synthesizer（配音合成）

**核心能力**：
- TTS 配音生成（Edge TTS，内置Windows/macOS）
- 时间轴对齐（配音与视频片段精确同步）
- 多音轨混音（解说音轨 + 原声 + BGM）

**时间轴模型**：

```typescript
interface CommentaryTrack {
  segments: CommentarySegment[];
  total_duration_ms: number;
  audio_mix: AudioMixConfig;
}

interface CommentarySegment {
  video_segment_id: string;     // 对应的视频片段
  script: string;               // 解说词
  audio_path: string | null;    // TTS 生成后填充
  start_ms: number;             // 在最终成片中的起始时间
  end_ms: number;               // 在最终成片中的结束时间
  voice_config: {
    voice_id: string;           // Edge TTS voice ID
    rate: number;               // 语速倍数
    volume: number;             // 音量 0.0-1.0
  };
}

interface AudioMixConfig {
  narration_volume: number;      // 解说音量（通常 1.0）
  original_volume: number;      // 原声音量（通常 0.2-0.3）
  bgm_volume: number;           // BGM 音量（可选）
}
```

**合成流程**：

```typescript
async function synthesizeCommentary(
  plan: CommentaryPlan,
  ttsService: EdgeTTSService
): Promise<CommentaryTrack> {
  const track: CommentaryTrack = {
    segments: [],
    total_duration_ms: 0,
    audio_mix: { narration_volume: 1.0, original_volume: 0.25, bgm_volume: 0.0 }
  };

  for (const act of plan.acts) {
    for (const seg of act.segments) {
      // 调用 Edge TTS 生成音频
      const audioPath = await ttsService.synthesize({
        text: seg.commentary.script,
        voice: seg.voice_config.voice_id,
        rate: seg.voice_config.rate,
      });

      track.segments.push({
        video_segment_id: seg.id,
        script: seg.commentary.script,
        audio_path: audioPath,
        start_ms: calculateStartTime(seg),
        end_ms: calculateEndTime(audioPath),
        voice_config: seg.voice_config,
      });
    }
  }

  return track;
}
```

#### Stage 6: Render Engine（渲染引擎）

**复用 autonomous_cut.rs**，扩展 commentary 音轨支持：

```rust
// 扩展 AutonomousRenderInput
struct AutonomousRenderInput {
    // ... 已有字段 ...

    // 🆕 Commentary 相关字段
    commentary_track: Option<CommentaryTrack>,
    mix_config: AudioMixConfig,
    burnin_subtitles: bool,        // 是否烧录字幕
    subtitle_style: SubtitleStyle,
}

// 渲染时：
// 1. 先用 autonomous_cut 逻辑切割 + 合并视频片段
// 2. 再注入 commentary 音轨
// 3. 最后烧录字幕（如果需要）
```

**关键 FFmpeg 命令**（filter_complex 混音）：

```bash
# 解说 + 原声混音
ffmpeg -i video.mp4 -i commentary.wav -i original_audio.wav \
  -filter_complex "[1:a]volume=1.0[ narration]; [2:a]volume=0.25[ original]; [narration][original]amix=inputs=2:duration=longest[out]" \
  -map 0:v -map "[out]" -c:v copy -c:a aac output.mp4
```

---

## 4. Commentary Mode 与 Clip Mode 的关系

### 4.1 统一入口，分叉执行

```
CutDeck 工作流入口（CutDeckProvider）
    │
    ▼
┌─────────────┐
│  Step 1-2   │  视频导入 + AI 分析（共用）
└──────┬──────┘
       ▼
   ┌────┴────┐
   │         │
   ▼         ▼
┌────────┐  ┌─────────────┐
│Clip Mode│  │CommentaryMode│
│ (剪辑)  │  │  (解说)    │
└────────┘  └─────────────┘
```

### 4.2 数据模型共享

CommentaryMode 和 ClipMode 共享同一个项目数据模型（`ProjectFile`），只是工作流程不同：

```typescript
interface ProjectFile {
  id: string;
  name: string;
  mode: 'clip' | 'commentary';
  video_path: string;
  segments: VideoSegment[];           // 粗分结果（共用）
  highlights: HighlightSegment[];     // 高光（Clip Mode 用）
  commentary_plan: CommentaryPlan | null; // 解说计划（Commentary Mode 用）
  // ...
}
```

---

## 5. Rust 后端新增模块

### 5.1 llm_proxy.rs（LLM API 代理）

**职责**：
- 隐藏 API 密钥（前端不直接暴露 Key）
- 统一路由到不同 LLM 提供商
- 请求限流 + 错误重试

```rust
// llm_proxy.rs
pub struct LLMProxy {
    providers: HashMap<String, ProviderConfig>,
}

#[derive(Debug, Deserialize)]
pub struct LLMRequest {
    pub provider: String,      // "openai" | "deepseek" | "anthropic" | "google"
    pub model: String,
    pub messages: Vec<Message>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[tauri::command]
pub async fn call_llm(request: LLMRequest) -> Result<LLMResponse, String> {
    // 从环境变量或配置读取 API key
    // 路由到对应提供商
    // 返回响应
}
```

### 5.2 commentary.rs（解说命令）

```rust
// commentary.rs
#[derive(Debug, Deserialize)]
pub struct CommentaryScriptRequest {
    pub video_path: String,
    pub semantic_segments: Vec<SemanticSegment>,
    pub style: CommentaryStyle,
    pub api_provider: String,
}

#[tauri::command]
pub async fn generate_commentary_script(
    request: CommentaryScriptRequest
) -> Result<CommentaryPlan, String>;

#[tauri::command]
pub async fn synthesize_commentary_audio(
    script: String,
    voice_id: String,
    rate: f32,
) -> Result<String, String>; // 返回音频文件路径

#[tauri::command]
pub async fn render_with_commentary(
    input: AutonomousRenderInput,
    commentary_track: CommentaryTrack,
) -> Result<String, String>;
```

---

## 6. TypeScript 前端新增模块

### 6.1 Services 层

```
src/core/services/
├── commentary/                    # 🆕 解说服务
│   ├── index.ts                  # 导出入口
│   ├── DirectorAgent.ts          # AI 导演状态机
│   ├── ScriptGenerator.ts        # LLM 解说词生成
│   ├── CommentarySynth.ts        # 配音合成服务
│   └── types.ts                  # 解说相关类型
```

### 6.2 组件层

```
src/components/
├── CommentaryPanel/               # 🆕 解说模式面板
│   ├── CommentaryPanel.tsx       # 主容器
│   ├── ScriptEditor.tsx          # 解说词编辑器
│   ├── StyleSelector.tsx         # 风格选择器
│   ├── CommentaryPreview.tsx    # 解说预览（含配音播放）
│   └── CommentaryTimeline.tsx    # 解说时间轴
```

---

## 7. API 设计

### 7.1 关键 Tauri 命令

| 命令 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `call_llm` | `LLMRequest` | `LLMResponse` | 通用 LLM 调用代理 |
| `generate_commentary_script` | `CommentaryScriptRequest` | `CommentaryPlan` | 生成解说计划 |
| `synthesize_commentary_audio` | `{script, voice_id, rate}` | `String` | TTS 配音生成 |
| `render_with_commentary` | `AutonomousRenderInput + CommentaryTrack` | `String` | 带解说的渲染 |

---

## 8. 关键设计决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 工作流模式 | 统一入口 + 分叉 | 复用 AI 分析结果，用户可在中途切换 |
| Director Agent | 多轮 + 用户介入 | 保证输出质量，支持精细化创作 |
| LLM 调用 | 前端逻辑 + Rust 代理 | 前端灵活 + 隐藏密钥 |
| 配音合成 | Edge TTS（本地）+ 可扩展 | 断网可用，成本低 |
| 语义分段 | SmartSegmenter + LLM 双层 | 粗分高效 + 细分精准 |
| 渲染引擎 | 复用 autonomous_cut | 代码复用，扩展 commentary track |

---

## 9. 未来扩展方向

1. **多语种配音**：预留 `voice_id` 支持多语言
2. **BGM 合成**：接入音乐生成模型（参考 ElevenLabs Music）
3. **Lip-sync**：参考 LipDub 技术，对口型
4. **多角色解说**：不同人物用不同音色