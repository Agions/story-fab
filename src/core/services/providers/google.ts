/**
 * Google Gemini API 适配器
 */
import type { RequestConfig, AIResponse } from './types';
import { ServiceError } from './base.service';

export async function callGoogle(apiKey: string, config: RequestConfig): Promise<AIResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: config.messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.max_tokens,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new ServiceError(`Google API 错误: ${response.status}`, 'API_ERROR', response.status);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    model?: string;
  };

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    model: data.model ?? config.model,
  };
}
