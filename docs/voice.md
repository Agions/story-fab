# 语音合成

ClipFlow 支持文字转语音配音。

## 使用方法

```typescript
import { voiceSynthesisService } from '@/core/services/voice-synthesis.service';

// 获取可用语音
const voices = voiceSynthesisService.getVoices();

// 预览语音
voiceSynthesisService.preview('你好，我是 ClipFlow');

// 合成语音
const result = await voiceSynthesisService.synthesize('配音文本');
```

## 功能

| 功能 | 说明 |
|------|------|
| 多语音 | 多种语音可选 |
| 语速调节 | 0.1 - 10 倍 |
| 音调调节 | 0 - 2 |
| 音量控制 | 0 - 1 |

## 语音风格

- **narrative**: 叙事风格
- **humor**: 幽默风格
- **professional**: 专业正式
- **casual**: 轻松随意
