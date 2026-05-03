/**
 * Anthropic API 适配器
 */
import type { RequestConfig, AIResponse } from './types';
import { ServiceError } from './base.service';

export async function callAnthropic(apiKey: string, config: RequestConfig): Promise<AIResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      messages: config.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: config.max_tokens,
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    throw new ServiceError(`Anthropic API 错误: ${response.status}`, 'API_ERROR', response.status);
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
    usage?: AIResponse['usage'];
    model?: string;
  };

  return {
    content: data.content?.[0]?.text ?? '',
    usage: data.usage,
    model: data.model ?? config.model,
  };
}
