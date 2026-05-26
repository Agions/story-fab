# AI 服务

StoryFab 通过** Provider 抽象层**支持多个 AI 后端，无需修改业务代码即可切换模型。

## Provider 架构

```
src/core/services/providers/
├── base.service.ts       # BaseProvider 抽象类
├── openai.service.ts     # OpenAI GPT-4o / GPT-5
├── anthropic.service.ts  # Anthropic Claude
├── deepseek.service.ts   # DeepSeek V4 / Chat
├── siliconflow.service.ts # SiliconFlow（OpenAI 兼容）
└── index.ts              # Provider 注册表
```

## Base Provider 接口

所有 Provider 必须实现：

```typescript
interface AIProvider {
  generateScript(transcript: string, options?: ScriptOptions): Promise<string>
  generateTitle(transcript: string): Promise<string>
  generateDescription(transcript: string): Promise<string>
}
```

## 新增 Provider

1. 创建 `src/core/services/providers/myprovider.service.ts`
2. 继承 `BaseProvider` 并实现接口
3. 在 `src/core/services/providers/index.ts` 注册
4. 在 Settings 页面添加配置 UI

## Whisper（本地）

Whisper 通过 `src-tauri/src/subtitle.rs` 完全本地运行：

- 基于 `faster-whisper`（CTranslate2 实现）
- 模型按需下载到 `~/.cache/whisper/`
- 支持 CPU 和 CUDA 推理

## Edge TTS（本地语音合成）

Edge TTS 用于本地语音旁白合成：

- 无需 API Key
- 通过子进程调用 `edge-tts` CLI
- 通过 stdin/stdout 通信
- 语音库：[Microsoft Edge TTS 语音](https://speech.platform.bing.com/consumer/sapi/voices)
