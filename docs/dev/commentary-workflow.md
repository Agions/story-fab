# Commentary Workflow Design
# 解说工作流设计

> Commentary Mode — 从视频输入到带解说配音的成片输出

---

## 1. 工作流概览

Commentary Mode 是 CutDeck 的核心新功能，它将一个原始视频（电影/短剧/综艺）通过 AI 分析和创作，自动生成一段完整的解说视频（包含解说词、配音、背景音乐、字幕）。

### 1.1 与 Clip Mode 的区别

| 维度 | Clip Mode（剪辑模式） | Commentary Mode（解说模式） |
|------|---------------------|---------------------------|
| **输入** | 长视频 | 长视频 |
| **输出** | 多个精彩片段 | 一个完整解说视频 |
| **核心能力** | 高光检测 + 快速剪辑 | 剧情理解 + 文案生成 + 配音合成 |
| **用户介入** | 少（AI 自动选段） | 多（审核计划、修改风格） |
| **典型场景** | 直播回放 → 精彩片段 | 短剧 → 完整解说视频 |
| **技术复杂度** | 中 | 高 |

### 1.2 完整工作流（8 步）

```
Step 1 ──► Step 2 ──► Step 3 ──► Step 4 ──► Step 5 ──► Step 6 ──► Step 7 ──► Step 8
视频导入    AI分析    语义分段   Director   Script   Commentary  渲染合成    导出成片
                           Agent     Gen      Synth
```

| Step | 名称 | 负责模块 | 说明 |
|------|------|---------|------|
| 1 | 视频导入 | UI / Rust | 批量导入视频，设置基础参数 |
| 2 | AI 分析 | Rust SmartSegmenter | 音频能量 + 场景切换 + 静默检测 |
| 3 | 语义分段 | TS DirectorAgent + LLM | LLM 理解剧情，语义标注 |
| 4 | Director Agent | TS DirectorAgent | 状态机，规划解说结构 |
| 5 | Script Gen | TS ScriptGenerator + LLM | 生成解说词 |
| 6 | Commentary Synth | TS CommentarySynth + Edge TTS | 配音合成 |
| 7 | 渲染合成 | Rust autonomous_cut | 视频 + 音频 + 字幕合成 |
| 8 | 导出成片 | TS ExportService | 多格式输出 |

---

## 2. 详细流程

### Step 1: 视频导入（Video Import）

**UI 操作**：用户点击"新建解说项目"，选择视频文件，设置基本参数

**参数设置**：
```typescript
interface CommentarProjectConfig {
  video_path: string;
  title: string;
  target_duration: number;    // 目标解说视频时长（秒）
  aspect_ratio: '9:16' | '16:9' | '1:1';  // 输出比例
  commentary_style: CommentaryStyle;
}
```

**输出**：创建 ProjectFile，进入 Step 2

---

### Step 2: AI 分析（AI Analysis）

**模块**：`smart_segmenter.rs`（Rust）

**处理内容**：
1. 提取音频（WAV, 16kHz, mono）
2. 计算音频能量（500ms 窗口）
3. 场景切换检测（scdet threshold=0.3）
4. 静默检测（-40dB）
5. 粗分 segments（能量低谷作为断点）

**输出**：`VideoSegment[]`
```rust
struct VideoSegment {
    start_ms: u64,
    end_ms: u64,
    segment_type: String,  // "dialogue" | "action" | "transition" | "silence" | "content"
    duration_ms: u64,
    confidence: f32,
    is_scene_change: Option<bool>,
    suggested_speed: Option<f32>,  // 1x-6x
}
```

**预计耗时**：
- 1 小时视频 → 约 30-60 秒处理
- 与视频时长成正比

---

### Step 3: 语义分段（Semantic Segmentation）

**模块**：`DirectorAgent.ts`（TypeScript）+ LLM

**输入**：粗分 segments + 视频元数据（分辨率、时长、帧率）
**输出**：`SemanticSegment[]`

**处理逻辑**：

```typescript
async function semanticSegment(
  videoPath: string,
  rawSegments: VideoSegment[],
  apiProvider: AIProviderService
): Promise<SemanticSegment[]> {
  // 1. 为每个 segment 构建文本描述
  const segmentDescriptions = rawSegments.map((seg, idx) => `
Segment ${idx + 1}:
  时间范围: ${msToTime(seg.start_ms)} - ${msToTime(seg.end_ms)}
  类型: ${seg.segment_type}
  时长: ${seg.duration_ms}ms
  能量建议: ${seg.suggested_speed}x
  `).join('\n');

  // 2. 构建 LLM prompt
  const prompt = `
