/**
 * IVideoProcessor - 视频处理管道接口
 *
 * 可实现为 Tauri 后端调用 / WebCodecs / 纯计算等不同驱动。
 * 所有方法均为异步，错误通过 VideoProcessingError 抛出。
 */
import type {
  VideoMetadata,
  KeyFrame,
  VideoSegment,
  ExtractKeyFramesOptions,
  CutOptions,
  FFmpegStatus,
} from './types';

export { VideoMetadata, KeyFrame, VideoSegment, ExtractKeyFramesOptions, CutOptions, FFmpegStatus };

export interface IVideoProcessor {
  // ---------- FFmpeg ----------

  /** 检查 FFmpeg 是否可用 */
  checkStatus(): Promise<FFmpegStatus>;

  /** 确保 FFmpeg 可用，否则抛错 */
  ensureAvailable(): Promise<boolean>;

  /** 获取硬件加速类型（如 'nvenc' | 'qsv' | null） */
  getHardwareAcceleration(): Promise<string | null>;

  // ---------- Analysis ----------

  /** 分析视频并返回元数据 */
  analyze(videoPath: string): Promise<VideoMetadata>;

  // ---------- Extraction ----------

  /** 提取关键帧 */
  extractKeyFrames(videoPath: string, options?: ExtractKeyFramesOptions): Promise<KeyFrame[]>;

  /** 生成缩略图（指定时间点） */
  generateThumbnail(videoPath: string, time?: number): Promise<string>;

  // ---------- Editing ----------

  /** 剪辑视频片段 */
  cut(inputPath: string, outputPath: string, segments: VideoSegment[], options?: CutOptions): Promise<string>;

  /** 生成片段预览 */
  preview(inputPath: string, segment: VideoSegment): Promise<string>;
}
