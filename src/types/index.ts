/**
 * CutDeck 类型统一出口
 * 
 * 注意：core/types.ts 是 canonical 类型定义来源
 * 此文件主要用于：
 * 1. 重新导出核心类型供外部使用
 * 2. 定义视频处理特定类型（VideoProject、VideoAnalysis 等）
 */

import {
  AI_MODELS as CORE_AI_MODELS,
  MODEL_PROVIDERS,
  getModelsByProvider,
} from '../core/config/models.config';
import type { 
  ModelProvider, 
  VideoSegment as CoreVideoSegment, 
  ScriptSegment as CoreScriptSegment,
  ProjectData as CoreProjectData,
  ProjectSettings as CoreProjectSettings,
  VideoInfo as CoreVideoInfo,
  ScriptData as CoreScriptData,
  TaskStatus as CoreTaskStatus,
} from '../core/types';

// Re-export canonical types from core/types (这些是编辑器/项目使用的类型)
export type VideoSegment = CoreVideoSegment;
export type ScriptSegment = CoreScriptSegment;
export type ProjectData = CoreProjectData;  // 统一使用 core/types 的定义
export type ProjectSettings = CoreProjectSettings;
export type VideoInfo = CoreVideoInfo;
export type ScriptData = CoreScriptData;
export type TaskStatus = CoreTaskStatus;

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

/**
 * 视频剪辑项目类型
 * 与 core/types/Project（仪表盘项目）不同，此类型包含完整的视频处理相关数据
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

/**
 * @deprecated 请使用 VideoProject，core/types/Project 是仪表盘项目类型
 */
export type Project = VideoProject;

// 重命名以避免与 core/types 中的 AIModel 冲突
export interface AIModelConfig {
  key: string;
  name: string;
  provider: string;
  apiKey?: string;
}

// AI 模型信息（用于 UI 展示）
export interface AIModelInfo {
  name: string;
  provider: string;
  description: string;
  icon: string;
  apiKeyFormat: string;
}

// AI 模型设置
export interface AIModelSettings {
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
  apiVersion?: string;
}

// AI 模型类型 - 2026年3月最新
export type AIModelType = ModelProvider;

const ALL_MODEL_PROVIDERS = Object.keys(MODEL_PROVIDERS) as AIModelType[];

// 用于 VideoProject.aiModel 的 AI_MODEL_INFO
export const AI_MODEL_INFO: Record<AIModelType, AIModelConfig> = ALL_MODEL_PROVIDERS.reduce(
  (acc, provider) => {
    acc[provider] = {
      key: provider,
      name: MODEL_PROVIDERS[provider].name,
      provider: MODEL_PROVIDERS[provider].name,
    };
    return acc;
  },
  {} as Record<AIModelType, AIModelConfig>
);

const providerDefaultModelName = (provider: AIModelType): string => {
  const model = getModelsByProvider(provider).find((item) => item.isAvailable !== false) || CORE_AI_MODELS.find((item) => item.provider === provider);
  return model?.name || MODEL_PROVIDERS[provider].name;
};

const providerDescription = (provider: AIModelType): string => {
  if (provider === 'iflytek') return '讯飞星火模型请以控制台可用型号为准';
  return `默认模型：${providerDefaultModelName(provider)}`;
};

// 用于 UI 展示的 AI_MODEL_INFO（包含更多字段）
export const AI_MODEL_INFO_UI: Record<AIModelType, AIModelInfo> = ALL_MODEL_PROVIDERS.reduce(
  (acc, provider) => {
    acc[provider] = {
      name: MODEL_PROVIDERS[provider].name,
      provider: MODEL_PROVIDERS[provider].name,
      description: providerDescription(provider),
      icon: MODEL_PROVIDERS[provider].icon,
      apiKeyFormat: MODEL_PROVIDERS[provider].keyFormat,
    };
    return acc;
  },
  {} as Record<AIModelType, AIModelInfo>
);

/**
 * 脚本生成选项
 */
export interface ScriptGenerationOptions {
  style?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  purpose?: string;
}

/**
 * 存储的应用设置
 */
export interface AppSettings {
  autoSave: boolean;
  defaultAIModel?: AIModelType;
  aiModelsSettings: Partial<Record<AIModelType, AIModelSettings>>;
  theme?: 'light' | 'dark' | 'system';
}
