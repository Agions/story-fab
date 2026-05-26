---
title: 解说工作流设计
date: 2024-05-20
---

# 解说工作流设计

> Commentary Mode — 从视频输入到带解说配音的成片输出

## 概述

Commentary Mode 是 StoryFab 的核心新功能，它将一个原始视频（电影/短剧/综艺）通过 AI 分析和创作，自动生成一段完整的解说视频（包含解说词、配音、背景音乐、字幕）。

### 与 Clip Mode 的区别

| 维度 | Clip Mode（剪辑模式） | Commentary Mode（解说模式） |
|------|---------------------|---------------------------|
| **输入** | 长视频 | 长视频 |
| **输出** | 多个精彩片段 | 一个完整解说视频 |
| **核心能力** | 高光检测 + 快速剪辑 | 剧情理解 + 文案生成 + 配音合成 |
| **用户介入** | 少（AI 自动选段） | 多（审核计划、修改风格） |
| **典型场景** | 直播回放 → 精彩片段 | 短剧 → 完整解说视频 |
| **技术复杂度** | 中 | 高 |

---

## 1. 解说模式完整工作流（8 步）

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

## 2. 导演 Agent 状态机详解

### 2.1 状态定义

```typescript
enum DirectorPhase {
  idle = 'idle',              // 空闲状态
  analyzing = 'analyzing',     // 分析视频内容
  planning = 'planning',       // 生成解说计划
  reviewing = 'reviewing',     // 用户审核
  revising = 'revising',       // 根据反馈修改
  executing = 'executing',     // 执行渲染
  completed = 'completed',     // 完成
  error = 'error',             // 错误
}
```

### 2.2 状态流转图

```
用户发起解说
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│                    analyzing                              │
│  分析 semantic segments，构建视频叙事结构                  │
│  • 调用 LLM 理解剧情                                     │
│  • 标注每个片段的剧情重要性                               │
│  • 识别角色和情绪基调                                     │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    planning                               │
│  生成 CommentaryPlan：开场 + 主体段落 + 结尾               │
│  • 计算总时长预算                                         │
│  • 分配高潜力片段到各段落                                  │
│  • 生成解说词结构                                         │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    reviewing                              │
│  用户审核计划，可修改解说风格/语气/片段选择                 │
│  • 显示计划摘要                                           │
│  • 允许编辑解说词                                         │
│  • 确认 → 执行                                            │
│  • 修改 → revising                                       │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐    ┌─────────────────────┐
│    revising      │    │    executing        │
│  根据反馈修改计划  │    │  调用 Script Gen +  │
│  然后回 planning  │    │  Commentary Synth   │
│                   │    │  执行渲染           │
│  循环直到用户确认   │    └─────────┬───────────┘
└──────────────────┘              ▼
                        ┌──────────────────┐
                        │    completed     │
                        └──────────────────┘
```

### 2.3 各状态详细说明

| 状态 | 进入条件 | 执行操作 | 退出条件 | 出错处理 |
|------|---------|---------|---------|---------|
| **idle** | 系统启动 | 等待用户发起 | 用户点击"新建解说项目" | - |
| **analyzing** | 用户确认视频 | 调用语义分段 LLM | 分析完成 | 重试 3 次后进入 error |
| **planning** | 分析完成 | 生成 CommentaryPlan | 计划生成完成 | 使用默认规则生成 |
| **reviewing** | 计划生成完成 | 显示计划给用户 | 用户确认或修改 | - |
| **revising** | 用户修改 | 更新计划后回 planning | 重新生成计划 | - |
| **executing** | 用户确认 | 执行渲染合成 | 渲染完成 | 降级处理 |
| **completed** | 渲染完成 | 通知用户可以导出 | - | - |
| **error** | 任何步骤失败 | 记录错误信息 | 用户重试或取消 | - |

### 2.4 CommentaryPlan 数据结构

