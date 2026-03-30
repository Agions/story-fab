import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';

// ============================================
// Types
// ============================================

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  fileSize?: number;
  audioChannels?: number;
  audioSampleRate?: number;
}

export interface KeyFrame {
  id: string;
  timestamp: number;
  path: string;
  description?: string;
}

export interface VideoSegment {
  start: number;
  end: number;
  duration?: number;
}

export interface ProcessingProgress {
  stage: string;
  progress: number;
  currentItem?: string;
  itemsTotal?: number;
  itemsCompleted?: number;
  timeRemainingSecs?: number;
}

export interface TranscodeOptions {
  codec?: 'libx264' | 'libx265' | 'h264_nvenc' | 'h264_qsv' | 'vp9' | 'av1';
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  speed?: 'ultrafast' | 'fast' | 'medium' | 'slow';
  bitrate?: string;
  crf?: number;
  audioCodec?: 'aac' | 'libopus' | 'mp3';
  audioBitrate?: string;
  format?: 'mp4' | 'mkv' | 'webm';
  hwAccel?: boolean;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

// ============================================
// FFmpeg Status
// ============================================

let ffmpegCheckCache: { installed: boolean; version?: string; timestamp: number } | null = null;
const FFmpeg_CHECK_CACHE_TTL = 30000; // 30 seconds

export const checkFFmpegInstallation = async (): Promise<{installed: boolean; version?: string}> => {
  // Use cache to avoid repeated calls
  if (ffmpegCheckCache && Date.now() - ffmpegCheckCache.timestamp < FFmpeg_CHECK_CACHE_TTL) {
    return { installed: ffmpegCheckCache.installed, version: ffmpegCheckCache.version };
  }

  try {
    const result = await invoke<[boolean, string | null]>('check_ffmpeg');
    ffmpegCheckCache = {
      installed: result[0],
      version: result[1] || undefined,
      timestamp: Date.now()
    };
    return { installed: result[0], version: result[1] || undefined };
  } catch (error) {
    logger.error('检查FFmpeg安装状态失败:', { error });
    return { installed: false };
  }
};

export const ensureFFmpegInstalled = async (): Promise<boolean> => {
  const { installed, version } = await checkFFmpegInstallation();
  if (!installed) {
    logger.warn('FFmpeg未安装');
    return false;
  }
  logger.info('FFmpeg已安装:', { version });
  return true;
};

export const getHardwareAcceleration = async (): Promise<string | null> => {
  try {
    return await invoke<string | null>('get_hw_acceleration');
  } catch {
    return null;
  }
};

// ============================================
// Video Analysis
// ============================================

export const analyzeVideo = async (videoPath: string): Promise<VideoMetadata> => {
  if (!videoPath?.trim()) {
    throw new Error('视频路径不能为空');
  }

  if (!(await ensureFFmpegInstalled())) {
    throw new Error('未安装FFmpeg');
  }

  logger.info('分析视频:', { videoPath });

  try {
    const metadata = await invoke<VideoMetadata>('analyze_video', { path: videoPath });
    logger.debug('视频分析结果:', { metadata });
    return metadata;
  } catch (error) {
    logger.error('分析视频失败:', { error });
    throw parseVideoError(error, '分析');
  }
};

// ============================================
// Key Frame Extraction
// ============================================

export interface ExtractKeyFramesOptions {
  maxFrames?: number;
  interval?: number;
  sceneDetection?: boolean;
  sceneThreshold?: number;
  quality?: number;
}

export const extractKeyFrames = async (
  videoPath: string,
  options: ExtractKeyFramesOptions = {}
): Promise<KeyFrame[]> => {
  if (!videoPath?.trim()) {
    throw new Error('视频路径不能为空');
  }

  if (!(await ensureFFmpegInstalled())) {
    throw new Error('未安装FFmpeg');
  }

  const {
    maxFrames = 10,
    sceneDetection = true,
    sceneThreshold = 0.3
  } = options;

  logger.info('提取关键帧:', { videoPath, maxFrames, sceneDetection, sceneThreshold });

  try {
    const framePaths = await invoke<string[]>('extract_key_frames', {
      path: videoPath,
      count: maxFrames,
      threshold: sceneThreshold
    });

    // Calculate timestamps based on video duration
    const metadata = await analyzeVideo(videoPath);
    const interval = metadata.duration / (framePaths.length || maxFrames);

    const keyFrames: KeyFrame[] = framePaths.map((path, index) => ({
      id: uuidv4(),
      timestamp: index * interval,
      path,
      description: ''
    }));

    logger.info('成功提取关键帧:', { count: keyFrames.length });
    return keyFrames;
  } catch (error) {
    logger.error('提取关键帧失败:', { error });
    throw parseVideoError(error, '提取关键帧');
  }
};

// ============================================
// Thumbnail Generation
// ============================================

export const generateThumbnail = async (
  videoPath: string,
  time: number = 1
): Promise<string> => {
  if (!videoPath?.trim()) {
    throw new Error('视频路径不能为空');
  }

  if (!(await ensureFFmpegInstalled())) {
    throw new Error('未安装FFmpeg');
  }

  logger.info('生成视频缩略图:', { videoPath, time });

  try {
    const thumbnailPath = await invoke<string>('generate_thumbnail', {
      path: videoPath,
      time
    });
    logger.debug('缩略图生成成功:', { thumbnailPath });
    return thumbnailPath;
  } catch (error) {
    logger.error('生成缩略图失败:', { error });
    throw parseVideoError(error, '生成缩略图');
  }
};

// ============================================
// Video Cutting
// ============================================

export interface CutOptions {
  transcode?: TranscodeOptions;
  includeAudio?: boolean;
  onProgress?: ProgressCallback;
}

export const cutVideo = async (
  inputPath: string,
  outputPath: string,
  segments: VideoSegment[],
  options: CutOptions = {}
): Promise<string> => {
  if (!inputPath?.trim() || !outputPath?.trim()) {
    throw new Error('输入或输出路径不能为空');
  }

  if (!segments?.length) {
    throw new Error('至少需要一个视频片段');
  }

  if (!(await ensureFFmpegInstalled())) {
    throw new Error('未安装FFmpeg');
  }

  logger.info('开始剪辑视频:', { inputPath, outputPath, segments: segments.length });

  // Set up progress listener
  let unlisten: UnlistenFn | null = null;
  if (options.onProgress) {
    unlisten = await listen<ProcessingProgress>('processing-progress', (event) => {
      options.onProgress?.(event.payload);
    });
  }

  try {
    // Use optimized cut command
    const result = await invoke<string>('cut_video', {
      inputPath,
      outputPath,
      segments: segments.map(s => ({ start: s.start, end: s.end })),
      useHwAccel: options.transcode?.hwAccel ?? false
    });

    logger.info('视频剪辑完成:', { outputPath });
    return result;
  } catch (error) {
    logger.error('视频剪辑失败:', { error });
    throw parseVideoError(error, '剪辑');
  } finally {
    unlisten?.();
  }
};

// ============================================
// Preview Generation
// ============================================

export const previewSegment = async (
  inputPath: string,
  segment: VideoSegment
): Promise<string> => {
  if (!inputPath?.trim()) {
    throw new Error('视频路径不能为空');
  }

  if (!(await ensureFFmpegInstalled())) {
    throw new Error('未安装FFmpeg');
  }

  logger.debug('预览片段:', { segment });

  try {
    const previewPath = await invoke<string>('generate_preview', {
      inputPath,
      segmentStart: segment.start,
      segmentEnd: segment.end
    });
    logger.debug('预览文件路径:', { previewPath });
    return previewPath;
  } catch (error) {
    logger.error('生成预览失败:', { error });
    throw parseVideoError(error, '生成预览');
  }
};

// ============================================
// Error Parsing
// ============================================

function parseVideoError(error: unknown, operation: string): Error {
  const message = error instanceof Error ? error.message : String(error);

  let userMessage: string;

  if (message.includes('未安装FFmpeg') || message.includes('ffmpeg')) {
    userMessage = `${operation}失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。`;
  } else if (message.includes('ffprobe')) {
    userMessage = `${operation}失败：无法执行 ffprobe 命令，请检查 FFmpeg 是否完整安装。`;
  } else if (message.includes('解析JSON') || message.includes('parse')) {
    userMessage = `${operation}失败：无法解析视频元数据。`;
  } else if (message.includes('未找到视频流') || message.includes('video stream')) {
    userMessage = `${operation}失败：无法识别视频流信息。`;
  } else if (message.includes('路径不能为空')) {
    userMessage = `错误：视频路径无效。`;
  } else if (message.includes('权限') || message.includes('permission')) {
    userMessage = `${operation}失败：文件权限不足，请检查文件访问权限。`;
  } else if (message.includes('空间不足') || message.includes('no space')) {
    userMessage = `${operation}失败：磁盘空间不足。`;
  } else {
    userMessage = `${operation}失败：${message}`;
  }

  return new Error(userMessage);
}

// ============================================
// Formatting Utilities
// ============================================

export const formatDuration = (durationInSeconds: number): string => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatResolution = (width: number, height: number): string => {
  if (width === 3840 && height === 2160) return `${width}x${height} (4K UHD)`;
  if (width === 2560 && height === 1440) return `${width}x${height} (2K QHD)`;
  if (width === 1920 && height === 1080) return `${width}x${height} (1080p)`;
  if (width === 1280 && height === 720) return `${width}x${height} (720p)`;
  if (width === 720 && height === 480) return `${width}x${height} (480p)`;
  return `${width}x${height}`;
};

export const formatBitrate = (bitrate: number): string => {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`;
  }
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} Kbps`;
  }
  return `${bitrate} bps`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1073741824) {
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  }
  if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}; 
