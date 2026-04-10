/**
 * Repurposing Step — 内容复用步骤
 *
 * 将长视频自动拆条为多个可发布的短视频片段。
 *
 * 完整管道：
 *   1. 构建候选片段（场景边界 / 均匀切分）
 *   2. 多维评分（ClipScorer 6 维度）
 *   3. SEO 元数据生成（平台标题/描述/hashtags）
 *   4. 多格式导出任务准备（9:16 / 1:1 / 16:9）
 */

import { logger } from '@/utils/logger';
import { clipRepurposingPipeline } from '../../clipRepurposing/pipeline';
import type { VideoInfo } from '@/core/types';
import type { VideoAnalysis } from '@/core/types';
import type { RepurposingResult } from '../../clipRepurposing/pipeline';

export interface RepurposingStepConfig {
  enabled: boolean;
  targetClipCount?: number;
  minClipDuration?: number;
  maxClipDuration?: number;
  platform?: 'youtube' | 'tiktok' | 'instagram';
  exportFormats?: Array<'9:16' | '1:1' | '16:9'>;
  multiFormat?: boolean;
  generateSEO?: boolean;
}

/**
 * 执行内容复用步骤
 *
 * @returns RepurposingResult 或 null（未启用时）
 */
export async function executeRepurposingStep(
  videoInfo: VideoInfo,
  analysis: VideoAnalysis,
  config: RepurposingStepConfig,
  onProgress?: (progress: number, message?: string) => void,
): Promise<RepurposingResult | null> {
  if (!config?.enabled) {
    logger.info('[executeRepurposingStep] 未启用，跳过');
    return null;
  }

  if (!videoInfo?.duration) {
    throw new Error('缺少视频信息用于内容复用');
  }

  logger.info('[executeRepurposingStep] 开始内容复用', {
    videoDuration: videoInfo.duration,
    targetClips: config.targetClipCount ?? 5,
    platform: config.platform ?? 'youtube',
  });

  const result = await clipRepurposingPipeline.run(
    videoInfo,
    analysis,
    {
      targetClipCount: config.targetClipCount ?? 5,
      minClipDuration: config.minClipDuration ?? 15,
      maxClipDuration: config.maxClipDuration ?? 120,
      platform: config.platform ?? 'youtube',
      exportFormats: config.exportFormats ?? ['9:16'],
      multiFormat: config.multiFormat ?? false,
      generateSEO: config.generateSEO ?? true,
      onProgress: (stage, progress, message) => {
        logger.info(`[RepurposingStage] ${stage}`, { progress, message });
        onProgress?.(progress, message);
      },
    },
  );

  logger.info('[executeRepurposingStep] 完成', {
    outputClips: result.clips.length,
    totalOutputDuration: result.totalOutputDuration,
  });

  return result;
}
