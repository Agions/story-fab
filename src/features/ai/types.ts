/**
 * AI Types - AI 功能类型定义
 */
export type AIFeatureType = 'video-narration' | 'first-person' | 'remix';

export interface AnalysisResult {
  id: string;
  videoId: string;
  scenes: Scene[];
  keyframes: Keyframe[];
  objects: DetectedObject[];
  emotions: EmotionData[];
  summary: string;
  stats: AnalysisStats;
  createdAt: string;
}

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
  description: string;
  tags: string[];
  type: string;
  confidence: number;
}

export interface Keyframe {
  id: string;
  time: number;
  thumbnail: string;
  description?: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface EmotionData {
  timestamp: number;
  emotion: string;
  intensity: number;
}

export interface AnalysisStats {
  sceneCount: number;
  objectCount: number;
  avgSceneDuration: number;
  sceneTypes: Record<string, number>;
  objectCategories: Record<string, number>;
  dominantEmotions: Record<string, number>;
}

export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  type: 'ocr' | 'asr';
}

export interface AIGenerateOptions {
  feature: AIFeatureType;
  style?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  language?: string;
  keywords?: string[];
}

export interface AIGenerateResult {
  script: string;
  metadata: {
    wordCount: number;
    estimatedDuration: number;
    style: string;
  };
}
