/**
 * Video Service (Facade)
 *
 * 兼容层：将所有导出代理到新的 @core/video 模块。
 * 新代码请直接 import { videoProcessor } from '@/core/video';
 *
 * 本文件保留以下导出以兼容已有调用点：
 *   - 类型（VideoMetadata, KeyFrame, VideoSegment, TranscodeOptions…）
 *   - 工具函数（formatDuration, formatResolution…）
 *   - 便捷函数（checkFFmpegInstallation, ensureFFmpegInstalled…）
 *
 * 不再新增功能，所有新开发走 videoProcessor 实例。
 */

// ---- Re-export types (backward compatibility) ----
export type {
  VideoMetadata,
  KeyFrame,
  VideoSegment,
  ProcessingProgress,
  TranscodeOptions,
  ExtractKeyFramesOptions,
  CutOptions,
  ProgressCallback,
} from '@/core/video';

// ---- Re-export formatters ----
export {
  formatDuration,
  formatResolution,
  formatBitrate,
  formatFileSize,
} from '@/core/video';

// ---- Delegate convenience functions to the processor instance ----
import { videoProcessor } from '@/core/video';
import type { VideoSegment, ExtractKeyFramesOptions, CutOptions } from '@/core/video';

export const checkFFmpegInstallation = () => videoProcessor.checkStatus();

export const ensureFFmpegInstalled = () => videoProcessor.ensureAvailable();

export const getHardwareAcceleration = () => videoProcessor.getHardwareAcceleration();

export const analyzeVideo = (videoPath: string) => videoProcessor.analyze(videoPath);

export const extractKeyFrames = (
  videoPath: string,
  options?: ExtractKeyFramesOptions
) => videoProcessor.extractKeyFrames(videoPath, options);

export const generateThumbnail = (videoPath: string, time?: number) =>
  videoProcessor.generateThumbnail(videoPath, time);

export const cutVideo = (
  inputPath: string,
  outputPath: string,
  segments: VideoSegment[],
  options?: CutOptions
) => videoProcessor.cut(inputPath, outputPath, segments, options);

export const previewSegment = (inputPath: string, segment: VideoSegment) =>
  videoProcessor.preview(inputPath, segment);
