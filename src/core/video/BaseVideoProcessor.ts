/**
 * BaseVideoProcessor - 视频处理基类
 *
 * 封装所有 IVideoProcessor 实现共享的逻辑：
 * - FFmpeg 状态缓存（TTL 30s）
 * - 统一的错误归一化
 * - ensureAvailable() 默认实现
 *
 * 使用方式：
 *   class TauriVideoProcessor extends BaseVideoProcessor implements IVideoProcessor { ... }
 */
import { IVideoProcessor, type FFmpegStatus } from './IVideoProcessor';
import type {
  VideoMetadata,
  VideoSegment,
  KeyFrame,
  ExtractKeyFramesOptions,
  CutOptions,
} from './types';
import { logger } from '../../shared/utils/logging';

// ============================================
// FFmpeg Status Cache
// ============================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

let ffmpegCache: CacheEntry<FFmpegStatus> | null = null;
const FFmpeg_CHECK_CACHE_TTL = 30_000; // 30s

// ============================================
// Error Normalization
// ============================================

export class VideoProcessingError extends Error {
  readonly operation: string;
  readonly isRetryable: boolean;

  constructor(operation: string, message: string, isRetryable = false) {
    super(message);
    this.name = 'VideoProcessingError';
    this.operation = operation;
    this.isRetryable = isRetryable;
  }
}

export function normalizeVideoError(error: unknown, operation: string): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('未安装FFmpeg') || message.includes('ffmpeg')) {
    return new VideoProcessingError(
      operation,
      `${operation}失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。`
    );
  }
  if (message.includes('ffprobe')) {
    return new VideoProcessingError(
      operation,
      `${operation}失败：无法执行 ffprobe 命令，请检查 FFmpeg 是否完整安装。`
    );
  }
  if (message.includes('解析JSON') || message.includes('parse')) {
    return new VideoProcessingError(operation, `${operation}失败：无法解析视频元数据。`);
  }
  if (message.includes('未找到视频流') || message.includes('video stream')) {
    return new VideoProcessingError(operation, `${operation}失败：无法识别视频流信息。`);
  }
  if (message.includes('路径不能为空')) {
    return new VideoProcessingError(operation, '视频路径无效。');
  }
  if (message.includes('权限') || message.includes('permission')) {
    return new VideoProcessingError(
      operation,
      `${operation}失败：文件权限不足，请检查文件访问权限。`
    );
  }
  if (message.includes('空间不足') || message.includes('no space')) {
    return new VideoProcessingError(operation, `${operation}失败：磁盘空间不足。`);
  }
  // 网络类错误可重试
  if (message.includes('timeout') || message.includes('ECONNREFUSED')) {
    return new VideoProcessingError(operation, `${operation}失败：网络超时，请检查连接。`, true);
  }
  return new VideoProcessingError(operation, `${operation}失败：${message}`);
}

// ============================================
// Base Class
// ============================================

export abstract class BaseVideoProcessor implements IVideoProcessor {
  // ---------- FFmpeg ----------

  async checkStatus(): Promise<FFmpegStatus> {
    if (ffmpegCache && Date.now() - ffmpegCache.timestamp < FFmpeg_CHECK_CACHE_TTL) {
      return ffmpegCache.value;
    }
    try {
      const result = await this.doCheckStatus();
      ffmpegCache = { value: result, timestamp: Date.now() };
      return result;
    } catch {
      const result = { installed: false };
      ffmpegCache = { value: result, timestamp: Date.now() };
      return result;
    }
  }

  async ensureAvailable(): Promise<boolean> {
    const { installed, version } = await this.checkStatus();
    if (!installed) {
      logger.warn('FFmpeg未安装');
      return false;
    }
    logger.info('FFmpeg已安装:', { version });
    return true;
  }

  async getHardwareAcceleration(): Promise<string | null> {
    try {
      return await this.doGetHardwareAcceleration();
    } catch {
      return null;
    }
  }

  // ---------- Analysis ----------

