/**
 * Provider 显示名 — 派生自 core/config/aiModels.config.MODEL_PROVIDERS
 * 仅用于 UI 展示，避免散落到 settings 页面里重复定义
 */
import { MODEL_PROVIDERS } from '@/core/config/ai-models-config';
import type { ModelProvider } from '@/types';

export const PROVIDER_NAMES: Record<ModelProvider, string> = Object.fromEntries(
  Object.entries(MODEL_PROVIDERS).map(([provider, config]) => [provider, config.name])
) as Record<ModelProvider, string>;