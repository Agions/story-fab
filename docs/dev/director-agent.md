---
title: 导演 Agent
---

# 导演 Agent

## 职责

模拟人类导演创作思维，把控解说视频的节奏、停顿、语气。

## 状态机

```
idle  ──►  analyzing  ──►  planning  ──►  approved
                                       │
                                       ▼
                                   revising  ──►  approved
```

## 上下文

```ts
interface DirectorContext {
  video: VideoMeta;
  transcript: TranscriptSegment[];
  userPreferences: UserPreferences;
  previousPlan?: DirectorPlan;
}
```

## 阶段实现

| 阶段 | 行为 |
| --- | --- |
| 分析 | Whisper 字幕 + 视觉特征，识别叙事弧线 |
| 规划 | 输出 `DirectorPlan`（段落、风格、长度） |
| 修订 | 根据用户反馈重新规划 |

## 改动范围

Director 可修改：

- 段落切分（重排、合并、拆分）
- 风格（幽默 / 震惊 / 感动 / 专业 / 纪录片）
- 长度（短 / 中 / 长）
- 优先级（哪些段落保留）

Director 不可修改：

- 视频本身
- 原始 Whisper 字幕
- 时间戳对齐

## 错误处理

| 错误 | 行为 |
| --- | --- |
| LLM 调用失败 | 切换 Provider 重试 |
| 用户反馈为空 | 重提请求 |
| 输出 JSON 解析失败 | 回退到上一次的 plan |

## 性能

| 操作 | 延迟 |
| --- | --- |
| 分析 | 5-15 秒 |
| 规划 | 10-30 秒 |
| 修订 | 5-15 秒 |

## API

```ts
interface IDirectorAgent {
  analyze(ctx: DirectorContext): Promise<DirectorPlan>;
  revise(plan: DirectorPlan, feedback: string): Promise<DirectorPlan>;
}
```

实现位于 `src/core/pipeline/steps/commentary/CommentaryDirectorStep.ts`，通过 `src/core/services/commentary/` 入口调用。

## 模块依赖

```
Director
├── core/services/providers/    LLM 抽象
├── core/pipeline/steps/        Pipeline 编排
└── core/types/commentary       类型
```

## 扩展

新增风格：扩展 `DirectorStyle` 枚举 + 在 `prompts.ts` 加 Prompt 模板。

新增输出格式：在 `DirectorPlan` 类型上加字段 + 修订 prompt。