```typescript
interface CommentaryPlan {
  version: number;              // 计划版本号（每次修改+1）
  created_at: string;           // 创建时间
  title: string;                // 解说标题
  style: CommentaryStyle;       // 解说风格

  intro: {
    segment_ids: string[];      // 选用的开场片段
    commentary: string;         // 开场解说词
    tone: string;               // 语气描述
    duration_ms: number;         // 预计时长
  };

  acts: Act[];                  // 主体段落（可多个）

  outro: {
    segment_ids: string[];
    commentary: string;
    call_to_action: string;     // 结尾引导（关注/点赞等）
  };

  total_duration_ms: number;    // 总时长预算
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
    script: string;             // 解说词
    tone: string;               // 语气
    pacing: 'fast' | 'normal' | 'slow';
    emphasis_keywords: string[]; // 需要重音强调的词
  };
  transition: {
    type: 'cut' | 'dissolve' | 'fade';
    description: string;
  };
}
```

---

## 3. 脚本生成流程

### 3.1 输入

```typescript
interface ScriptGenInput {
  segment: SemanticSegment;    // 视频片段语义信息
  style: CommentaryStyle;      // 解说风格配置
  characters: string[];        // 已出场角色列表
  previous_script: string | null; // 上一段的解说词（用于连贯性）
}

interface SemanticSegment {
  start_ms: u64;
  end_ms: u64;
  segment_type: string;        // "dialogue" | "action" | "transition" | "silence" | "content"
  duration_ms: u64;
  confidence: f32;
  is_scene_change: Option<bool>;
  suggested_speed: Option<f32>;
  
  // 语义分析新增
  plot_summary: string;        // 剧情摘要
  characters: string[];        // 人物列表
  emotional_tone: string;      // 情绪基调
  commentary_tone: string;     // 建议解说语气
  highlight_potential: number; // 解说潜力 0.0-1.0
}
```

### 3.2 LLM 调用

#### 3.2.1 Prompt 模板

```typescript
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

#### 3.2.2 调用参数

```typescript
const response = await apiProvider.chat({
  model: 'deepseek-v4-pro',    // 推荐模型
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,            // 适中创造性
  max_tokens: 2000,            // 单段解说词上限
});
```

### 3.3 输出

```typescript
interface ScriptGenOutput {
  script: string;              // 解说词正文
  reading_time_ms: number;     // 朗读时长（毫秒）
  emphasis_positions: number[]; // 重音位置（字符偏移数组）
  keywords_to_highlight: string[]; // 需要高亮的关键词
}
```

### 3.4 全局连贯性保证

```typescript
async function generateScriptWithCoherence(
  plan: CommentaryPlan,
  apiProvider: AIProviderService
): Promise<CommentaryPlan> {
  let previousScript: string | null = null;

  // 1. 生成开场
  plan.intro.commentary = await generateSingleScript(plan.intro, null);
  previousScript = plan.intro.commentary;

  // 2. 生成各个 act（保持上下文连贯）
  for (const act of plan.acts) {
    act.commentary.script = await generateSingleScript(act, previousScript);
    previousScript = act.commentary.script;
  }

  // 3. 生成结尾
  plan.outro.commentary = await generateSingleScript(plan.outro, previousScript);

  return plan;
}
```

---

## 4. 配音合成流程

### 4.1 TTS 生成

#### 4.1.1 Edge TTS 服务调用

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

#### 4.1.2 语音选择策略

```typescript
function selectVoice(tone: string, script: string): string {
  const voiceMap: Record<string, string> = {
    '幽默': 'zh-CN-XiaoxiaoNeural',       // 活泼女声
    '严肃': 'zh-CN-YunxiNeural',         // 稳重男声
    '接地气': 'zh-CN-XiaoyouNeural',      // 年轻女声
    '震惊': 'zh-CN-YunyangNeural',        // 新闻男声
    '感动': 'zh-CN-XiaobaiNeural',        // 温柔女声
    '悬疑': 'zh-CN-YunxiaNeural',         // 神秘男声
    '热血': 'zh-CN-YunyangNeural',        // 激昂男声
  };

  // 根据语气选择语音
  return voiceMap[tone] || 'zh-CN-XiaoxiaoNeural';
}

