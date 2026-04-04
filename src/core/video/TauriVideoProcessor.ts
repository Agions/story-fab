/**
 * TauriVideoProcessor - 基于 Tauri invoke 的视频处理实现
 */
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { IVideoProcessor } from './IVideoProcessor';
import type {
  VideoMetadata,
  KeyFrame,
  VideoSegment,
  ExtractKeyFramesOptions,
  CutOptions,
  FFmpegStatus,
  ProcessingProgress,
} from './types';

// ============================================
// FFmpeg 状态缓存
// ============================================

let ffmpegCheckCache: { installed: boolean; version?: string; timestamp: number } | null = null;
const FFmpeg_CHECK_CACHE_TTL = 30000;

// ============================================
// 错误归一化
// ============================================

function parseVideoError(error: unknown, operation: string): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('未安装FFmpeg') || message.includes('ffmpeg')) {
    return new Error(`${operation}失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。`);
  }
  if (message.includes('ffprobe')) {
    return new Error(`${operation}失败：无法执行 ffprobe 命令，请检查 FFmpeg 是否完整安装。`);
  }
  if (message.includes('解析JSON') || message.includes('parse')) {
    return new Error(`${operation}失败：无法解析视频元数据。`);
  }
  if (message.includes('未找到视频流') || message.includes('video stream')) {
    return new Error(`${operation}失败：无法识别视频流信息。`);
  }
  if (message.includes('路径不能为空')) {
    return new Error(`错误：视频路径无效。`);
  }
  if (message.includes('权限') || message.includes('permission')) {
    return new Error(`${operation}失败：文件权限不足，请检查文件访问权限。`);
  }
  if (message.includes('空间不足') || message.includes('no space')) {
    return new Error(`${operation}失败：磁盘空间不足。`);
  }
  return new Error(`${operation}失败：${message}`);
}

// ============================================
// 实现
// ============================================

export class TauriVideoProcessor implements IVideoProcessor {

  // ---------- FFmpeg ----------

  async checkStatus(): Promise<FFmpegStatus> {
    if (ffmpegCheckCache && Date.now() - ffmpegCheckCache.timestamp < FFmpeg_CHECK_CACHE_TTL) {
      return { installed: ffmpegCheckCache.installed, version: ffmpegCheckCache.version };
    }
    try {
      const result = await invoke<[boolean, string | null]>('check_ffmpeg');
      ffmpegCheckCache = { installed: result[0], version: result[1] || undefined, timestamp: Date.now() };
      return { installed: result[0], version: result[1] || undefined };
    } catch {
      return { installed: false };
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
      return await invoke<string | null>('get_hw_acceleration');
    } catch {
      return null;
    }
  }

  // ---------- Analysis ----------

  async analyze(videoPath: string): Promise<VideoMetadata> {
    if (!videoPath?.trim()) throw new Error('视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new Error('未安装FFmpeg');
    logger.info('分析视频:', { videoPath });
    try {
      const metadata = await invoke<VideoMetadata>('analyze_video', { path: videoPath });
      logger.debug('视频分析结果:', { metadata });
      return metadata;
    } catch (error) {
      logger.error('分析视频失败:', { error });
      throw parseVideoError(error, '分析');
    }
  }

  // ---------- Extraction ----------

  async extractKeyFrames(videoPath: string, options: ExtractKeyFramesOptions = {}): Promise<KeyFrame[]> {
    if (!videoPath?.trim()) throw new Error('视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new Error('未安装FFmpeg');

    const { maxFrames = 10, sceneDetection = true, sceneThreshold = 0.3 } = options;
    logger.info('提取关键帧:', { videoPath, maxFrames, sceneDetection, sceneThreshold });

    try {
      const framePaths = await invoke<string[]>('extract_key_frames', {
        path: videoPath,
        count: maxFrames,
        threshold: sceneThreshold,
      });
      const metadata = await this.analyze(videoPath);
      const interval = metadata.duration / (framePaths.length || maxFrames);
      const keyFrames: KeyFrame[] = framePaths.map((path, index) => ({
        id: uuidv4(),
        timestamp: index * interval,
        path,
        description: '',
      }));
      logger.info('成功提取关键帧:', { count: keyFrames.length });
      return keyFrames;
    } catch (error) {
      logger.error('提取关键帧失败:', { error });
      throw parseVideoError(error, '提取关键帧');
    }
  }

  async generateThumbnail(videoPath: string, time: number = 1): Promise<string> {
    if (!videoPath?.trim()) throw new Error('视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new Error('未安装FFmpeg');
    logger.info('生成视频缩略图:', { videoPath, time });
    try {
      const thumbnailPath = await invoke<string>('generate_thumbnail', { path: videoPath, time });
      logger.debug('缩略图生成成功:', { thumbnailPath });
      return thumbnailPath;
    } catch (error) {
      logger.error('生成缩略图失败:', { error });
      throw parseVideoError(error, '生成缩略图');
    }
  }

  // ---------- Editing ----------

  async cut(inputPath: string, outputPath: string, segments: VideoSegment[], options: CutOptions = {}): Promise<string> {
    if (!inputPath?.trim() || !outputPath?.trim()) throw new Error('输入或输出路径不能为空');
    if (!segments?.length) throw new Error('至少需要一个视频片段');
    if (!(await this.ensureAvailable())) throw new Error('未安装FFmpeg');
    logger.info('开始剪辑视频:', { inputPath, outputPath, segments: segments.length });

    let unlisten: UnlistenFn | null = null;
    if (options.onProgress) {
      unlisten = await listen<ProcessingProgress>('processing-progress', (event) => {
        options.onProgress?.(event.payload);
      });
    }

    try {
      const result = await invoke<string>('cut_video', {
        inputPath,
        outputPath,
        segments: segments.map(s => ({ start: s.start, end: s.end })),
        useHwAccel: options.transcode?.hwAccel ?? false,
      });
      logger.info('视频剪辑完成:', { outputPath });
      return result;
    } catch (error) {
      logger.error('视频剪辑失败:', { error });
      throw parseVideoError(error, '剪辑');
    } finally {
      unlisten?.();
    }
  }

  async preview(inputPath: string, segment: VideoSegment): Promise<string> {
    if (!inputPath?.trim()) throw new Error('视频路径不能为空');
    if (!(await this.ensureAvailable())) throw new Error('未安装FFmpeg');
    logger.debug('预览片段:', { segment });
    try {
      const previewPath = await invoke<string>('generate_preview', {
        inputPath,
        segmentStart: segment.start,
        segmentEnd: segment.end,
      });
      logger.debug('预览文件路径:', { previewPath });
      return previewPath;
    } catch (error) {
      logger.error('生成预览失败:', { error });
      throw parseVideoError(error, '生成预览');
    }
  }
}

// 单例
export const videoProcessor = new TauriVideoProcessor();
