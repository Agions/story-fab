/**
 * AI 模型调用层
 * 职责：统一处理所有 AI 模型的 API 调用
 *
 * 重构说明：
 * - 从原 scriptService.ts (548行) 中提取调用逻辑
 * - 统一错误处理和请求/响应转换
 */

import axios from 'axios';
import { AI_MODEL_CONFIGS, type AIModelType } from './aiModelConfigs';

// ============================================
// 错误处理
// ============================================

export class AIServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

interface AxiosErrorResponse {
  data?: {
    error?: { message?: string };
    error_msg?: string;
    header?: { message?: string };
  };
  status?: number;
}

function parseAIErrorResponse(error: unknown, modelType: string): AIServiceError {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: AxiosErrorResponse };
    const data = axiosError.response?.data;

    if (data?.error?.message) {
      return new AIServiceError(data.error.message, axiosError.response?.status);
    }
    if (typeof data?.error_msg === 'string') {
      return new AIServiceError(data.error_msg, axiosError.response?.status);
    }
    if (data?.header?.message) {
      return new AIServiceError(data.header.message, axiosError.response?.status);
    }
  }

  if (error instanceof Error) {
    return new AIServiceError(error.message);
  }

  return new AIServiceError(`${modelType} API调用失败`);
}

// ============================================
// 统一调用接口
// ============================================

export interface CallAIOptions {
  appId?: string;
  [key: string]: unknown;
}

/**
 * 统一调用 AI 模型
 * @param modelType 模型类型
 * @param apiKey API 密钥
 * @param prompt 提示词
 * @param options 额外选项
 * @returns 生成的文本
 */
export async function invokeAIModel(
  modelType: AIModelType,
  apiKey: string,
  prompt: string,
  options?: CallAIOptions
): Promise<string> {
  const config = AI_MODEL_CONFIGS[modelType];
  if (!config) {
    throw new AIServiceError(`不支持的模型类型: ${modelType}`);
  }

  const url =
    modelType === 'google' ? `${config.url}?key=${encodeURIComponent(apiKey)}` : config.url;

  const headers = config.headers(apiKey);

  try {
    const requestOptions =
      options && typeof options === 'object' ? (options as Record<string, unknown>) : undefined;

    const response = await axios.post(url, config.transformRequest(prompt, requestOptions), {
      headers,
    });

    return config.transformResponse(response.data);
  } catch (error: unknown) {
    throw parseAIErrorResponse(error, modelType);
  }
}