function calculateRate(script: string): number {
  // 计算朗读速度
  // 中文字符约 200-300字/分钟
  const charCount = script.length;
  const targetSeconds = charCount / 3.5;  // 约 3.5字/秒
  return 1.0;  // 正常语速，可根据需要调整
}
```

### 4.2 时间轴对齐

```typescript
interface CommentaryTimelineEntry {
  segment_id: string;
  audio_start_ms: number;      // 配音开始时间
  audio_end_ms: number;        // 配音结束时间
  video_start_ms: number;      // 对应视频开始时间
  video_end_ms: number;        // 对应视频结束时间
  is_muted: boolean;           // 是否静音原片
}

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

### 4.3 混音配置

```typescript
interface AudioMixConfig {
  narration_volume: number;    // 解说音音量 (0.0-2.0)
  original_volume: number;     // 原片音量 (0.0-1.0)
  bgm_volume: number;          // 背景音量 (0.0-1.0)
  
  // 动态处理
  duck_original_when_narration: boolean;  // 解说时压低原片
  duck_threshold_db: number;    // 压低阈值
  duck_amount_db: number;      // 压低量
}

// 默认配置
const DEFAULT_MIX_CONFIG: AudioMixConfig = {
  narration_volume: 1.0,
  original_volume: 0.25,
  bgm_volume: 0.0,
  duck_original_when_narration: true,
  duck_threshold_db: -20,
  duck_amount_db: -15,
};
```

---

## 5. 渲染引擎扩展

### 5.1 渲染输入结构

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

### 5.2 渲染流程

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

### 5.3 关键 FFmpeg 命令

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

### 5.4 字幕烧录

```typescript
interface SubtitleStyle {
  font: string;              // 字体名称
  font_size: number;         // 字号
  font_color: string;         // 颜色（ARGB格式）
  background_color: string;   // 背景颜色
  border_width: number;       // 描边宽度
  position: 'bottom' | 'top' | 'center';
  max_chars_per_line: number; // 每行最大字符数
}

// 生成 SRT 字幕文件
function generateSRT(plan: CommentaryPlan): string {
  let srt = '';
  let index = 1;
  let currentTime = 0;

  for (const section of [plan.intro, ...plan.acts, plan.outro]) {
    if (!section.commentary) continue;
    
    const startTime = formatSRTTime(currentTime);
    currentTime += section.duration_ms;
    const endTime = formatSRTTime(currentTime);

    srt += `${index}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${section.commentary}\n\n`;
    index++;
  }

  return srt;
}
```

---

## 6. 降级策略

当某一步失败时，系统按以下路径降级：

```
全功能 Commentary Mode
     │
     ├─► Step 3 LLM 失败 → 用规则生成解说词（模板）
     │     • 基于 segment_type 生成模板化描述
     │     • 不调用 LLM，使用预设语气
     │
     ├─► Step 5 Script Gen 失败 → 用通用模板填充
     │     • 每个 segment 使用标准开头/结尾模板
     │     • 保证有输出，用户可后续编辑
     │
     ├─► Step 6 TTS 失败 → 输出纯文字字幕（无配音）
     │     • 只烧录字幕到视频
     │     • 不生成音频轨道
     │
     └─► Step 7 渲染失败 → 降级到 autonomous_cut（无 commentary 音轨）
           • 保留原片音频
           • 不添加解说
           • 用户可手动添加配音
```

### 6.1 各步骤失败处理表

