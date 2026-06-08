---
title: 脚本生成
---

# 脚本生成

## Pipeline

```
视频 + Whisper 字幕
        │
        ▼
  上下文组装（视频元数据 + 字幕摘要 + 风格偏好）
        │
        ▼
  LLM 生成（5 家 Provider 可选）
        │
        ▼
  脚本解析（分段 + 时间戳对齐）
        │
        ▼
  质量检查（一致性 / 长度 / 风格）
        │
        ▼
  输出（JSON + Markdown 双格式）
```

## 上下文组装

Director 阶段产出的 `DirectorPlan` 作为输入：

```ts
interface DirectorPlan {
  segments: Array<{
    id: string;
    startTime: number;
    endTime: number;
    intent: 'hook' | 'body' | 'reveal' | 'transition' | 'cta';
    style: 'humor' | 'shock' | 'emotion' | 'professional' | 'documentary';
  }>;
  overallTone: string;
  targetDuration: number;
}
```

## Prompt 模板

每种风格有独立模板，位置：`src/core/services/providers/prompts.ts`。

模板变量：

- `{transcript}` — 当前段 Whisper 转录
- `{previousSegment}` — 上一段解说（保持连贯）
- `{style}` — 风格
- `{duration}` — 目标时长
- `{intent}` — 段落意图

## LLM 调用

5 家 Provider：

- OpenAI（gpt-4o-mini）
- Anthropic（claude-haiku）
- Google（gemini-1.5-flash）
- DeepSeek（deepseek-chat）
- Qwen（qwen-plus）

## 脚本解析

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

## 质量检查

| 检查 | 规则 |
| --- | --- |
| 一致性 | 段落衔接是否自然 |
| 长度 | 每段时长 5-30 秒 |
| 风格 | 风格匹配 prompt 指令 |
| 字数 | 每分钟 150-300 字 |

## 风格与时长

| 风格 | 平均长度 | 句式 |
| --- | --- | --- |
| 幽默 | 8-15 秒 | 短句 + 反转 |
| 震惊 | 5-12 秒 | 感叹 + 数字 |
| 感动 | 12-25 秒 | 描述 + 抒情 |
| 专业 | 10-20 秒 | 术语 + 解释 |
| 纪录片 | 15-30 秒 | 叙述 + 引用 |

## 批处理

可同时生成多段解说。失败段落可独立重试。

## 缓存与成本

- 缓存位置：`<config-dir>/script-cache/<video-hash>.json`
- 命中条件：同视频 + 同风格 + 同 Provider
- 单次 LLM 调用成本：$0.05-0.20 / 5 分钟视频

## 输出

| 格式 | 路径 |
| --- | --- |
| JSON | `<project>/scripts/<id>.json` |
| Markdown | `<project>/scripts/<id>.md` |
| SRT | `<project>/scripts/<id>.srt`（可选） |