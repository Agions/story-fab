---
title: 解说工作流
description: 5 步 Agent Pipeline · Director → Visual → Narration → Timing → Overlay
---

# 解说工作流

5 步 Agent Pipeline 自动生成解说视频。每步状态累积,类型安全 + 单元测试覆盖。

## 5 步 Pipeline

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

## 状态机

**累积式 state chain**: 每步的输入 = 上一步的输出 + 当前步配置。

```ts
type CommentaryPipelineState = {
  video: VideoMeta;
  director: DirectorPlan;
  visual: VisualAnalysisOutput;
  narration: DraftScript;
  timing: AlignedSegments;
  overlay: OverlayPlan;
};
```

实现位置: `src/core/pipeline/steps/commentary/`

| Step | 文件 | 职责 |
| --- | --- | --- |
| Director | `CommentaryDirectorStep.ts` | Director Agent 策划节奏 / 风格 |
| Visual | `CommentaryVisualStep.ts` | 镜头语义分段 + 关键帧提取 |
| Narration | `CommentaryNarrationStep.ts` | LLM 生成逐句解说词 |
| Timing | `CommentaryTimingStep.ts` | 字幕与配音时间对齐 |
| Overlay | `CommentaryOverlayStep.ts` | 烧字幕 + 视觉叠加层 |
| 编排 | `CompositeCommentaryPipeline.ts` | 串起 5 步 + 失败重试 |

---

## 1. Director

策划节奏、段落优先级、风格定位。可手动调整。

**状态机**:

```
idle → analyzing → planning → approved
                              │
                              ▼
                          revising → approved
```

**上下文**:

```ts
interface DirectorContext {
  video: VideoMeta;
  transcript: TranscriptSegment[];
  userPreferences: UserPreferences;
  previousPlan?: DirectorPlan;
}
```

**Director 可修改**:

- 段落切分 (重排、合并、拆分)
- 风格 (幽默 / 震惊 / 感动 / 专业 / 纪录片)
- 长度 (短 / 中 / 长)
- 优先级 (哪些段落保留)

**Director 不可修改**:

- 视频本身
- 原始 Whisper 字幕
- 时间戳对齐

**性能**:

| 操作 | 延迟 |
| --- | --- |
| 分析 | 5-15 秒 |
| 规划 | 10-30 秒 |
| 修订 | 5-15 秒 |

**错误处理**:

| 错误 | 行为 |
| --- | --- |
| LLM 调用失败 | 切换 Provider 重试 |
| 用户反馈为空 | 重提请求 |
| 输出 JSON 解析失败 | 回退到上一次的 plan |

---

## 2. Visual

镜头语义分段 + 关键帧提取。使用 LLM 把视频分成语义完整的小段,每段 30-90 秒。分段结果直接驱动后续 Pipeline。

---

## 3. Narration (脚本生成)

LLM 生成逐句解说词。

**工作流**:

```
视频 + Whisper 字幕
        │
        ▼
  上下文组装 (视频元数据 + 字幕摘要 + 风格偏好)
        │
        ▼
  LLM 生成 (10 家 Provider 可选)
        │
        ▼
  脚本解析 (分段 + 时间戳对齐)
        │
        ▼
  质量检查 (一致性 / 长度 / 风格)
        │
        ▼
  输出 (JSON + Markdown 双格式)
```

**Prompt 模板** (位置: `src/core/services/providers/prompts.ts`):

- 5 种风格独立模板: 幽默 / 震惊 / 感动 / 专业 / 纪录片
- 模板变量: `{transcript}` / `{previousSegment}` / `{style}` / `{duration}` / `{intent}`

**LLM Provider (10 家)**:

| Provider | 典型模型 | 协议 |
| --- | --- | --- |
| OpenAI | gpt-4o, gpt-4o-mini | openai |
| Anthropic | claude-3-5-sonnet, claude-haiku | anthropic |
| Google | gemini-1.5-pro, gemini-1.5-flash | google |
| Alibaba (Qwen) | qwen-plus, qwen-turbo | openaiLike |
| Zhipu (智谱) | glm-4, glm-4-flash | openaiLike |
| iFlytek (讯飞) | spark-v3.5 | 自有 |
| DeepSeek | deepseek-chat, deepseek-reasoner | openaiLike |
| Moonshot (Kimi) | moonshot-v1-128k | openaiLike |
| Local | Ollama / LM Studio | openaiLike |
| Custom | 自定义 OpenAI 兼容端点 | openaiLike |

**脚本数据结构**:

```ts
interface DraftScript {
  segments: ScriptSegment[];
  metadata: ScriptMetadata;
}

interface ScriptSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: ScriptStyle;
  voiceHint?: string;
}
```

**质量检查**:

| 检查 | 规则 |
| --- | --- |
| 一致性 | 段落衔接是否自然 |
| 长度 | 每段时长 5-30 秒 |
| 风格 | 风格匹配 prompt 指令 |
| 字数 | 每分钟 150-300 字 |

**风格与时长**:

| 风格 | 平均长度 | 句式 |
| --- | --- | --- |
| 幽默 | 8-15 秒 | 短句 + 反转 |
| 震惊 | 5-12 秒 | 感叹 + 数字 |
| 感动 | 12-25 秒 | 描述 + 抒情 |
| 专业 | 10-20 秒 | 术语 + 解释 |
| 纪录片 | 15-30 秒 | 叙述 + 引用 |

**缓存与成本**:

- 缓存位置: `<config-dir>/script-cache/<video-hash>.json`
- 命中条件: 同视频 + 同风格 + 同 Provider
- LLM 调用成本: $0.05-0.20 / 5 分钟视频

**输出格式**:

| 格式 | 路径 |
| --- | --- |
| JSON | `<project>/scripts/<id>.json` |
| Markdown | `<project>/scripts/<id>.md` |
| SRT | `<project>/scripts/<id>.srt` (可选) |

---

## 4. Timing

字幕与配音时间轴对齐。失败时重试 3 次后用线性对齐。

---

## 5. Overlay

烧字幕 + 视觉叠加层。失败时跳过视觉层,仅烧字幕。

**TTS 合成**:

- **Edge TTS**: 在线,免费,几十种音色 (zh-CN-XiaoxiaoNeural 等)
- **Azure TTS**: 需 API 密钥,音色质量更高

**FFmpeg 渲染管线**:

```
字幕 SRT/VTT → 烧字幕 → 多轨道合成 → 多比例输出
```

**性能与成本** (5 分钟视频参考):

| 阶段 | 耗时 | 成本 |
| --- | --- | --- |
| Director | 10-20 秒 | $0.01-0.05 |
| Visual | 30-60 秒 | $0.05-0.20 |
| Narration | 15-30 秒 | $0.10-0.30 |
| Timing | 5-10 秒 | $0.00 |
| Overlay | 10-20 秒 | $0.02-0.05 |
| Render | 30-60 秒 | $0.00 |
| **合计** | **2-3 分钟** | **$0.20-0.60** |

---

## 失败回退

每步独立可重试。任一步失败时,保留已完成步骤的结果,从失败点重试,不重头开始。

| 失败 | 行为 |
| --- | --- |
| Director | 跳过,使用默认规划 |
| Visual | 改用 Whisper 字幕作为分段依据 |
| Narration | 自动切换到下一优先级 Provider |
| Timing | 重试 3 次后用线性对齐 |
| Overlay | 跳过视觉层,仅烧字幕 |

---

## 输入限制

| 项 | 限制 |
| --- | --- |
| 视频长度 | 30 秒 - 30 分钟 |
| 文件大小 | ≤ 2GB |
| 输出比例 | 9:16 / 1:1 / 16:9 / 4:5 / 21:9 |
| LLM Provider | 10 家可选 |
| TTS 引擎 | Edge TTS / Azure TTS |

---

## 相关文档

- 用户视角: [commentary-mode.md](../features/commentary-mode.md)
- LLM Provider 添加: [ai-services.md](ai-services.md)
- IPC 命令: [tauri-commands.md](tauri-commands.md)