| Step | 可能的错误 | 重试策略 | 降级处理 |
|------|-----------|---------|---------|
| 1 | 文件不存在/格式不支持 | - | 用户提示，换文件 |
| 2 | FFmpeg 崩溃 | 自动重试 2 次 | 失败则报错 |
| 3 | LLM API 超时/限流 | 指数退避重试（1s, 2s, 4s） | 使用规则引擎 |
| 4 | Director 规划失败 | 重试 1 次 | 使用默认规划 |
| 5 | Script Gen 失败 | 重试 2 次 | 使用模板填充 |
| 6 | TTS 合成失败 | 换语音引擎再试 | 输出文字字幕 |
| 7 | 渲染失败 | 重试 1 次 | 降级到简单模式 |

### 6.2 降级规则引擎

```typescript
interface FallbackRule {
  when: string;               // 触发条件
  useTemplate: string;        // 使用的模板
  tone: string;              // 默认语气
}

const FALLBACK_RULES: FallbackRule[] = [
  {
    when: 'segment_type === "dialogue"',
    useTemplate: '画面中，角色正在进行一段重要的对话...',
    tone: '叙述',
  },
  {
    when: 'segment_type === "action"',
    useTemplate: '接下来发生的事情，让所有人都没有想到...',
    tone: '震惊',
  },
  {
    when: 'segment_type === "transition"',
    useTemplate: '转场来到了下一个场景...',
    tone: '平静',
  },
];
```

---

## 7. 性能估算

### 7.1 处理时间估算

| 视频时长 | Step 2 AI分析 | Step 3 语义分段 | Step 5 脚本生成 | Step 6 TTS | Step 7 渲染 | 总计 |
|---------|--------------|----------------|----------------|------------|------------|------|
| 1 分钟 | ~5 秒 | ~10 秒 | ~15 秒 | ~10 秒 | ~30 秒 | ~70 秒 |
| 10 分钟 | ~30 秒 | ~60 秒 | ~90 秒 | ~60 秒 | ~3 分钟 | ~6 分钟 |
| 1 小时 | ~3 分钟 | ~5 分钟 | ~10 分钟 | ~5 分钟 | ~15 分钟 | ~40 分钟 |

### 7.2 并行化优化

- **LLM 调用**：多个 segment 的语义分析并行（最多 4 并发）
- **TTS 合成**：多个 segment 并行合成（最多 8 并发）
- **FFmpeg**：多个 segment 的切割并行（Tokio Semaphore 控制，8 并发）

### 7.3 缓存策略

| 缓存类型 | 键 | 有效期 | 说明 |
|---------|---|-------|------|
| 语义分段结果 | video_hash | 永久 | 相同视频不重复分析 |
| TTS 音频 | text_hash | 会话内 | 相同文本不重复合成 |
| 中间视频 | segment_id | 会话内 | 临时目录，重启清理 |

### 7.4 性能基线

- 1 分钟视频 → 约 10 秒处理
- 10 分钟视频 → 约 60 秒处理
- 1 小时视频 → 约 5-10 分钟处理

---

## 8. 费用估算

### 8.1 LLM 调用成本

#### Step 3: 语义分段

```typescript
// 输入：每个 segment 描述约 200 字
// 输出：每个 segment 语义标注约 300 字
const SEMANTIC_COST_PER_SEGMENT = {
  input_tokens: 300,     // prompt + segment 描述
  output_tokens: 400,    // 语义标注 JSON
};

// 假设 1 小时视频有 200 个 segments
const SEMANTIC_TOTAL = 200 * (300 + 400) = 140,000 tokens
const SEMANTIC_COST = 140000 * 0.00001; // ~$1.4 (DeepSeek V4-Pro)
```

#### Step 5: 脚本生成

```typescript
// 输入：segment 信息 + 上下文 + style 约 500 字
// 输出：解说词约 300 字
const SCRIPT_COST_PER_SEGMENT = {
  input_tokens: 600,
  output_tokens: 400,
};

// 假设 1 小时视频生成 30 段解说
const SCRIPT_TOTAL = 30 * (600 + 400) = 30,000 tokens
const SCRIPT_COST = 30000 * 0.00001; // ~$0.3
```

#### Step 4: Director Agent 规划