视频总时长: ${videoDuration}
共有 ${rawSegments.length} 个初步分段。

请为每个分段补充语义标注（JSON数组）：
${segmentDescriptions}

要求：
- plot_summary: 一两句话总结这段在讲什么剧情
- characters: 出现的角色名称
- emotional_tone: 情绪基调（happy/sad/tense/calm/comedic/surprising）
- commentary_tone_suggestion: 建议用什么语气解说（幽默/严肃/接地气/震惊/感动...）
- highlight_potential: 0-1，这段作为解说重点的潜力

输出格式：JSON数组
`;

  // 3. 调用 LLM（DeepSeek V4-Pro 推荐）
  const response = await apiProvider.chat({
    model: 'deepseek-v4-pro',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  // 4. 解析并返回
  return JSON.parse(response.content);
}
```

**输出结构**：
```typescript
interface SemanticSegment extends VideoSegment {
  plot_summary: string;          // 剧情摘要
  characters: string[];         // 人物列表
  emotional_tone: string;        // 情绪基调
  commentary_tone: string;       // 建议解说语气
  highlight_potential: number;  // 解说潜力 0.0-1.0
}
```

---

### Step 4: Director Agent（导演 Agent）

**模块**：`DirectorAgent.ts`（TypeScript）

**核心职责**：状态机，管理整个解说创作流程

#### 4.1 状态机状态

```typescript
enum DirectorPhase {
  idle = 'idle',
  analyzing = 'analyzing',      // 分析视频内容
  planning = 'planning',        // 生成解说计划
  reviewing = 'reviewing',      // 用户审核
  revising = 'revising',        // 根据反馈修改
  executing = 'executing',      // 执行渲染
  completed = 'completed',
  error = 'error',
}
```

#### 4.2 状态机流转

```
用户发起解说
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│                    analyzing                              │
│  分析 semantic segments，构建视频叙事结构                  │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    planning                               │
│  生成 CommentaryPlan：开场 + 主体段落 + 结尾               │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    reviewing                              │
│  用户审核计划，可修改解说风格/语气/片段选择                 │
│  - 确认 → 执行                                             │
│  - 修改 → revising                                         │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐    ┌─────────────────────┐
│    revising      │    │    executing        │
│  根据反馈修改计划  │    │  调用 Script Gen +  │
│  然后回 planning  │    │  Commentary Synth   │
└──────────────────┘    │  执行渲染           │
                        └─────────┬───────────┘
                                  ▼
                        ┌──────────────────┐
                        │    completed     │
                        └──────────────────┘
```

#### 4.3 CommentaryPlan 结构

```typescript
interface CommentaryPlan {
  version: number;              // 计划版本号（每次修改+1）
  created_at: string;           // 创建时间
  title: string;                // 解说标题
  style: CommentaryStyle;       // 解说风格

  intro: {
    segment_ids: string[];      // 选用的开场片段
    commentary: string;        // 开场解说词
    tone: string;              // 语气描述
    duration_ms: number;        // 预计时长
  };

  acts: Act[];                  // 主体段落（可多个）

  outro: {
    segment_ids: string[];
    commentary: string;
    call_to_action: string;    // 结尾引导（关注/点赞等）
  };

  total_duration_ms: number;   // 总时长预算
  metadata: {
    target_audience: string;    // 目标观众
    platform: string;           // 目标平台（抖音/B站等）
    keywords: string[];        // 关键词标签
  };
}

interface Act {
  order: number;
  title: string;               // 段落标题（如"第一幕：相遇"）
  segment_ids: string[];       // 这段选用的视频片段
  commentary: {
    script: string;            // 解说词
    tone: string;              // 语气
    pacing: 'fast' | 'normal' | 'slow';
    emphasis_keywords: string[]; // 需要重音强调的词
  };
  transition: {
    type: 'cut' | 'dissolve' | 'fade';
    description: string;
  };
}
```

#### 4.4 Planning 算法

