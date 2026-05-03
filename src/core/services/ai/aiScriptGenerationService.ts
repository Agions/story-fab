/**
 * AI 服务 - 统一封装多种 AI 模型 API
 * 支持：通义千问、讯飞星火、智谱清言、DeepSeek、Moonshot Kimi
 */
import axios from 'axios';
import { getApiKey } from '@/services/tauri';
import type { VideoMetadata } from '@/core/video';
import { logger } from '@/shared/utils/logging';
import { formatTimestamp } from '@/shared/utils/formatting';
import type { ScriptSegment as CoreScriptSegment } from '@/core/types';

// ============================================
// 类型定义
// ============================================

interface CallAIOptions {
  appId?: string;
  [key: string]: unknown;
}

export interface ScriptGenerationSettings {
  style?: 'informative' | 'entertaining' | 'dramatic' | 'casual';
  tone?: 'neutral' | 'enthusiastic' | 'serious' | 'humorous' | 'inspirational';
  targetLength?: number;
  instruction?: string;
  aiModel?: AIModelConfig;
}

/**
 * @deprecated Use ScriptSegment from '@/core/types' instead.
 * This re-export exists for backward compatibility.
 */
export type ScriptSegment = CoreScriptSegment;
/// Script type returned by AI generation — distinct from the project Script in core/types.ts
export interface AIScriptDraft {
  id: string;
  projectId: string;
  content: CoreScriptSegment[];
  fullText: string;
  createdAt: string;
  updatedAt: string;
  modelUsed?: string;
}
/// Alias for backwards compat
export type Script = AIScriptDraft;

interface AIModelConfig {
  type: LegacyAIModelType;
  apiKey?: string;
  baseUrl?: string;
}

export type LegacyAIModelType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'qianwen'
  | 'spark'
  | 'chatglm'
  | 'deepseek'
  | 'moonshot';

// AI 模型配置
interface ModelConfig {
  url: string;
  model: string;
  headers: (apiKey: string) => Record<string, string>;
  transformRequest: (prompt: string, options?: Record<string, unknown>) => unknown;
  transformResponse: (data: unknown) => string;
}

interface AnalysisMoment {
  timestamp: number;
  description: string;
  importance: number;
}

interface AnalysisEmotion {
  timestamp: number;
  type: string;
  intensity: number;
}

interface AnalysisInput {
  keyMoments?: AnalysisMoment[];
  emotions?: AnalysisEmotion[];
  summary?: string;
  title?: string;
  duration?: number;
}

// ============================================
// AI 服务错误
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

// Axios 错误类型
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
// 模型配置
// ============================================

