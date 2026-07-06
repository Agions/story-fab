import type { ModelProvider } from '@/types';
import type { AIModelType } from './script/ai-model-configs';

const PROVIDER_TO_LEGACY_MODEL: Record<ModelProvider, AIModelType> = {
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

export const resolveLegacyModel = (provider: ModelProvider): AIModelType =>
  PROVIDER_TO_LEGACY_MODEL[provider] ?? 'deepseek';

export const getLegacyModelCompatMap = (): Readonly<Record<ModelProvider, AIModelType>> =>
  Object.freeze({ ...PROVIDER_TO_LEGACY_MODEL });

export type { ModelProvider };