  async analyze(videoPath: string) {
    if (!videoPath?.trim()) throw new VideoProcessingError('分析', '视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new VideoProcessingError('分析', '未安装FFmpeg');
    logger.info('分析视频:', { videoPath });
    try {
      const metadata = await this.doAnalyze(videoPath);
      logger.debug('视频分析结果:', { metadata });
      return metadata;
    } catch (error) {
      logger.error('分析视频失败:', { error });
      throw normalizeVideoError(error, '分析');
    }
  }

  // ---------- Extraction ----------

  async extractKeyFrames(videoPath: string, options: ExtractKeyFramesOptions = {}, duration?: number) {
    if (!videoPath?.trim()) throw new VideoProcessingError('提取关键帧', '视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new VideoProcessingError('提取关键帧', '未安装FFmpeg');
    return this.doExtractKeyFrames(videoPath, options, duration);
  }

  async generateThumbnail(videoPath: string, time = 1) {
    if (!videoPath?.trim()) throw new VideoProcessingError('生成缩略图', '视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new VideoProcessingError('生成缩略图', '未安装FFmpeg');
    logger.info('生成视频缩略图:', { videoPath, time });
    try {
      const thumbnailPath = await this.doGenerateThumbnail(videoPath, time);
      logger.debug('缩略图生成成功:', { thumbnailPath });
      return thumbnailPath;
    } catch (error) {
      logger.error('生成缩略图失败:', { error });
      throw normalizeVideoError(error, '生成缩略图');
    }
  }

  // ---------- Editing ----------

  async cut(inputPath: string, outputPath: string, segments: VideoSegment[], options: CutOptions = {}) {
    if (!inputPath?.trim() || !outputPath?.trim()) {
      throw new VideoProcessingError('剪辑', '输入或输出路径不能为空');
    }
    if (!segments?.length) throw new VideoProcessingError('剪辑', '至少需要一个视频片段');
    if (!(await this.ensureAvailable())) throw new VideoProcessingError('剪辑', '未安装FFmpeg');
    logger.info('开始剪辑视频:', { inputPath, outputPath, segments: segments.length });
    try {
      const result = await this.doCut(inputPath, outputPath, segments, options);
      logger.info('视频剪辑完成:', { outputPath });
      return result;
    } catch (error) {
      logger.error('视频剪辑失败:', { error });
      throw normalizeVideoError(error, '剪辑');
    }
  }

  async preview(inputPath: string, segment: VideoSegment) {
    if (!inputPath?.trim()) throw new VideoProcessingError('生成预览', '视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new VideoProcessingError('生成预览', '未安装FFmpeg');
    logger.debug('预览片段:', { segment });
    try {
      const previewPath = await this.doPreview(inputPath, segment);
      logger.debug('预览文件路径:', { previewPath });
      return previewPath;
    } catch (error) {
      logger.error('生成预览失败:', { error });
      throw normalizeVideoError(error, '生成预览');
    }
  }

  // ---------- Abstract Methods (platform-specific) ----------

  /** 平台特定：执行 FFmpeg 状态检查 */
  protected abstract doCheckStatus(): Promise<FFmpegStatus>;

  /** 平台特定：获取硬件加速类型 */
  protected abstract doGetHardwareAcceleration(): Promise<string | null>;

  /** 平台特定：分析视频 */
  protected abstract doAnalyze(videoPath: string): Promise<VideoMetadata>;

  /** 平台特定：提取关键帧 */
  protected abstract doExtractKeyFrames(videoPath: string, options: ExtractKeyFramesOptions, duration?: number): Promise<KeyFrame[]>;

  /** 平台特定：生成缩略图 */
  protected abstract doGenerateThumbnail(videoPath: string, time: number): Promise<string>;

  /** 平台特定：剪辑 */
  protected abstract doCut(inputPath: string, outputPath: string, segments: VideoSegment[], options: CutOptions): Promise<string>;

  /** 平台特定：预览 */
  protected abstract doPreview(inputPath: string, segment: VideoSegment): Promise<string>;
}
