---
title: 解说工作流
---

# 解说工作流

## 5 步 Pipeline（累积式 State Chain）

```
Director  ──►  Visual  ──►  Narration  ──►  Timing  ──►  Overlay  ──►  成片
```

### 1. Director

策划节奏、段落优先级、风格定位。可手动调整。

### 2. Visual

镜头语义分段 + 关键帧提取。

### 3. Narration

LLM 生成逐句解说词。

### 4. Timing

字幕与配音时间轴对齐。

### 5. Overlay

烧字幕 + 视觉叠加层。

> 详细流程参考 [commentary-mode.md](../../guide/commentary-mode.md)。

## 状态机

累积式 state chain：每步的输入 = 上一步的输出 + 当前步配置。类型安全保证。

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

## 脚本生成

详见 [script-generation.md](script-generation.md)。

## TTS 合成

- Edge TTS：在线，离线模式可用微软预下载包
- Azure TTS：需 API 密钥

## 渲染管线

FFmpeg 调用链：

```
字幕 SRT/VTT → 烧字幕 → 多轨道合成 → 多比例输出
```

## 失败回退

每步独立可重试：

| 失败 | 行为 |
| --- | --- |
| Director | 跳过，使用默认规划 |
| Visual | 改用 Whisper 字幕作为分段依据 |
| Narration | 自动切换到下一优先级 Provider |
| Timing | 重试 3 次后用线性对齐 |
| Overlay | 跳过视觉层，仅烧字幕 |

## 性能与成本

| 阶段 | 耗时（5 分钟视频） | 成本 |
| --- | --- | --- |
| Director | 10-20 秒 | $0.01-0.05 |
| Visual | 30-60 秒 | $0.05-0.20 |
| Narration | 15-30 秒 | $0.10-0.30 |
| Timing | 5-10 秒 | $0.00 |
| Overlay | 10-20 秒 | $0.02-0.05 |
| Render | 30-60 秒 | $0.00 |
| **合计** | **2-3 分钟** | **$0.20-0.60** |

## 输入限制

| 项 | 限制 |
| --- | --- |
| 视频长度 | 30 秒 - 30 分钟 |
| 文件大小 | ≤ 2GB |
| 输出比例 | 9:16 / 1:1 / 16:9 / 4:5 / 21:9 |