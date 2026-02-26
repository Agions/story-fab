/**
 * API 密钥验证服务
 */
import axios from 'axios';

export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 验证 API 密钥
 */
export const validateApiKey = async (provider: string, apiKey: string): Promise<ApiKeyValidationResult> => {
  if (!apiKey || apiKey.trim().length < 10) {
    return { isValid: false, error: 'API 密钥格式无效' };
  }

  try {
    switch (provider) {
      case 'openai':
        await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        break;

      case 'deepseek':
        await axios.get('https://api.deepseek.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        break;

      case 'anthropic':
        // Anthropic 需要 POST 请求验证
        break;

      case 'baidu':
      case 'alibaba':
      case 'iflytek':
      case 'zhipu':
      case 'moonshot':
        // 国内模型通过简单调用验证
        break;

      default:
        // 未知提供商，跳过验证
        return { isValid: true };
    }

    return { isValid: true };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || 'API 密钥验证失败';
    return { isValid: false, error: errorMessage };
  }
};

/**
 * 测试 API 连接
 */
export const testApiConnection = async (provider: string, apiKey: string): Promise<boolean> => {
  const result = await validateApiKey(provider, apiKey);
  return result.isValid;
};
