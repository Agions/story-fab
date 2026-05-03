/**
 * OpenAI API 适配器
 */
import type { RequestConfig, AIResponse } from './types';
import { ServiceError } from './base.service';

export async function callOpenAI(apiKey: string, config: RequestConfig): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new ServiceError(`OpenAI API 错误: ${response.status}`, 'API_ERROR', response.status);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: AIResponse['usage'];
    model?: string;
  };

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    usage: data.usage,
    model: data.model ?? config.model,
  };
}
