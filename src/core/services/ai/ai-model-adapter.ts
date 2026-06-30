import type { ModelProvider } from '@/types';
import type { LegacyAIModelType } from './script-service';

const PROVIDER_TO_LEGACY_MODEL: Record<ModelProvider, LegacyAIModelType> = {
  openai: 'openai',
  anthropic: 'anthropic',
  google: 'google',
  alibaba: 'qianwen',
  zhipu: 'chatglm',
  iflytek: 'spark',
  deepseek: 'deepseek',
  moonshot: 'moonshot',
  local: 'openai',
  custom: 'openai',
};

export const resolveLegacyModel = (provider: ModelProvider): LegacyAIModelType =>
  PROVIDER_TO_LEGACY_MODEL[provider] ?? 'deepseek';

export const getLegacyModelCompatMap = (): Readonly<Record<ModelProvider, LegacyAIModelType>> =>
  Object.freeze({ ...PROVIDER_TO_LEGACY_MODEL });

export type { ModelProvider };
