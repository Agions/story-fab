/**
 * StoryForge 核心类型定义
 * 集中管理项目通用类型
 */
import type { ReactNode } from 'react';

// ==================== 项目相关类型 ====================

export interface Project {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number;
  size: number;
  status: ProjectStatus;
  tags: string[];
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface ProjectSettings {
  autoSave?: boolean;
  compactMode?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  projectSaveBehavior?: 'stay' | 'detail';
  videoQuality?: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat?: 'mp4' | 'webm' | 'gif';
  resolution?: '720p' | '1080p' | '4k';
  frameRate?: 24 | 30 | 60;
  audioCodec?: string;
  videoCodec?: string;
  subtitleEnabled?: boolean;
  subtitleStyle?: {
    fontFamily: string;
    fontSize: number;
    color: string;
    backgroundColor: string;
    outline: boolean;
    outlineColor: string;
    position: string;
    alignment: string;
  };
  includeWatermark?: boolean;
}

// ==================== 视频相关类型 ====================

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

export interface VideoSegment {
  id: string;
  sourceIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  scenes?: Scene[];
  audioPeaks?: AudioPeak[];
}

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  type: 'action' | 'dialog' | 'landscape' | 'closeup';
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

export interface AudioPeak {
  id: string;
  timestamp: number;
  duration: number;
  score: number;
  type: 'applause' | 'laughter' | 'music' | 'speech';
}

// ==================== 脚本相关类型 ====================

export interface Script {
  id: string;
  segments: ScriptSegment[];
  totalDuration?: number;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content?: string;
  text?: string;
  voice?: string;
  /** 脚本片段类型：narration-旁白, dialogue-对话, description-描述 */
  type?: 'narration' | 'dialogue' | 'description' | string;
}

export interface ScriptMetadata {
  title?: string;
  author?: string;
  tone?: string;
  length?: string;
  estimatedDuration?: number;
  targetAudience?: string;
  language?: string;
  wordCount?: number;
  generatedBy?: string;
  generatedAt?: string;
  template?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  content: string;
  duration?: number;
  wordCount?: number;
}

// ==================== 音频相关类型 ====================

export interface Voice {
  id: string;
  name: string;
  provider: string;
  model?: string;
  settings?: VoiceSettings;
}

export interface VoiceSettings {
  speed?: number;
  pitch?: number;
  volume?: number;
}

// ==================== 字幕相关类型 ====================

export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language?: string;
  confidence?: number;
}

export interface Subtitle {
  id: string;
  entries: SubtitleEntry[];
  language?: string;
}

// ==================== 编辑器相关类型 ====================

export interface EditorTimeline {
  duration: number;
  currentTime: number;
  zoom: number;
  tracks: Track[];
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  segments: TrackSegment[];
  muted?: boolean;
  locked?: boolean;
}

export interface TrackSegment {
  id: string;
  startTime: number;
  endTime: number;
  assetId: string;
  effects?: Effect[];
}

export interface Effect {
  id: string;
  type: string;
  params: Record<string, unknown>;
}

export type EditorPanel = 'video' | 'script' | 'subtitle' | 'voice' | 'effect';

// ==================== AI 相关类型 ====================

export type AIFeatureType = 'video-narration' | 'first-person' | 'remix' | 'smart-clip';

// ==================== AI 相关类型 ====================

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

export interface AIModel {
  id: string;
  name: string;
  provider?: ModelProvider;
  model?: string;
  maxTokens?: number;
  contextWindow?: number;
  enabled?: boolean;
  category?: string | string[];
  description?: string;
  features?: string[];
  tokenLimit?: number;
  isPro?: boolean;
  isAvailable?: boolean;
  pricing?: {
    input: number;
    output: number;
    currency?: string;
    unit?: string;
  };
  recommended?: boolean;
}

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'azure' | 'local' | 'custom' | 'alibaba' | 'iflytek' | 'zhipu' | 'moonshot' | 'deepseek';

export type ModelCategory = 'video' | 'audio' | 'image' | 'text' | 'all';

export interface AnalysisResult {
  scenes: Scene[];
  keyframes: Keyframe[];
  objects: DetectedObject[];
  emotions: EmotionData[];
  stats: AnalysisStats;
}

