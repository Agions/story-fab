/**
 * OpenAI-compatible API 适配器（阿里、智谱、Moonshot）
 * 均使用 OpenAI 的 /chat/completions 接口格式
 */
import type { RequestConfig, AIResponse } from './types';
import { ServiceError } from '../base.service';

interface OpenAILikeResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: AIResponse['usage'];
  model?: string;
}

async function callOpenAICompatible(endpoint: string, apiKey: string, config: RequestConfig): Promise<AIResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new ServiceError(`API 错误: ${response.status}`, 'API_ERROR', response.status);
  }

  const data = (await response.json()) as OpenAILikeResponse;
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    usage: data.usage,
    model: data.model ?? config.model,
  };
}

export const callAlibaba = (apiKey: string, config: RequestConfig) =>
  callOpenAICompatible('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', apiKey, config);

export const callZhipu = (apiKey: string, config: RequestConfig) =>
  callOpenAICompatible('https://open.bigmodel.cn/api/paas/v4/chat/completions', apiKey, config);

export const callMoonshot = (apiKey: string, config: RequestConfig) =>
  callOpenAICompatible('https://api.moonshot.cn/v1/chat/completions', apiKey, config);
