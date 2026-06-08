---
title: AI 服务
---

# AI 服务

## Provider 架构

```
src/core/services/providers/
├── base.service.ts       抽象基类
├── openai.ts
├── openaiLike.ts        兼容 OpenAI 协议（DeepSeek / Qwen）
├── anthropic.ts
├── google.ts
├── baidu.ts
├── mock.ts
├── apiKeyService.ts     API 密钥管理
├── prompts.ts           Prompt 模板
├── backendApi.ts        后端 API 代理
└── types.ts
```

## 接口

```ts
interface IAIService {
  chat(request: ChatRequest): Promise<ChatResponse>;
  validateCredentials(): Promise<boolean>;
  listModels(): Promise<AIModel[]>;
}
```

## 添加新 Provider

1. 创建 `xxx.ts` 实现 `IAIService`
2. 在 `index.ts` 注册
3. 在 `src/core/config/aiModels.config.ts` 加配置
4. 在 UI 设置页加 API 密钥输入

## Whisper

- 本地运行（`faster-whisper`）
- 模型：`tiny` / `base` / `small` / `medium` / `large-v3`
- 存储：`<config-dir>/whisper-models/`

## Edge TTS

- 微软 Edge 在线 TTS
- 通过 `edge-tts` Node 包调用
- 几十种音色

## 性能与成本

| Provider | 平均响应 | 每千 tokens 成本 |
| --- | --- | --- |
| OpenAI GPT-4o-mini | 1-3 秒 | $0.15 / 1M tokens |
| DeepSeek V3 | 2-5 秒 | $0.27 / 1M tokens |
| Qwen Plus | 1-3 秒 | $0.40 / 1M tokens |
| Gemini 1.5 Flash | 1-2 秒 | $0.075 / 1M tokens |
| Anthropic Claude Haiku | 1-3 秒 | $0.25 / 1M tokens |

## 验证

```bash
pnpm test -- src/core/services/providers
```