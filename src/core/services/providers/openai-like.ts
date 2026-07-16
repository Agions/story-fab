/**
 * OpenAI-compatible API 适配器（阿里、智谱、Moonshot）
 * 均使用 OpenAI 的 /chat/completions 接口格式
 */
import type { AIResponse } from './types';
import { callAIProvider, type ProviderConfig } from './shared';

interface OpenAILikeResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: AIResponse['usage'];
  model?: string;
}

const openaiLikeConfig: ProviderConfig = {
  buildUrl: (_apiKey, _config) => '', // 由具体 endpoint 覆盖
  buildHeaders: (apiKey) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }),
  buildBody: (_apiKey, config) => config,
  errorMessage: 'API 错误',
  parseResponse: (data, config) => {
    const d = data as OpenAILikeResponse;
    return {
      content: d.choices?.[0]?.message?.content ?? '',
      usage: d.usage,
      model: d.model ?? config.model,
    };
  },
};

async function callOpenAICompatible(endpoint: string, apiKey: string, config: Parameters<typeof callAIProvider>[1]): Promise<AIResponse> {
  return callAIProvider(apiKey, config, {
    ...openaiLikeConfig,
    buildUrl: () => endpoint,
  });
}

export const callAlibaba = (apiKey: string, config: Parameters<typeof callAIProvider>[1]) =>
  callOpenAICompatible('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', apiKey, config);

export const callZhipu = (apiKey: string, config: Parameters<typeof callAIProvider>[1]) =>
  callOpenAICompatible('https://open.bigmodel.cn/api/paas/v4/chat/completions', apiKey, config);

export const callMoonshot = (apiKey: string, config: Parameters<typeof callAIProvider>[1]) =>
  callOpenAICompatible('https://api.moonshot.cn/v1/chat/completions', apiKey, config);
