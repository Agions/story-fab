---
title: 解说模式
---

# 解说模式

5 步 Agent Pipeline 自动生成解说视频。

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

每步状态累积，类型安全 + 单元测试覆盖。

## Director Agent

多轮对话式策划，把控节奏、停顿、语气。可手动调整风格、长度、受众。

## 输入与输出

| 项 | 要求 |
| --- | --- |
| 视频长度 | 30 秒 - 30 分钟 |
| LLM Provider | 5 家可选：OpenAI、DeepSeek、Qwen、Gemini、Anthropic |
| TTS 引擎 | Edge TTS / Azure TTS 双引擎 |
| 输出比例 | 9:16 / 1:1 / 16:9 |

## 性能

| 阶段 | 时长（参考） |
| --- | --- |
| Whisper 转录 | 视频时长 × 0.3 |
| Director 策划 | 5-15 秒 |
| Visual 分析 | 视频时长 × 0.5 |
| Narration 生成 | 10-30 秒 |
| TTS 合成 | 音频时长 × 0.4 |
| FFmpeg 渲染 | 视频时长 × 0.2 |

## 失败回退

任一步失败时：保留已完成步骤的结果，从失败点重试，不重头开始。