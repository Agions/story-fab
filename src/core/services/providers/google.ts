/**
 * Google Gemini API 适配器
 */
import type { AIResponse } from './types';
import { callAIProvider, type ProviderConfig } from './shared';

const googleConfig: ProviderConfig = {
  buildUrl: (apiKey, config) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`,
  buildHeaders: () => ({ 'Content-Type': 'application/json' }),
  buildBody: (_apiKey, config) => ({
    contents: config.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.max_tokens,
    },
  }),
  errorMessage: 'Google API 错误',
  parseResponse: (data, config) => {
    const d = data as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      model?: string;
    };
    return {
      content: d.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      model: d.model ?? config.model,
    };
  },
};

export async function callGoogle(apiKey: string, config: Parameters<typeof callAIProvider>[1]): Promise<AIResponse> {
  return callAIProvider(apiKey, config, googleConfig);
}
