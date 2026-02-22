# 视频导出

ClipFlow 支持多种格式的视频导出，满足不同场景需求。

## 支持格式

| 格式 | 名称 | 说明 |
|------|------|------|
| MP4 | MPEG-4 | 通用格式，兼容性最好 |
| WebM | WebM | Web 优化格式 |
| MOV | QuickTime | Apple 格式 |
| MKV | Matroska | 灵活性高 |
| GIF | 动态图 | 无声音 |

## 音频导出

| 格式 | 说明 |
|------|------|
| MP3 | 通用音频格式 |
| WAV | 无损音频 |
| AAC | 高效率编码 |

## 使用方法

```typescript
import { exportService } from '@/core/services/export.service';

// 方式1: 使用预设
exportService.applyPreset('high');
const result = await exportService.startExport(timeline, (progress) => {
  console.log(`导出进度: ${progress.progress}%`);
});

// 方式2: 批量导出
const results = await exportService.batchExport(timeline, ['mp4', 'webm', 'gif']);

// 方式3: 导出为 GIF
const gifResult = await exportService.exportAsGif(timeline, {
  fps: 15,
  width: 480,
});
```

## 质量预设

| 预设 | 分辨率 | 帧率 | 适用场景 |
|------|--------|------|----------|
| low | 720p | 24 | 快速预览 |
| medium | 1080p | 30 | 社交媒体 |
| high | 1080p | 60 | 正式发布 |
| ultra | 4K | 60 | 专业制作 |

## 配置选项

### 视频设置

- **分辨率**: 480p / 720p / 1080p / 1440p / 4K
- **帧率**: 24 / 25 / 30 / 60
- **宽高比**: 16:9 / 9:16 / 1:1 / 4:3

### 音频设置

- **编码**: AAC / MP3 / Opus
- **码率**: 128k / 192k / 256k / 320k
- **采样率**: 44100 / 48000

### 高级选项

- 字幕嵌入
- 水印设置
- 自定义编码器