```typescript
async function generatePlan(
  semanticSegments: SemanticSegment[],
  config: CommentarProjectConfig
): Promise<CommentaryPlan> {
  // 1. 计算总时长
  const totalMs = semanticSegments.reduce((sum, s) => sum + s.duration_ms, 0);

  // 2. 找出高潜力片段（highlight_potential > 0.7）
  const highPotential = semanticSegments.filter(s => s.highlight_potential > 0.7);

  // 3. 构建开场：选择开头最有吸引力的片段
  const introSegments = selectIntroSegments(semanticSegments, config.target_duration * 0.1);

  // 4. 构建主体 acts：按时间顺序 + 高潜力优先
  const acts = buildActs(semanticSegments, config.target_duration * 0.7);

  // 5. 构建结尾
  const outroSegments = selectOutroSegments(semanticSegments, config.target_duration * 0.2);

  // 6. 生成解说词（调用 Script Generator）
  const plan: CommentaryPlan = {
    version: 1,
    created_at: new Date().toISOString(),
    title: config.title,
    style: config.commentary_style,
    intro: {
      segment_ids: introSegments.map(s => s.id),
      commentary: '',  // 后面填
      tone: config.commentary_style.default_tone,
      duration_ms: introSegments.reduce((s, seg) => s + seg.duration_ms, 0),
    },
    acts: await Promise.all(acts.map(a => generateActCommentary(a))),
    outro: {
      segment_ids: outroSegments.map(s => s.id),
      commentary: '',
      call_to_action: '欢迎评论区留言讨论',
    },
    total_duration_ms: config.target_duration * 1000,
    metadata: {
      target_audience: '喜欢看短剧的大众用户',
      platform: '抖音',
      keywords: extractKeywords(semanticSegments),
    },
  };

  return plan;
}
```

---

### Step 5: Script Generator（解说词生成）

**模块**：`ScriptGenerator.ts`（TypeScript）

#### 5.1 单段解说词生成

```typescript
interface ScriptGenInput {
  segment: SemanticSegment;
  style: CommentaryStyle;
  characters: string[];         // 已出场角色
  previous_script: string | null; // 上一段的解说词（用于连贯性）
}

interface ScriptGenOutput {
  script: string;
  reading_time_ms: number;
  emphasis_positions: number[];  // 重音位置（字符偏移数组）
  keywords_to_highlight: string[];
}

// 核心 prompt 模板
const SCRIPT_PROMPT_TEMPLATE = `
你是一位专业的影视解说博主，擅长用生动有趣的语言解说短剧。

## 视频片段信息
- 时间范围：{start_time} - {end_time}
- 剧情摘要：{plot_summary}
- 出现角色：{characters}
- 情绪基调：{emotional_tone}
- 前一段解说：{previous_script}

## 解说风格
{style_description}

## 要求
- 开头要有吸引力（抓眼球/留悬念）
- 中间逻辑清晰，节奏明快
- 结尾留悬念或情感升华
- 总时长：约 {target_duration} 秒
- 不要太啰嗦，控制在核心内容

请生成一段解说词（JSON格式）：
{{
  "script": "解说词正文...",
  "reading_time_ms": 15000,
  "emphasis_positions": [5, 23, 45],
  "keywords_to_highlight": ["关键", "精彩"]
}}
`;
```

#### 5.2 全局连贯性保证

```typescript
async function generateScriptWithCoherence(
  plan: CommentaryPlan,
  apiProvider: AIProviderService
): Promise<CommentaryPlan> {
  let previousScript: string | null = null;

  // 生成开场
  plan.intro.commentary = await generateSingleScript(plan.intro, null);
  previousScript = plan.intro.commentary;

  // 生成各个 act
  for (const act of plan.acts) {
    act.commentary.script = await generateSingleScript(act, previousScript);
    previousScript = act.commentary.script;
  }

  // 生成结尾
  plan.outro.commentary = await generateSingleScript(plan.outro, previousScript);

  return plan;
}
```

---

### Step 6: Commentary Synthesizer（配音合成）

**模块**：`CommentarySynth.ts`（TypeScript）

#### 6.1 配音合成流程

```typescript
async function synthesizeCommentary(
  plan: CommentaryPlan,
  ttsService: EdgeTTSService,
): Promise<CommentaryTrack> {
  const track: CommentaryTrack = {
    segments: [],
    total_duration_ms: 0,
    mix_config: {
      narration_volume: 1.0,
      original_volume: 0.25,
      bgm_volume: 0.0,
    },
  };

  // 遍历 plan 中的每个解说片段
  for (const section of [plan.intro, ...plan.acts, plan.outro]) {
    if (!section.commentary) continue;

    // 调用 Edge TTS 生成音频
    const audioResult = await ttsService.synthesize({
      text: section.commentary,
      voice: selectVoice(section.tone, section.commentary),
      rate: calculateRate(section.commentary),
      pitch: 0,
      volume: 1.0,
    });

    // 获取音频时长
    const durationMs = await getAudioDuration(audioResult.path);

    track.segments.push({
      source_section: section.title || section.type,
      script: section.commentary,
      audio_path: audioResult.path,
      duration_ms: durationMs,
      voice_config: {
        voice_id: audioResult.voice_id,
        rate: audioResult.rate,
      },
    });

    track.total_duration_ms += durationMs;
  }

  return track;
}
```

