/**
 * Core Interfaces — 核心接口层
 * 
 * 原则：
 * - 接口定义在 interfaces/，实现放在具体 service
 * - 所有 service 只依赖接口，不依赖其他 service
 * - Store 位于架构顶层，不被 service 层引用
 */

// ============================================================
// 视频相关接口
// ============================================================

export interface IVideoProcessor {
  getInfo(path: string): Promise<VideoInfo>;
  extractFrames(path: string, interval: number): Promise<string[]>;
  trim(path: string, start: number, end: number, output: string): Promise<string>;
  concat(paths: string[], output: string): Promise<string>;
  export(path: string, options: ExportOptions): Promise<string>;
}

export interface VideoInfo {
  path: string;
  duration: number;       // 秒
  width: number;
  height: number;
  size: number;           // bytes
  format: string;
  fps?: number;
  bitrate?: number;
  hasAudio: boolean;
  hasSubtitle?: boolean;
}

export interface ExportOptions {
  format: 'mp4' | 'webm' | 'gif';
  quality?: 'low' | 'medium' | 'high';
  resolution?: '720p' | '1080p' | '4k';
  fps?: number;
  crf?: number;
  outputPath?: string;
}

// ============================================================
// 场景/高光检测接口
// ============================================================

export interface IHighlightDetector {
  detect(
    videoPath: string,
    options?: DetectOptions,
  ): Promise<HighlightSegment[]>;
}

export interface HighlightSegment {
  /** 秒 */
  startTime: number;
  /** 秒 */
  endTime: number;
  score: number;
  reason: HighlightReason;
  audioScore?: number;
  sceneScore?: number;
  motionScore?: number;
}

export type HighlightReason = 'audio_energy' | 'scene_change' | 'motion_burst' | 'combined';

export interface DetectOptions {
  threshold?: number;
  /** 最短高光时长（毫秒） */
  minDurationMs?: number;
  topN?: number;
  windowMs?: number;
  detectScene?: boolean;
  sceneThreshold?: number;
}

// ============================================================
// 字幕接口
// ============================================================

export interface ISubtitleService {
  extract(videoPath: string, lang?: string): Promise<SubtitleTrack>;
  burnIn(
    videoPath: string,
    subtitleTrack: SubtitleTrack,
    outputPath: string,
  ): Promise<string>;
  parse(srtContent: string): Promise<SubtitleTrack>;
  generate(srtContent: string): Promise<string>; // SRT → VTT
}

export interface SubtitleTrack {
  format: 'srt' | 'vtt' | 'ass';
  language?: string;
  cues: SubtitleCue[];
}

export interface SubtitleCue {
  id: string;
  startTime: number;   // 秒
  endTime: number;     // 秒
  text: string;
  styles?: {
    position?: 'top' | 'bottom';
    alignment?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
  };
}

// ============================================================
// 场景分析接口
// ============================================================

export interface ISceneAnalyzer {
  detectScenes(videoPath: string, options?: SceneDetectOptions): Promise<Scene[]>;
  extractKeyframes(videoPath: string, count: number): Promise<string[]>;
}

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  type: 'intro' | 'action' | 'dialog' | 'landscape' | 'product' | 'outro';
  score: number;
  thumbnail?: string;
  tags?: string[];
  features?: SceneFeatures;
}

export interface SceneFeatures {
  brightness: number;
  motion: number;
  complexity: number;
  dominantColors: string[];
  hasText: boolean;
  hasFaces: boolean;
}

export interface SceneDetectOptions {
  minDuration?: number;      // 秒
  threshold?: number;         // 0-1
  detectObjects?: boolean;
  detectEmotions?: boolean;
}

// ============================================================
// 剪辑接口
// ============================================================

export interface IClipService {
  generateCutPoints(videoInfo: VideoInfo, config: ClipConfig): Promise<CutPoint[]>;
  suggestClips(
    videoInfo: VideoInfo,
    config: ClipConfig,
  ): Promise<ClipSuggestion[]>;
}

export interface CutPoint {
  id: string;
  timestamp: number;
  type: CutPointType;
  confidence: number;
  description: string;
  suggestedAction?: 'keep' | 'remove' | 'trim' | 'transition';
}

export type CutPointType = 'scene' | 'silence' | 'keyframe' | 'emotion' | 'manual' | 'ai_suggested';

export interface ClipSuggestion {
  id: string;
  startTime: number;
  endTime: number;
  type: 'trim' | 'cut' | 'merge';
  description: string;
  reason: string;
  confidence: number;
  autoApplicable: boolean;
  thumbnail?: string;
}

export interface ClipConfig {
  detectSceneChange: boolean;
  detectSilence: boolean;
  detectKeyframes: boolean;
  detectEmotion: boolean;
  sceneThreshold: number;
  silenceThreshold: number;
  minSilenceDuration: number;
  keyframeInterval: number;
  removeSilence: boolean;
  trimDeadTime: boolean;
  aiOptimize: boolean;
  pacingStyle: 'fast' | 'normal' | 'slow';
}

// ============================================================
// AI 服务接口
// ============================================================

export interface IAIService {
  analyzeVideo(videoPath: string): Promise<AIAnalysisResult>;
  generateScript(context: ScriptContext): Promise<Script>;
  suggestTags(videoPath: string): Promise<string[]>;
}

export interface AIAnalysisResult {
  scenes: Scene[];
  highlights: HighlightSegment[];
  emotions: EmotionAnalysis;
  keyframes: string[];
  transcript?: string;
}

export interface EmotionAnalysis {
  overall: string;
  segments: Array<{
    start: number;
    end: number;
    emotion: string;
    intensity: number;
  }>;
}

export interface ScriptContext {
  videoInfo: VideoInfo;
  scenes: Scene[];
  highlights: HighlightSegment[];
  targetDuration?: number;
  tone?: string;
  audience?: string;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  segments: ScriptSegment[];
  metadata: ScriptMetadata;
}

export interface ScriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  narration?: string;
  visual?: string;
}

export interface ScriptMetadata {
  tone?: string;
  audience?: string;
  duration?: number;
  platform?: string;
}

// ============================================================
// 导出接口
// ============================================================

export interface IExportService {
  export(
    videoInfo: VideoInfo,
    clips: ExportClip[],
    options: ExportOptions,
  ): Promise<ExportResult>;
  burnSubtitle(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
  ): Promise<string>;
}

export interface ExportClip {
  path: string;
  startTime: number;
  endTime: number;
  transition?: TransitionType;
}

export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'slide';

export interface ExportResult {
  path: string;
  format: string;
  size: number;
  duration: number;
}

// ============================================================
// Tauri 命令接口（Rust → TS 类型映射）
// ============================================================

export interface RustHighlightOptions {
  threshold: number;
  min_duration_ms: number;
  top_n: number;
  window_ms: number;
  detect_scene: boolean;
  scene_threshold: number;
}

export interface RustHighlightSegment {
  start_ms: number;
  end_ms: number;
  score: number;
  reason: string;
  audio_score?: number;
  scene_score?: number;
  motion_score?: number;
}
