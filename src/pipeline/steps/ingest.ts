/**
 * 步骤 1: 素材导入
 * 视频文件 → VideoInfo（元数据提取）
 */

import type { PipelineStep, PipelineDataContext } from '../engine';
import type { VideoInfo } from '@/types';
import { videoProcessor } from '@/core/video';

export const ingestStep: PipelineStep<string, VideoInfo> = {
  name: 'ingest',

  validate(input) {
    if (!input?.trim()) {
      return { valid: false, reason: '视频路径不能为空' };
    }
    return { valid: true };
  },

  async execute(videoPath: string, ctx: PipelineDataContext): Promise<VideoInfo> {
    const metadata = await videoProcessor.analyze(videoPath);

    const videoInfo: VideoInfo = {
      id: `video_${ctx.projectId}`,
      name: videoPath.split('/').pop() ?? 'unknown',
      path: videoPath,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      size: metadata.fileSize ?? 0,
      fps: metadata.fps,
      format: metadata.codec,
    };

    return videoInfo;
  },
};
