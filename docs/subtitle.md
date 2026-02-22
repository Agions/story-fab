# 智能字幕

ClipFlow 支持语音转文字字幕生成。

## 使用方法

```typescript
import { subtitleService } from '@/core/services/subtitle.service';

// 生成字幕
const subtitles = await subtitleService.generateFromAudio(audioUrl);

// 导出字幕
const srt = subtitleService.export(subtitles.entries, 'srt');
```

## 功能

| 功能 | 说明 |
|------|------|
| 语音识别 | 实时语音转文字 |
| 多语言 | 支持中/英/日/韩 |
| 多种格式 | SRT/VTT/ASS/TXT |
| 实时预览 | 边说边显示字幕 |

## 支持格式

- **SRT**: 通用字幕格式
- **VTT**: WebVTT 格式
- **ASS**: ASS 特效字幕
- **TXT**: 纯文本
