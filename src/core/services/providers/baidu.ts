/**
 * 百度文心 API 适配器（需换取 access_token）
 */
import type { RequestConfig, AIResponse } from './types';
import { ServiceError } from './base.service';

export async function callBaidu(apiKey: string, apiSecret: string, config: RequestConfig): Promise<AIResponse> {
  // 获取 access token
  const tokenResponse = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
    { method: 'POST' }
  );

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    throw new ServiceError('百度 access token 获取失败', 'API_ERROR', tokenResponse.status);
  }

  const response = await fetch(
    `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${config.model}?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: config.messages,
        temperature: config.temperature,
        max_output_tokens: config.max_tokens,
      }),
    }
  );

  if (!response.ok) {
    throw new ServiceError(`百度 API 错误: ${response.status}`, 'API_ERROR', response.status);
  }

  const data = (await response.json()) as { result?: string; model?: string };
  return { content: data.result ?? '', model: data.model ?? config.model };
}
