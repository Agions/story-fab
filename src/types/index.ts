/**
 * story-fab 类型统一出口
 *
 * 注意：core/types/video-project.ts 是视频分析/项目类型的唯一定义位置
 * core/types.ts 是其他编辑器/项目类型的唯一定义位置
 * 此文件为向后兼容的重导出层，同时导出 AI 模型配置常量。
 *
 * @deprecated 直接从 @/core/types 或 @/core/types/video-project 导入类型
 */
import {
  AI_MODELS as CORE_AI_MODELS,
  MODEL_PROVIDERS,
  getModelsByProvider,
} from '@/core/config/aiModels.config';
import type {
  VideoAnalysis,
  KeyMoment,
  Emotion,
  Script,
  VideoProject,
  AIModelConfig,
  AIModelInfo,
  AIModelSettings,
  AIModelType,
  ScriptGenerationOptions,
  AppSettings,
} from '@/core/types/video-project';
import type {
  VideoSegment,
  ScriptSegment,
  ProjectData,
  ProjectSettings,
  VideoInfo,
  ScriptData,
  TaskStatus,
} from '@/core/types';

// Re-export canonical types
export type {
  VideoAnalysis,
  KeyMoment,
  Emotion,
  Script,
  VideoProject,
  AIModelConfig,
  AIModelInfo,
  AIModelSettings,
  AIModelType,
  ScriptGenerationOptions,
  AppSettings,
};

// Re-export core types for backward compatibility
export type {
  VideoSegment,
  ScriptSegment,
  ProjectData,
  ProjectSettings,
  VideoInfo,
  ScriptData,
  TaskStatus,
};

// Backward-compatible type alias (标注 @deprecated)
export type Project = VideoProject;

// AI model info — computed from aiModels.config for UI use

const ALL_MODEL_PROVIDERS = Object.keys(MODEL_PROVIDERS) as AIModelType[];

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