```typescript
// 规划调用约 1000 输入 + 500 输出
const PLANNING_COST = 1500 * 0.00001; // ~$0.015
```

### 8.2 各视频时长费用估算

| 视频时长 | Segments 数 | 解说段数 | LLM 费用 | TTS 费用 | 总计 |
|---------|------------|---------|---------|---------|------|
| 1 分钟 | 30 | 5 | ~$0.15 | ~$0.05 | ~$0.20 |
| 10 分钟 | 100 | 15 | ~$0.50 | ~$0.15 | ~$0.65 |
| 1 小时 | 200 | 30 | ~$1.72 | ~$0.30 | ~$2.02 |

### 8.3 TTS 成本

- Edge TTS：免费
- Azure TTS：约 $0.001/千字符
- 1 小时解说词约 10 万字符 → ~$0.10

### 8.4 总结

| 项目 | 费用 |
|------|------|
| LLM 调用（1小时视频） | ~$1.70 |
| TTS（1小时视频） | ~$0.10 |
| FFmpeg/渲染 | 免费（本地） |
| **总计** | **~$1.80/小时视频** |

---

## 9. 用户体验设计

### 9.1 工作流引导 UI

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

### 9.2 Review 阶段 UI

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

## 10. 技术约束与边界

### 10.1 输入限制

| 类型 | 限制 |
|------|------|
| 视频格式 | MP4, MOV, AVI, MKV（FFmpeg 支持的格式） |
| 视频时长 | 30 秒 - 3 小时 |
| 视频大小 | 最大 10GB（受 FFmpeg 处理能力限制） |
| 分辨率 | 最大 4K（超过 1080p 会降采样） |

### 10.2 输出限制

| 类型 | 限制 |
|------|------|
| 解说时长 | 30 秒 - 30 分钟 |
| 目标语言 | 中文（其他语言 TTS 后续扩展） |
| 输出格式 | MP4（H.264 + AAC） |

### 10.3 输出格式配置

| 平台 | 比例 | 分辨率 | 码率 |
|------|------|--------|------|
| 抖音/快手 | 9:16 | 1080x1920 | 8-12 Mbps |
| Instagram | 1:1 | 1080x1080 | 8 Mbps |
| YouTube/B站 | 16:9 | 1920x1080 | 10-15 Mbps |

### 10.4 文件命名规范

```
{project_name}_{style}_{aspect_ratio}_{timestamp}.mp4
例：霸道总裁爱上我_幽默版_9:16_20240520.mp4
```

---

## 附录：完整流程伪代码

```typescript
async function runCommentaryMode(
  videoPath: string,
  config: CommentarProjectConfig
): Promise<RenderResult> {
  const director = new DirectorAgent();
  
  try {
    // Step 1: 视频导入
    director.setPhase('analyzing');
    const videoInfo = await importVideo(videoPath, config);
    
    // Step 2: AI 分析
    const rawSegments = await smartSegmenter.analyze(videoInfo);
    
    // Step 3: 语义分段
    const semanticSegments = await director.semanticSegment(rawSegments);
    
    // Step 4: 规划
    director.setPhase('planning');
    let plan = await director.generatePlan(semanticSegments, config);
    
    // Step 5: Review 循环
    director.setPhase('reviewing');
    while (true) {
      const userFeedback = await director.waitForReview();
      if (userFeedback.confirmed) break;
      
      director.setPhase('revising');
      plan = await director.revisePlan(userFeedback修改);
      director.setPhase('planning');
    }
    
    // Step 5: 脚本生成
    plan = await scriptGenerator.generate(plan);
    
    // Step 6: TTS 合成
    const track = await commentarySynth.synthesize(plan);
    
    // Step 7: 渲染
    director.setPhase('executing');
    const result = await renderEngine.render(plan, track);
    
    director.setPhase('completed');
    return result;
    
  } catch (error) {
    director.setPhase('error');
    throw error;
  }
}
```