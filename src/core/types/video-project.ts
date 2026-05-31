/**
 * Video Project & Analysis Types
 * Canonical source for video analysis, project, and model config types.
 * Formerly in src/types/index.ts and src/core/types.ts.
 */
import type { ModelProvider } from '@/core/types';

// ─── Video Analysis (from src/types/index.ts, supersedes core/types.ts VideoAnalysis) ───

export interface VideoAnalysis {
  id: string;
  title: string;
  duration: number;
  keyMoments: KeyMoment[];
  emotions: Emotion[];
  summary: string;
}

export interface KeyMoment {
  timestamp: number;
  description: string;
  importance: number;
}

export interface Emotion {
  timestamp: number;
  type: string;
  intensity: number;
}

export interface Script {
  id: string;
  videoId: string;
  content: ScriptSegment[];
  createdAt: string;
  updatedAt: string;
  modelUsed?: string;
}

export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content?: string;
  text?: string;
  voice?: string;
  type?: 'narration' | 'dialogue' | 'description' | string;
}

/**
 * Video editing project — full video处理 + 脚本数据
 * Distinct from DashboardProject (src/shared/types/project.ts).
 */
export interface VideoProject {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  videoPath?: string;
  outputDir?: string;
  metadata?: Record<string, unknown>;
  analysis?: VideoAnalysis;
  scripts: Script[];
  createdAt: string;
  updatedAt: string;
  aiModel?: AIModelConfig;
}

// ─── AI Model Types (from src/types/index.ts) ───

export interface AIModelConfig {
  key: string;
  name: string;
  provider: string;
  apiKey?: string;
}

export interface AIModelInfo {
  name: string;
  provider: string;
  description: string;
  icon: string;
  apiKeyFormat: string;
}

export interface AIModelSettings {
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
  apiVersion?: string;
}

export type AIModelType = ModelProvider;

export interface ScriptGenerationOptions {
  style?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  purpose?: string;
}

export interface AppSettings {
  autoSave: boolean;
  defaultAIModel?: AIModelType;
  aiModelsSettings: Partial<Record<AIModelType, AIModelSettings>>;
  theme?: 'light' | 'dark' | 'system';
}