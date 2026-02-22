# 剪辑服务 API

## ClipWorkflowService

智能剪辑工作流服务。

### 使用方法

```typescript
import { clipWorkflowService } from '@/core/services/clip-workflow.service';

// 处理视频
const result = await clipWorkflowService.processVideo(videoInfo);

// 获取导出设置
const exportSettings = clipWorkflowService.getExportSettings();
```

### 配置选项

```typescript
interface ClipConfig {
  // 检测配置
  detectSceneChange: boolean;  // 场景检测
  detectSilence: boolean;      // 静音检测
  sceneThreshold: number;     // 场景阈值 (0-1)
  silenceThreshold: number;   // 静音阈值 (dB)
  
  // 剪辑选项
  removeSilence: boolean;     // 移除静音
  autoTransition: boolean;    // 自动转场
  transitionType: 'fade' | 'cut' | 'dissolve';
  
  // 输出质量
  outputQuality: 'low' | 'medium' | 'high' | '4k';
  outputFormat: 'mp4' | 'webm' | 'mov';
  bitrate: '2M' | '5M' | '8M' | '15M' | '30M';
  fps: 24 | 30 | 60;
}
```

### 方法

| 方法 | 说明 |
|------|------|
| `processVideo()` | 执行完整剪辑流程 |
| `getExportSettings()` | 获取导出配置 |
| `updateConfig()` | 更新配置 |
| `getConfig()` | 获取当前配置 |
