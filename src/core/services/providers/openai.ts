/**
 * OpenAI API 适配器
 */
import type { AIResponse } from './types';
import { callAIProvider, type ProviderConfig } from './shared';

const openaiConfig: ProviderConfig = {
  buildUrl: () => 'https://api.openai.com/v1/chat/completions',
  buildHeaders: (apiKey) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }),
  buildBody: (_apiKey, config) => config,
  errorMessage: 'OpenAI API 错误',
  parseResponse: (data, config) => {
    const d = data as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: AIResponse['usage'];
      model?: string;
    };
    return {
      content: d.choices?.[0]?.message?.content ?? '',
      usage: d.usage,
      model: d.model ?? config.model,
    };
  },
};

export async function callOpenAI(apiKey: string, config: Parameters<typeof callAIProvider>[1]): Promise<AIResponse> {
  return callAIProvider(apiKey, config, openaiConfig);
}
