/**
 * Anthropic API 适配器
 */
import type { AIResponse } from './types';
import { callAIProvider, type ProviderConfig } from './shared';

const anthropicConfig: ProviderConfig = {
  buildUrl: () => 'https://api.anthropic.com/v1/messages',
  buildHeaders: (apiKey) => ({
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  }),
  buildBody: (_apiKey, config) => ({
    model: config.model,
    messages: config.messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: config.max_tokens,
    temperature: config.temperature,
  }),
  errorMessage: 'Anthropic API 错误',
  parseResponse: (data, config) => {
    const d = data as {
      content?: Array<{ text?: string }>;
      usage?: AIResponse['usage'];
      model?: string;
    };
    return {
      content: d.content?.[0]?.text ?? '',
      usage: d.usage,
      model: d.model ?? config.model,
    };
  },
};

export async function callAnthropic(apiKey: string, config: Parameters<typeof callAIProvider>[1]): Promise<AIResponse> {
  return callAIProvider(apiKey, config, anthropicConfig);
}
