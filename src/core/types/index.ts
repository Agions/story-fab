/**
 * 核心类型定义
 */

// AI 模型类型
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'baidu' | 'alibaba' | 'zhipu' | 'iflytek' | 'tencent';
export type ModelCategory = 'text' | 'code' | 'image' | 'video' | 'all';

// AI 模型
export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  category: ModelCategory[];
  description: string;
  features: string[];
  tokenLimit: number;
  contextWindow: number;
  isPro?: boolean;
  isAvailable?: boolean;
  apiConfigured?: boolean;
  recommended?: boolean;
  pricing?: {
    input: number;
    output: number;
    unit: string;
  };
}

// AI 模型设置
export interface AIModelSettings {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// 模型配置状态
export interface ModelConfigState {
  selectedModel: string;
  models: Record<string, AIModelSettings>;
  isLoading: boolean;
  error: string | null;
}

// 视频信息
export interface VideoInfo {
  id: string;
  path: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  size: number;
  thumbnail?: string;
  createdAt: string;
}

// 场景
export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  thumbnail: string;
  description?: string;
  tags: string[];
  type?: string;
  confidence?: number;
  features?: any;
  objectCount?: number;
  dominantEmotion?: string;
}

// 关键帧
export interface Keyframe {
  id: string;
  timestamp: number;
  thumbnail: string;
  description?: string;
}

// 物体检测
export interface ObjectDetection {
  id: string;
  sceneId: string;
  category: string;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

// 情感分析
export interface EmotionAnalysis {
  id: string;
  sceneId: string;
  timestamp: number;
  emotions: Array<{
    id: string;
    name: string;
    score: number;
  }>;
  dominant: string;
  intensity: number;
}

// 视频分析结果
export interface VideoAnalysis {
  id: string;
  videoId: string;
  scenes: Scene[];
  keyframes: Keyframe[];
  objects: ObjectDetection[];
  emotions: EmotionAnalysis[];
  summary: string;
  stats?: {
    sceneCount: number;
    objectCount: number;
    avgSceneDuration: number;
    sceneTypes: Record<string, number>;
    objectCategories: Record<string, number>;
    dominantEmotions: Record<string, number>;
  };
  createdAt: string;
}

// 脚本片段
export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  type: 'narration' | 'dialogue' | 'action' | 'transition';
  notes?: string;
}

// 脚本元数据
export interface ScriptMetadata {
  style: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  targetAudience: string;
  language: string;
  wordCount: number;
  estimatedDuration: number;
  generatedBy: string;
  generatedAt: string;
  template?: string;
  templateName?: string;
}

// 脚本数据
export interface ScriptData {
  id: string;
  title: string;
  content: string;
  segments: ScriptSegment[];
  metadata: ScriptMetadata;
  createdAt: string;
  updatedAt: string;
}

// 项目数据
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'completed' | 'archived';
  videos: VideoInfo[];
  scripts: ScriptData[];
  analysis?: VideoAnalysis;
  settings?: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

// 项目设置
export interface ProjectSettings {
  videoQuality: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat: 'mp4' | 'mov' | 'webm' | 'mkv';
  resolution: '720p' | '1080p' | '2k' | '4k';
  frameRate: 24 | 30 | 60;
  audioCodec: 'aac' | 'mp3' | 'flac';
  videoCodec: 'h264' | 'h265' | 'vp9';
  subtitleEnabled: boolean;
  subtitleStyle: SubtitleStyle;
}

// 字幕样式
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: 'top' | 'middle' | 'bottom';
  alignment: 'left' | 'center' | 'right';
}

// 导出设置
export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'mkv';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '2k' | '4k';
  frameRate: 24 | 30 | 60;
  includeSubtitles: boolean;
  burnSubtitles: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
}

// 导出记录
export interface ExportRecord {
  id: string;
  projectId: string;
  format: string;
  quality: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
}

// 脚本模板
export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  structure: Array<{
    type: 'intro' | 'hook' | 'body' | 'transition' | 'conclusion' | 'cta';
    name: string;
    duration: number;
    description: string;
  }>;
  style: {
    tone: string;
    pace: 'slow' | 'medium' | 'fast';
    formality: 'casual' | 'neutral' | 'formal';
  };
  examples: string[];
  recommended?: boolean;
}

// 用户偏好
export interface UserPreferences {
  autoSave: boolean;
  autoSaveInterval: number;
  defaultVideoQuality: 'low' | 'medium' | 'high' | 'ultra';
  defaultOutputFormat: 'mp4' | 'mov' | 'webm';
  enablePreview: boolean;
  previewQuality: 'low' | 'medium' | 'high';
  notifications: boolean;
  soundEffects: boolean;
}

// API 响应
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp: string;
  };
}

// 任务状态
export interface TaskStatus {
  id: string;
  type: 'analysis' | 'script' | 'render' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// 工作流步骤
export type WorkflowStep =
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

// 工作流数据
export interface WorkflowData {
  videoInfo?: VideoInfo;
  videoAnalysis?: VideoAnalysis;
  selectedTemplate?: ScriptTemplate;
  generatedScript?: ScriptData;
  dedupedScript?: ScriptData;
  uniqueScript?: ScriptData;
  editedScript?: ScriptData;
  timeline?: any;
  originalityReport?: {
    score: number;
    duplicates: Array<{
      id: string;
      type: 'exact' | 'similar' | 'template';
      target: { content: string };
      suggestion: string;
    }>;
    suggestions: string[];
  };
  uniquenessReport?: {
    check: {
      isUnique: boolean;
      similarity: number;
      suggestions: string[];
    };
    history: {
      totalScripts: number;
      recentScripts: number;
    };
  };
}

// 工作流状态
export interface WorkflowState {
  step: WorkflowStep;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  data: WorkflowData;
  error?: string;
}

// 工作流配置
export interface WorkflowConfig {
  autoAnalyze?: boolean;
  autoGenerateScript?: boolean;
  preferredTemplate?: string;
  model?: AIModel;
  scriptParams?: {
    style: string;
    tone: string;
    length: 'short' | 'medium' | 'long';
    targetAudience: string;
    language: string;
  };
  aiClipConfig?: {
    enabled: boolean;
    autoClip?: boolean;
    detectSceneChange?: boolean;
    detectSilence?: boolean;
    removeSilence?: boolean;
    targetDuration?: number;
    pacingStyle?: 'fast' | 'normal' | 'slow';
  };
}

// 工作流回调
export interface WorkflowCallbacks {
  onStepChange?: (step: WorkflowStep, prevStep?: WorkflowStep) => void;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: WorkflowState['status']) => void;
  onError?: (error: string) => void;
  onComplete?: (result: any) => void;
}