const AI_MODEL_CONFIGS: Record<LegacyAIModelType, ModelConfig> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    headers: apiKey => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }),
    transformRequest: prompt => ({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
    transformResponse: data =>
      (data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content,
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-latest',
    headers: apiKey => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
    transformRequest: prompt => ({
      model: 'claude-3-5-sonnet-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
    transformResponse: data =>
      (data as { content?: Array<{ type?: string; text?: string }> }).content?.find(
        item => item.type === 'text'
      )?.text || '',
  },
  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent',
    model: 'gemini-3.1-pro',
    headers: () => ({ 'Content-Type': 'application/json' }),
    transformRequest: prompt => ({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
    }),
    transformResponse: data =>
      (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
        .candidates?.[0]?.content?.parts?.[0]?.text || '',
  },
  qianwen: {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen2.5-max',
    headers: apiKey => ({ Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }),
    transformRequest: prompt => ({ model: 'qwen2.5-max', messages: [{ role: 'user', content: prompt }] }),
    transformResponse: data => (data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content,
  },
  spark: {
    url: 'https://spark-api.xf-yun.com/v3.5/chat',
    model: 'generalv3.5',
    headers: apiKey => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }),
    transformRequest: (prompt, options) => ({
      header: { app_id: options?.appId || '', uid: 'CutDeck_user' },
      parameter: { chat: { domain: 'generalv3.5', temperature: 0.7, max_tokens: 4096 } },
      payload: { message: { text: [{ role: 'user', content: prompt }] } },
    }),
    transformResponse: data => {
      const typed = data as {
        header?: { code?: number; message?: string };
        payload?: { choices?: Array<{ text: string }> };
      };
      if (typed.header?.code !== 0)
        throw new AIServiceError(`讯飞星火API错误: ${typed.header?.message || '未知错误'}`);
      return typed.payload?.choices?.[0]?.text || '';
    },
  },
  chatglm: {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',
    headers: apiKey => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }),
    transformRequest: prompt => ({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
    transformResponse: data => (data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content,
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-v4-flash',
    headers: apiKey => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }),
    transformRequest: prompt => ({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
    transformResponse: data =>
      (data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content,
  },
  moonshot: {
    url: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    headers: apiKey => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }),
    transformRequest: prompt => ({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
    transformResponse: data =>
      (data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content,
  },
};

// ============================================
// 提示词构建
// ============================================

const STYLE_GUIDANCE_MAP: Record<string, string> = {
  informative: '请生成一个客观、教育性、详细的信息型解说脚本',
  entertaining: '请生成一个活泼、风趣、吸引人的娱乐型解说脚本',
  dramatic: '请生成一个情感丰富、紧张、引人入胜的戏剧型解说脚本',
  casual: '请生成一个轻松、对话式、自然的随意型解说脚本',
};

const TONE_GUIDANCE_MAP: Record<string, string> = {
  neutral: '使用中立、专业的语气',
  enthusiastic: '使用热情、充满活力的语气',
  serious: '使用严肃、庄重的语气',
  humorous: '使用幽默、诙谐的语气',
  inspirational: '使用励志、鼓舞人心的语气',
};

const buildScriptPrompt = (analysis: AnalysisInput, options?: ScriptGenerationSettings): string => {
  const { keyMoments = [], emotions = [], summary, title, duration } = analysis;

  const keyMomentsText = keyMoments
    .map(
      m =>
        `时间点: ${Math.floor(m.timestamp / 60)}分${m.timestamp % 60}秒, 描述: ${m.description}, 重要性: ${m.importance}/10`
    )
    .join('\n');

  const emotionsText = emotions
    .map(
      e =>
        `时间点: ${Math.floor(e.timestamp / 60)}分${e.timestamp % 60}秒, 情感: ${e.type}, 强度: ${e.intensity}`
    )
    .join('\n');

  // 类型安全的 style/tone 检查
  const styleGuidance = (options?.style && Object.prototype.hasOwnProperty.call(STYLE_GUIDANCE_MAP, options.style))
    ? STYLE_GUIDANCE_MAP[options.style as keyof typeof STYLE_GUIDANCE_MAP]
    : '请生成一个专业、信息丰富的解说脚本';
  const toneGuidance = (options?.tone && Object.prototype.hasOwnProperty.call(TONE_GUIDANCE_MAP, options.tone))
    ? TONE_GUIDANCE_MAP[options.tone as keyof typeof TONE_GUIDANCE_MAP]
    : '使用中立、专业的语气';

  return `请根据以下视频分析信息，为我创建一个视频解说脚本。

${title ? `视频标题: ${title}\n` : ''}${duration ? `时长: ${duration}秒\n` : ''}
视频摘要:
${summary || '无'}

关键时刻:
${keyMomentsText || '无'}

情感标记:
${emotionsText || '无'}

要求:
1. ${styleGuidance}
2. ${toneGuidance}
3. 每个段落应包含时间戳，格式为 [分:秒]
4. 脚本应当分段呈现，每段对应视频中的一个场景或主题
5. 脚本总长度应当适合视频时长，保持流畅自然
6. 请确保脚本语言生动，能够吸引观众注意力

请直接返回分段的脚本内容，不要包含其他解释。每个段落前使用时间戳标记，例如 [00:10]。
`;
};

// ============================================
// 统一 API 调用
// ============================================

const invokeAIModel = async (
  modelType: LegacyAIModelType,
  apiKey: string,
  prompt: string,
  options?: CallAIOptions
): Promise<string> => {
  const config = AI_MODEL_CONFIGS[modelType];
  if (!config) throw new AIServiceError(`不支持的模型类型: ${modelType}`);

  const url = modelType === 'google' ? `${config.url}?key=${encodeURIComponent(apiKey)}` : config.url;
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
};

// ============================================
// 导出服务
// ============================================

export const scriptGenerationService = {
  // 统一调用接口
  generateScript: async (
    modelType: LegacyAIModelType,
    apiKey: string,
    analysis: AnalysisInput,
    options?: ScriptGenerationSettings
  ): Promise<string> => {
    const prompt = buildScriptPrompt(analysis, options);
    return invokeAIModel(modelType, apiKey, prompt, options as CallAIOptions | undefined);
  },

  // 构建提示词
  buildPrompt: buildScriptPrompt,

  // 解析脚本内容
  parseScriptContent: (scriptText: string): ScriptSegment[] => {
    const lines = scriptText.split('\n');
    const segments: ScriptSegment[] = [];
    const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/;

    let currentContent = '';
    let currentStartTime = 0;
    let currentEndTime = 0;
    let currentType: ScriptSegment['type'] = 'narration';
    let hasCurrentSegment = false;

    const saveSegment = () => {
      if (hasCurrentSegment && currentContent.trim()) {
        segments.push({
          id: crypto.randomUUID(),
          startTime: currentStartTime,
          endTime: currentEndTime,
          content: currentContent.trim(),
          type: currentType,
        });
        currentContent = '';
        hasCurrentSegment = false;
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(timestampRegex);
      if (match) {
        saveSegment();
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        currentStartTime = minutes * 60 + seconds;
        currentEndTime = currentStartTime + 10;
        currentContent = trimmed.replace(timestampRegex, '').trim();
        hasCurrentSegment = true;

        if (currentContent.includes('旁白') || currentContent.toLowerCase().includes('narration')) {
          currentType = 'narration';
        } else if (
          currentContent.includes('对话') ||
          currentContent.toLowerCase().includes('dialogue')
        ) {
          currentType = 'dialogue';
        } else if (
          currentContent.includes('描述') ||
          currentContent.toLowerCase().includes('description')
        ) {
          currentType = 'description';
        }
      } else if (hasCurrentSegment) {
        currentContent += ' ' + trimmed;
        currentEndTime += 2;
      }
    }
    saveSegment();
    return segments;
  },
};

// 便捷函数
export const generateScriptWithModel = scriptGenerationService.generateScript;

export const parseGeneratedScript = (content: string, projectId: string): AIScriptDraft => {
  const segments = scriptGenerationService.parseScriptContent(content);
  return {
    id: crypto.randomUUID(),
    projectId,
    content: segments,
    fullText: segments.map(s => s.content).join('\n\n'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// OpenAI 兼容接口 (用于 generateScriptWithOpenAI)
export const generateScriptWithOpenAI = async (
  videoMetadata: VideoMetadata,
  keyFramesDescriptions: string[],
  preferences: {
    style?: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    purpose?: string;
    targetAudience?: string;
    additionalRequirements?: string;
  }
): Promise<string> => {
  try {
    const apiKey = await getApiKey('openai');
    if (!apiKey) {
      throw new Error('未配置 OpenAI API 密钥，请先在设置中配置');
    }

    const normalizeStyle = (style: string | undefined): ScriptGenerationSettings['style'] => {
      if (
        style === 'informative' ||
        style === 'entertaining' ||
        style === 'dramatic' ||
        style === 'casual'
      ) {
        return style;
      }
      return undefined;
    };

    const normalizeTone = (tone: string | undefined): ScriptGenerationSettings['tone'] => {
      if (
        tone === 'neutral' ||
        tone === 'enthusiastic' ||
        tone === 'serious' ||
        tone === 'humorous' ||
        tone === 'inspirational'
      ) {
        return tone;
      }
      return undefined;
    };

    const analysis: AnalysisInput = {
      title: '视频内容',
      duration: videoMetadata.duration,
      summary: keyFramesDescriptions.join('\n'),
      keyMoments: [],
      emotions: [],
    };

    return scriptGenerationService.generateScript('openai', apiKey, analysis, {
      style: normalizeStyle(preferences.style),
      tone: normalizeTone(preferences.tone),
    });
  } catch (error) {
    logger.error('脚本生成失败:', { error });
    throw new Error(error instanceof Error ? error.message : '脚本生成失败');
  }
};

export const analyzeKeyFramesWithAI = async (_framePaths: string[]): Promise<string[]> => {
  logger.warn('analyzeKeyFramesWithAI is not yet implemented — returning empty array');
  return [];
};

export const improveScriptWithAI = async (
  originalScript: string,
  instructions: string
): Promise<string> => {
  const apiKey = await getApiKey('openai');
  if (!apiKey) {
    throw new Error('未配置 OpenAI API 密钥，请先在设置中配置');
  }

  const prompt = `请根据以下指示优化视频脚本:\n\n原始脚本:\n${originalScript}\n\n优化指示:\n${instructions}`;
  return invokeAIModel('openai', apiKey, prompt);
};

export default scriptGenerationService;
