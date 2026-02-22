# 混剪服务 API

## CommentaryMixService

解说混剪服务。

### 使用方法

```typescript
import { commentaryMixService } from '@/core/services/commentary-mix.service';

// 执行混剪
const result = await commentaryMixService.process(videos, {
  targetDuration: 120 // 目标时长 2 分钟
});
```

### 配置选项

```typescript
interface MixConfig {
  // 视频选择
  maxClips: number;           // 最多片段数
  minClipDuration: number;    // 最短片段
  maxClipDuration: number;    // 最长片段
  
  // 排序方式
  sortBy: 'random' | 'scene' | 'emotion' | 'motion';
  
  // 解说配置
  scriptStyle: 'narrative' | 'humor' | 'professional' | 'casual';
  scriptLength: 'short' | 'medium' | 'long';
  
  // 过渡效果
  transitionType: 'fade' | 'dissolve' | 'cut' | 'slide';
  transitionDuration: number;
  
  // 输出
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
}
```

### 方法

| 方法 | 说明 |
|------|------|
| `process()` | 执行解说混剪流程 |
| `updateConfig()` | 更新配置 |
| `getConfig()` | 获取当前配置 |

### 返回值

```typescript
interface MixResult {
  videoClips: VideoClipInfo[];  // 视频片段
  script: ScriptData;            // 解说脚本
  timeline: TimelineData;        // 时间轴数据
  metadata: {
    totalDuration: number;      // 总时长
    clipCount: number;          // 片段数量
    config: MixConfig;          // 使用的配置
  };
}
```
