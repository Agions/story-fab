/**
 * 模型展示常量（页面层）
 * 重新导出 core/config/models.config.ts 中的 PROVIDER_NAMES
 * 仅用于 Settings 等页面组件的展示目的
 */
import { MODEL_PROVIDERS } from '../core/config/aiModels.config';
import type { ModelProvider } from '@/core/types';

export type { ModelProvider };

/**
 * 提供商名称映射（从 MODEL_PROVIDERS 派生）
 */
export const PROVIDER_NAMES: Record<ModelProvider, string> = Object.fromEntries(
  Object.entries(MODEL_PROVIDERS).map(([provider, config]) => [provider, config.name])
) as Record<ModelProvider, string>;
