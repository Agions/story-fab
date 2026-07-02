/**
 * 媒体相关类型定义
 * 合并自 core/types.ts + core/video/types.ts + core/video/highlight.types.ts
 */

// ─── 视频资产 ───

export interface VideoAsset {
  id: string;
  name: string;
  path: string;
  url?: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface VideoInfo {
  id: string;
  name: string;
  path: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  fps: number;
  format: string;
  thumbnail?: string;
  createdAt?: string;
  url?: string;
}

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

/** Raw output of the `analyze_video` Tauri command (Rust VideoMetadataResult). */
export interface VideoMetadataResult {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

// ─── 视频分段 ───

export interface VideoSegment {
  id: string;
  sourceIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  scenes?: Scene[];
  audioPeaks?: AudioPeak[];
}

/** 简单视频分段（视频编辑器使用，start/end 字段） */
export interface SimpleVideoSegment {
  start: number;
  end: number;
  duration?: number;
  type?: string;
  content?: string;
}

// ─── 场景 ───

export type SceneType =
  | 'action' | 'dialog' | 'landscape' | 'closeup'
  | 'intro' | 'outro' | 'emotion' | 'product'
  | 'demo' | 'interview' | 'text';

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  type: SceneType;
  score: number;
  thumbnail?: string;
  description?: string;
  tags?: string[];
  confidence?: number;
  features?: string[];
  motionScore?: number;
  dominantEmotion?: string;
  duration?: number;
}

// ─── 音频 ───

export interface AudioPeak {
  id: string;
  timestamp: number;
  duration: number;
  score: number;
  type: 'applause' | 'laughter' | 'music' | 'speech';
}

// ─── 关键帧 ───

export interface KeyFrame {
  id: string;
  timestamp: number;
  path: string;
  description?: string;
}

// ─── 高光检测 ───

export interface HighlightSegment {
  /** 秒 */
  startTime: number;
  /** 秒 */
  endTime: number;
  score: number;
  reason: string;
  audioScore?: number;
  sceneScore?: number;
  motionScore?: number;
}

export interface HighlightOptions {
  threshold?: number;
  minDurationMs?: number;
  topN?: number;
  windowMs?: number;
  detectScene?: boolean;
  sceneThreshold?: number;
}

export interface DetectHighlightsInput {
  videoPath: string;
  threshold?: number;
  minDurationMs?: number;
  topN?: number;
  windowMs?: number;
  detectScene?: boolean;
  sceneThreshold?: number;
}

// ─── 智能分段 ───

export type SegmentType = 'dialogue' | 'action' | 'transition' | 'silence' | 'content';

export interface SmartVideoSegment {
  startMs: number;
  endMs: number;
  segmentType: string;
  durationMs: number;
  confidence: number;
  isSceneChange?: boolean;
  peakEnergy?: number;
  silenceRatio?: number;
  suggestedSpeed?: number;
  suggestedTransition?: {
    type: 'none' | 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'glitch';
    duration: number;
    reason: string;
    confidence: number;
  };
}

export interface SegmentOptions {
  minDurationMs?: number;
  maxDurationMs?: number;
  sceneThreshold?: number;
  silenceThresholdDb?: number;
  detectDialogue?: boolean;
  detectTransitions?: boolean;
}

export interface DetectSmartSegmentsInput {
  videoPath: string;
  minDurationMs?: number;
  maxDurationMs?: number;
  sceneThreshold?: number;
  silenceThresholdDb?: number;
  detectDialogue?: boolean;
  detectTransitions?: boolean;
}

// ─── 处理进度 ───

export interface ProcessingProgress {
  stage: string;
  progress: number;
  currentItem?: string;
  itemsTotal?: number;
  itemsCompleted?: number;
  timeRemainingSecs?: number;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

// ─── FFmpeg ───

export interface FFmpegStatus {
  installed: boolean;
  version?: string;
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

export interface ExtractKeyFramesOptions {
  maxFrames?: number;
  interval?: number;
  sceneDetection?: boolean;
  sceneThreshold?: number;
  quality?: number;
}

export interface CutOptions {
  transcode?: TranscodeOptions;
  includeAudio?: boolean;
  onProgress?: ProgressCallback;
}

// ─── 字幕 ───

export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language?: string;
  confidence?: number;
  quality?: 'high' | 'medium' | 'low';
}

export interface Subtitle {
  id: string;
  entries: SubtitleEntry[];
  language?: string;
}
