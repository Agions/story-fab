/**
 * AI Provider 共享类型
 */
import type { AIModel, AIModelSettings } from '@/core/types';

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface RequestConfig {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ModelProvider {
  name: string;
  baseUrl: string;
}

export type SupportedProvider = NonNullable<Exclude<AIModel['provider'], 'iflytek' | 'deepseek'>>;

export const MODEL_PROVIDERS: Record<SupportedProvider, ModelProvider> = {
  openai:       { name: 'OpenAI',         baseUrl: 'https://api.openai.com/v1' },
  anthropic:    { name: 'Anthropic',      baseUrl: 'https://api.anthropic.com/v1' },
  google:       { name: 'Google',         baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  azure:        { name: 'Azure OpenAI',   baseUrl: '' },
  local:        { name: 'Local Model',   baseUrl: '' },
  custom:       { name: 'Custom Provider', baseUrl: '' },
  alibaba:      { name: '阿里通义千问',   baseUrl: 'https://dashscope.aliyuncs.com' },
  zhipu:        { name: '智谱GLM',        baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  moonshot:     { name: '月之暗面 Kimi',  baseUrl: 'https://api.moonshot.cn/v1' },
};

export const isSupportedProvider = (p: AIModel['provider']): p is SupportedProvider =>
  p !== undefined && p in MODEL_PROVIDERS;
