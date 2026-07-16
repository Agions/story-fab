/**
 * AI Provider 通用调用辅助
 * 抽取 openai / anthropic / google / openai-like 共有的 fetch → check → parse 流程
 */
import type { RequestConfig, AIResponse } from './types';
import { ServiceError } from './base-service';

export interface ProviderConfig {
  buildUrl: (apiKey: string, config: RequestConfig) => string;
  buildHeaders: (apiKey: string, config: RequestConfig) => Record<string, string>;
  buildBody: (apiKey: string, config: RequestConfig) => unknown;
  parseResponse: (data: unknown, config: RequestConfig) => AIResponse;
  errorMessage?: string;
}

export async function callAIProvider(
  apiKey: string,
  config: RequestConfig,
  providerConfig: ProviderConfig
): Promise<AIResponse> {
  const response = await fetch(providerConfig.buildUrl(apiKey, config), {
    method: 'POST',
    headers: providerConfig.buildHeaders(apiKey, config),
    body: JSON.stringify(providerConfig.buildBody(apiKey, config)),
  });

  if (!response.ok) {
    const prefix = providerConfig.errorMessage ?? 'API 错误';
    throw new ServiceError(`${prefix}: ${response.status}`, 'API_ERROR', response.status);
  }

  const data = await response.json();
  return providerConfig.parseResponse(data, config);
}
