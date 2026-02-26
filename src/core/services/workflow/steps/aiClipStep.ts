import { aiClipService } from '../../aiClip.service';
import type { VideoInfo } from '@/core/types';

export interface AIClipConfig {
  enabled: boolean;
  autoClip: boolean;
  detectSceneChange: boolean;
  detectSilence: boolean;
  removeSilence: boolean;
  targetDuration?: number;
  pacingStyle: 'fast' | 'normal' | 'slow';
}

export async function executeAIClipStep(
  videoInfo: VideoInfo,
  aiClipConfig: AIClipConfig,
  updateProgress?: (progress: number) => void
): Promise<void> {
  if (!aiClipConfig?.enabled) return;

  const clipConfig = {
    detectSceneChange: aiClipConfig.detectSceneChange ?? true,
    detectSilence: aiClipConfig.detectSilence ?? true,
    detectKeyframes: true,
    detectEmotion: false,
    removeSilence: aiClipConfig.removeSilence ?? true,
    trimDeadTime: true,
    autoTransition: true,
    transitionType: 'fade' as const,
    aiOptimize: true,
    targetDuration: aiClipConfig.targetDuration,
    pacingStyle: aiClipConfig.pacingStyle ?? 'normal',
  };

  try {
    if (aiClipConfig.autoClip) {
      await aiClipService.smartClip(
        videoInfo,
        clipConfig.targetDuration,
        clipConfig.pacingStyle
      );
    } else {
      await aiClipService.analyzeVideo(videoInfo, clipConfig);
    }

    updateProgress?.(68);
  } catch (error) {
    console.error('AI 剪辑步骤失败:', error);
    // AI 剪辑失败不中断整个工作流
  }
}
