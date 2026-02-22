# 视频特效

ClipFlow 提供丰富的视频特效支持。

## 使用方法

```typescript
import { videoEffectService } from '@/core/services/video-effect.service';

// 应用预设
videoEffectService.applyPreset('vintage');

// 应用到视频元素
videoEffectService.applyToVideoElement(videoElement);
```

## 滤镜效果

| 效果 | 说明 |
|------|------|
| grayscale | 黑白 |
| sepia | 复古棕 |
| blur | 模糊 |
| brightness | 亮度 |
| contrast | 对比度 |
| saturate | 饱和度 |
| hue-rotate | 色相旋转 |

## 颜色校正

| 参数 | 范围 |
|------|------|
| brightness | -100 ~ 100 |
| contrast | -100 ~ 100 |
| saturation | -100 ~ 100 |
| temperature | -100 ~ 100 |

## 内置预设

- vintage (复古)
- noir (黑白电影)
- vibrant (鲜艳)
- warm (暖色调)
- cool (冷色调)
- smooth-fade (淡入淡出)
