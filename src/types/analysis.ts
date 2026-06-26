/**
 * AI 分析相关类型定义
 * 合并自 core/types.ts + core/types/video-project.ts
 */

// ─── AI 模型 ───

export type ModelProvider =
  | 'openai' | 'anthropic' | 'google' | 'local' | 'custom'
  | 'alibaba' | 'iflytek' | 'zhipu' | 'moonshot' | 'deepseek';

export type ModelCategory = 'video' | 'audio' | 'image' | 'text' | 'all';

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
  apiConfigured?: boolean;
  pricing?: {
    input: number;
    output: number;
    currency?: string;
    unit?: string;
  };
  recommended?: boolean;
}

export interface AIModelConfig {
  key: string;
  name: string;
  provider: string;
  apiKey?: string;
}

export interface AIModelSettings {
  provider?: ModelProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  apiUrl?: string;
  apiVersion?: string;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
}

export type AIModelType = ModelProvider;

// ─── 分析结果 ───

export interface AnalysisStats {
  totalDuration?: number;
  sceneCount: number;
  keyframeCount: number;
  objectCount: number;
}

export interface AnalysisResult {
  scenes: import('./media').Scene[];
  keyframes: Keyframe[];
  objects: ObjectDetection[];
  emotions: EmotionAnalysis[];
  stats: AnalysisStats;
}

export interface Keyframe {
  id: string;
  timestamp: number;
  imageUrl?: string;
  description?: string;
}

export interface Emotion {
  timestamp: number;
  type: string;
  intensity: number;
}

export interface KeyMoment {
  id?: string;
  timestamp: number;
  time?: number;
  type?: string;
  description: string;
  importance: number;
}

export interface VideoAnalysis {
  id: string;
  videoId?: string;
  title?: string;
  duration?: number;
  keyMoments?: KeyMoment[];
  emotions?: string[] | Emotion[];
  summary: string;
  transcript?: string;
  scenes?: import('./media').Scene[];
  keyframes?: Keyframe[];
  objects?: ObjectDetection[];
  ocrText?: string;
  asrText?: string;
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

export interface AIAnalysisResult {
  scenes: import('./media').Scene[];
  subtitles: import('./media').SubtitleEntry[];
  summary: string;
  tags: string[];
  mood?: string;
}

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

export interface ObjectDetection {
  id?: string;
  sceneId?: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  category?: string | string[];
}

export interface AIAnalyzeProps {
  videoUrl?: string;
  onAnalyzeComplete?: (result: AIAnalysisResult) => void;
  onNext?: () => void;
}

// ─── Director ───

export type DirectorState =
  | 'idle' | 'analyzing' | 'planning' | 'ready' | 'rendering' | 'done';

export interface DirectorPlan {
  id: string;
  summary: string;
  angle: string;
  targetAudience?: string;
  targetDurationSecs: number;
  estimatedSegments: number;
  segmentMode: import('./script').SegmentMode;
  recommendedVoice: string;
  keyPoints: string[];
  warnings: string[];
  confidence: number;
}

export interface DirectorStatusResponse {
  sessionId: string;
  state: DirectorState;
  plan?: DirectorPlan;
  error?: string;
  progressPct: number;
}

export interface PlanModifications {
  targetDurationSecs?: number;
  angle?: string;
  segmentMode?: import('./script').SegmentMode;
  recommendedVoice?: string;
}