#### 6.2 Edge TTS 语音选择

```typescript
function selectVoice(tone: string, script: string): string {
  const voiceMap: Record<string, string> = {
    '幽默': 'zh-CN-XiaoxiaoNeural',       // 活泼女声
    '严肃': 'zh-CN-YunxiNeural',         // 稳重男声
    '接地气': 'zh-CN-XiaoyouNeural',      // 年轻女声
    '震惊': 'zh-CN-YunyangNeural',        // 新闻男声
    '感动': 'zh-CN-XiaobaiNeural',        // 温柔女声
  };

  // 根据语气选择语音
  return voiceMap[tone] || 'zh-CN-XiaoxiaoNeural';
}

function calculateRate(script: string): number {
  // 计算朗读速度
  // 中文字符约 200-300字/分钟
  const charCount = script.length;
  const targetSeconds = charCount / 3.5;  // 约 3.5字/秒
  return 1.0;  // 正常语速
}
```

#### 6.3 时间轴计算

```typescript
function buildCommentaryTimeline(
  plan: CommentaryPlan,
  audioDurations: Map<string, number>
): CommentaryTimeline {
  const timeline: CommentaryTimeline = {
    entries: [],
    total_ms: 0,
  };

  let currentMs = 0;

  // 按顺序处理每个 segment
  for (const seg of plan.video_segments) {
    const audioPath = audioDurations.get(seg.id);
    const durationMs = audioPath ? audioPath.duration_ms : seg.duration_ms;

    timeline.entries.push({
      segment_id: seg.id,
      audio_start_ms: currentMs,
      audio_end_ms: currentMs + durationMs,
      video_start_ms: seg.start_ms,
      video_end_ms: seg.end_ms,
      is_muted: seg.segment_type === 'silence',  // 静默段不配音
    });

    currentMs += durationMs;
  }

  timeline.total_ms = currentMs;
  return timeline;
}
```

---

### Step 7: 渲染合成（Render Compose）

**模块**：Rust `autonomous_cut.rs`（扩展）

#### 7.1 渲染输入

```rust
struct CommentaryRenderInput {
    // 视频源
    input_path: String,
    segments: Vec<Segment>,          // 视频片段（来自 plan）

    // Commentary 音频
    commentary_track: CommentaryTrack,

    // 混音配置
    mix_config: AudioMixConfig,

    // 输出
    output_path: String,
    aspect_ratio: String,           // "9:16" | "16:9" | "1:1"
    burnin_subtitles: bool,
    subtitle_style: SubtitleStyle,
}
```

#### 7.2 渲染流程

```
1. 切割视频段（autonomous_cut 已有逻辑）
   └─► 临时文件：segment_0.mp4, segment_1.mp4, ...

2. 合并视频
   └─► concat.txt → merged_video.mp4

3. 注入 Commentary 音轨
   └─► 使用 filter_complex 混音：
       [commentary] volume=1.0 [narration];
       [original] volume=0.25 [original];
       [narration][original] amix=inputs=2 [out]

4. 转码（比例裁剪 + 字幕烧录）
   └─► output.mp4

5. 清理临时文件
```

#### 7.3 关键 FFmpeg 命令

```bash
# 1. 切割（已有）
ffmpeg -i input.mp4 -ss 10.5 -to 25.3 -c copy segment_0.mp4

# 2. 混音（新增 commentary 支持）
ffmpeg -i merged_video.mp4 -i commentary.wav \
  -filter_complex "[1:a]volume=1.0[ narration ]; \
                   [0:a]volume=0.25[ original ]; \
                   [narration][original]amix=inputs=2:duration=longest[out]" \
  -map 0:v -map "[out]" -c:v copy -c:a aac mixed_audio.mp4

# 3. 比例裁剪 + 字幕烧录
ffmpeg -i mixed_audio.mp4 \
  -vf "crop=ih*9/16:ih, subtitles=commentary.srt" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac output.mp4
```

---

### Step 8: 导出成片（Export）

**模块**：`ExportService.ts`（TypeScript）

**输出格式**：

