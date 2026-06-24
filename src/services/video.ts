/**
 * 视频处理服务统一导出
 * 合并自 core/services/video/ + core/video/
 */

// ─── 视频处理器 ───
export { videoProcessor, TauriVideoProcessor } from '@/core/video';
export { BaseVideoProcessor, VideoProcessingError, normalizeVideoError } from '@/core/video';

// ─── 视频特效 ───
export { videoEffectService, VideoEffectService } from '@/core/services/video/video-effect-service';
export { detectEmotionPeaks, calculateEmotionScore } from '@/core/services/video/emotion-detector';

// ─── 视频类型 ───
export type {
  VideoMetadata,
  KeyFrame,
  SimpleVideoSegment,
  ExtractKeyFramesOptions,
  TranscodeOptions,
  CutOptions,
  FFmpegStatus,
  ProcessingProgress,
  ProgressCallback,
} from '@/types';