export interface Keyframe {
  id: string;
  timestamp: number;
  imageUrl?: string;
  description?: string;
}

export interface DetectedObject {
  id?: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface EmotionData {
  timestamp: number;
  emotion: string;
  intensity: number;
}

export interface Emotion {
  timestamp: number;
  type: string;
  intensity: number;
}

export interface KeyMoment {
  id: string;
  timestamp: number;
  time?: number;
  type?: string;
  description: string;
  importance: number;
}

export interface AnalysisStats {
  totalDuration?: number;
  sceneCount: number;
  keyframeCount: number;
  objectCount: number;
}

// ==================== 工作流相关类型 ====================

export interface WorkflowState {
  id: string;
  status: WorkflowStatus;
  progress: number;
  currentStep: string;
  steps: WorkflowStep[];
  result?: WorkflowResult;
}

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'error' | 'paused';

// 工作流步骤类型 (union type)
export type WorkflowStepType = 
  | 'upload'
  | 'analyze'
  | 'template-select'
  | 'script-generate'
  | 'script-dedup'
  | 'script-edit'
  | 'ai-clip'
  | 'timeline-edit'
  | 'preview'
  | 'export';

// 工作流步骤实例
export interface WorkflowStepInstance {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  duration?: number;
}

// 兼容旧名称
export type WorkflowStep = WorkflowStepType;

export interface WorkflowResult {
  videoId: string;
  videoPath: string;
  duration: number;
  clips: VideoSegment[];
  script?: Script;
  subtitles?: Subtitle;
}

// ==================== 用户相关类型 ====================

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: 'admin' | 'user';
}

// ==================== 通用类型 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface ModalProps {
  open: boolean;
  title?: string;
  content?: ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  width?: number | string;
  footer?: ReactNode;
}

// ==================== 项目数据相关类型 ====================

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  templateName?: string;
  scripts?: Script[];
  videoAssets?: VideoAsset[];
  videos?: VideoInfo[];
  timeline?: EditorTimeline;
  settings?: ProjectSettings;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptData {
  id: string;
  title: string;
  content: string;
  duration?: number;
  segments: ScriptSegment[];
  metadata?: ScriptMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptMetadata {
  title?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  wordCount?: number;
  style?: string;
}

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  includeSubtitles: boolean;
  includeWatermark: boolean;
  frameRate?: number;
  burnSubtitles?: boolean;
}

export interface AIModelSettings {
  provider?: ModelProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
}

// ==================== AI 分析相关类型 ====================

export interface AIAnalysisResult {
  scenes: Scene[];
  subtitles: SubtitleEntry[];
  summary: string;
  tags: string[];
  mood?: string;
}

export interface VideoAnalysis {
  id: string;
  videoId: string;
  title?: string;
  duration?: number;
  transcript?: string;
  scenes?: Scene[];
  keyframes?: Keyframe[];
  objects?: DetectedObject[];
  keyMoments?: KeyMoment[];
  ocrText?: string;
  asrText?: string;
  emotions?: string[] | Emotion[];
  summary?: string;
  createdAt?: string;
  stats?: {
    sceneCount: number;
    objectCount: number;
    avgSceneDuration: number;
    sceneTypes: Record<string, number>;
    objectCategories: Record<string, number>;
    dominantEmotions: Record<string, number>;
  };
}

export interface AIAnalyzeProps {
  videoUrl?: string;
  onAnalyzeComplete?: (result: AIAnalysisResult) => void;
  onNext?: () => void;
}

// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 用户偏好设置
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  autoSave?: boolean;
  notifications?: boolean;
  [key: string]: unknown;
}

// 导出记录
export interface ExportRecord {
  id: string;
  projectId: string;
  format: string;
  quality: string;
  resolution: string;
  fileSize?: number;
  filePath?: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

// 情感分析结果
export interface EmotionAnalysis {
  id?: string;
  timestamp: number;
  emotion?: string;
  confidence?: number;
  emotions?: Array<{ id: string; name: string; score: number }>;
  dominant?: string;
  intensity?: number;
  category?: string | string[];
  sceneId?: string;
}

// 对象检测结果
export interface ObjectDetection {
  id?: string;
  sceneId?: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  category?: string | string[];
}