| 平台 | 比例 | 分辨率 | 码率 |
|------|------|--------|------|
| 抖音/快手 | 9:16 | 1080x1920 | 8-12 Mbps |
| Instagram | 1:1 | 1080x1080 | 8 Mbps |
| YouTube/B站 | 16:9 | 1920x1080 | 10-15 Mbps |

**文件命名**：
```
{project_name}_{style}_{aspect_ratio}_{timestamp}.mp4
例：霸道总裁爱上我_幽默版_9:16_20240520.mp4
```

---

## 3. 错误处理与重试

### 3.1 各步骤失败处理

| Step | 可能的错误 | 重试策略 |
|------|-----------|---------|
| 1 | 文件不存在/格式不支持 | 用户提示，换文件 |
| 2 | FFmpeg 崩溃 | 自动重试 2 次，失败则报错 |
| 3 | LLM API 超时/限流 | 指数退避重试（1s, 2s, 4s） |
| 4 | Director 规划失败 | 回退到默认规划（不用 LLM） |
| 5 | Script Gen 失败 | 用模板填充，保证有输出 |
| 6 | TTS 合成失败 | 换语音引擎，或跳过配音 |
| 7 | 渲染失败 | 降级到简单模式（无 commentary） |

### 3.2 降级路径

```
全功能 Commentary Mode
     │
     ├─► LLM 失败 → 用规则生成解说词（模板）
     │
     ├─► TTS 失败 → 输出纯文字（无配音）
     │
     └─► 渲染失败 → autonomous_cut（无 commentary 音轨）
```

---

## 4. 性能优化

### 4.1 并行化

- **LLM 调用**：多个 segment 的语义分析并行（最多 4 并发）
- **TTS 合成**：多个 segment 并行合成（最多 8 并发）
- **FFmpeg**：多个 segment 的切割并行（Tokio Semaphore 控制，8 并发）

### 4.2 缓存

- **语义分段结果**：相同视频的语义分析结果缓存（按 video hash）
- **TTS 音频**：相同文本的 TTS 结果缓存（按文本 hash）
- **中间视频**：segment 切割结果缓存（临时目录）

### 4.3 流式处理

- **预览**：先生成低码率预览，用户确认后再生成高质量
- **进度**：每完成一个 segment 即更新进度，不等全部完成

---

## 5. 用户体验设计

### 5.1 工作流引导 UI

```
┌─────────────────────────────────────────────────────────────┐
│  Commentary Mode                          [进度: Step 4/8]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ①视频导入 → ②AI分析 → ③语义分段 → ④Director →            │
│  ⑤Script → ⑥Commentary → ⑦渲染 → ⑧导出                    │
│                                                             │
│  当前：Step 4 - Director Agent 规划中...                   │
│  ████████████░░░░░░░░ 60%                                  │
│                                                             │
│  [生成计划中 - 预计 30 秒]                                 │
│                                                             │
│  [查看语义分段] [跳过等待] [取消]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Review 阶段 UI

```
┌─────────────────────────────────────────────────────────────┐
│  解说计划审核                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  风格：幽默版                                               │
│  预计时长：2分30秒                                          │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │ [开场] 0:00 - 0:15  │                                   │
│  │ "这天，王霸天刚走..│                                   │
│  │  [🔊 预览] [✏️ 编辑]│                                   │
│  └─────────────────────┘                                   │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │ [第一幕] 0:15 - 1:00│                                   │
│  │ "只见他缓缓走来，..│                                   │
│  │  [🔊 预览] [✏️ 编辑]│                                   │
│  └─────────────────────┘                                   │
│                                                             │
│  [重新生成] [修改风格] [确认执行]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 技术约束与边界

### 6.1 输入限制

| 类型 | 限制 |
|------|------|
| 视频格式 | MP4, MOV, AVI, MKV（FFmpeg 支持的格式） |
| 视频时长 | 30 秒 - 3 小时 |
| 视频大小 | 最大 10GB（受 FFmpeg 处理能力限制） |
| 分辨率 | 最大 4K（超过 1080p 会降采样） |

### 6.2 输出限制

| 类型 | 限制 |
|------|------|
| 解说时长 | 30 秒 - 30 分钟 |
| 目标语言 | 中文（其他语言 TTS 后续扩展） |
| 输出格式 | MP4（H.264 + AAC） |

### 6.3 性能基线

- 1 分钟视频 → 约 10 秒处理
- 10 分钟视频 → 约 60 秒处理
- 1 小时视频 → 约 5-10 分钟处理