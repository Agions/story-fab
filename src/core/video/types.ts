/**
 * Video Processing Types
 * 视频处理管道核心类型定义
 */

// ============================================
// Metadata
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

// ============================================
// Segments & Frames
// ============================================

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

// ============================================
// Progress
// ============================================

export interface ProcessingProgress {
  stage: string;
  progress: number;
  currentItem?: string;
  itemsTotal?: number;
  itemsCompleted?: number;
  timeRemainingSecs?: number;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

// ============================================
// Options
// ============================================

export interface ExtractKeyFramesOptions {
  maxFrames?: number;
  interval?: number;
  sceneDetection?: boolean;
  sceneThreshold?: number;
  quality?: number;
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

export interface CutOptions {
  transcode?: TranscodeOptions;
  includeAudio?: boolean;
  onProgress?: ProgressCallback;
}

// ============================================
// FFmpeg Status
// ============================================

export interface FFmpegStatus {
  installed: boolean;
  version?: string;
}
