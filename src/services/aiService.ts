/**
 * AI 服务 - 统一封装多种 AI 模型 API
 * 支持：文心一言、通义千问、讯飞星火、智谱清言、豆包、DeepSeek
 */
import axios from 'axios';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { getApiKey } from './tauriService';
import { AIModelType } from '@/types';
import { VideoMetadata } from './videoService';

// ============================================
// 类型定义
// ============================================

export interface ScriptGenerationSettings {
  style?: 'informative' | 'entertaining' | 'dramatic' | 'casual';
  tone?: 'neutral' | 'enthusiastic' | 'serious' | 'humorous' | 'inspirational';
  targetLength?: number;
  instruction?: string;
  aiModel?: AIModelConfig;
}

export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  type: 'narration' | 'dialogue' | 'description';
}

export interface Script {
  id: string;
  projectId: string;
  content: ScriptSegment[];
  fullText: string;
  createdAt: string;
  updatedAt: string;
  modelUsed?: string;
}

interface AIModelConfig {
  type: AIModelType;
  apiKey?: string;
  baseUrl?: string;
}

// AI 模型配置
interface ModelConfig {
  url: string;
  model: string;
  headers: (apiKey: string) => Record<string, string>;
  transformRequest: (prompt: string) => any;
  transformResponse: (data: any) => string;
}

// ============================================
// AI 服务错误
// ============================================

export class AIServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// ============================================
// 模型配置
// ============================================

const MODEL_CONFIGS: Record<AIModelType, ModelConfig> = {
  wenxin: {
    url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
    model: 'ernie-4.0',
    headers: (apiKey) => ({ 'Content-Type': 'application/json' }),
    transformRequest: (prompt) => ({ messages: [{ role: 'user', content: prompt }] }),
    transformResponse: (data) => data.result,
  },
  qianwen: {
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen3.5-plus',
    headers: (apiKey) => ({ 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }),
    transformRequest: (prompt) => ({ model: 'qwen3.5-plus', input: { prompt } }),
    transformResponse: (data) => data.output.text,
  },
  spark: {
    url: 'https://spark-api.xf-yun.com/v2.1/chat',
    model: 'general',
    headers: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
    transformRequest: (prompt, options) => ({
      header: { app_id: options?.appId || '', uid: 'ClipFlow_user' },
      parameter: { chat: { domain: 'general', temperature: 0.7, max_tokens: 4096 } },
      payload: { message: { text: [{ role: 'user', content: prompt }] } },
    }),
    transformResponse: (data) => {
      if (data.header?.code !== 0) throw new AIServiceError(`讯飞星火API错误: ${data.header.message}`);
      return data.payload.choices[0].text;
    },
  },
  chatglm: {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4',
    headers: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
    transformRequest: (prompt) => ({ model: 'glm-4', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4096 }),
    transformResponse: (data) => data.choices[0].content,
  },
  doubao: {
    url: 'https://api.doubao.com/v1/chat/completions',
    model: 'doubao-pro',
    headers: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
    transformRequest: (prompt) => ({ model: 'doubao-pro', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4096 }),
    transformResponse: (data) => data.output.text,
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    headers: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
    transformRequest: (prompt) => ({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4000 }),
    transformResponse: (data) => data.choices[0].message.content,
  },
};

// ============================================
// 提示词构建
// ============================================

const formatTimestamp = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const STYLE_GUIDANCE: Record<string, string> = {
  informative: '请生成一个客观、教育性、详细的信息型解说脚本',
  entertaining: '请生成一个活泼、风趣、吸引人的娱乐型解说脚本',
  dramatic: '请生成一个情感丰富、紧张、引人入胜的戏剧型解说脚本',
  casual: '请生成一个轻松、对话式、自然的随意型解说脚本',
};

const TONE_GUIDANCE: Record<string, string> = {
  neutral: '使用中立、专业的语气',
  enthusiastic: '使用热情、充满活力的语气',
  serious: '使用严肃、庄重的语气',
  humorous: '使用幽默、诙谐的语气',
  inspirational: '使用励志、鼓舞人心的语气',
};

const buildPrompt = (analysis: any, options?: ScriptGenerationSettings): string => {
  const { keyMoments = [], emotions = [], summary, title, duration } = analysis;
  
  const keyMomentsText = keyMoments.map((m: any) => 
    `时间点: ${Math.floor(m.timestamp / 60)}分${m.timestamp % 60}秒, 描述: ${m.description}, 重要性: ${m.importance}/10`
  ).join('\n');
  
  const emotionsText = emotions.map((e: any) => 
    `时间点: ${Math.floor(e.timestamp / 60)}分${e.timestamp % 60}秒, 情感: ${e.type}, 强度: ${e.intensity}`
  ).join('\n');

  const styleGuidance = options?.style ? STYLE_GUIDANCE[options.style] : '请生成一个专业、信息丰富的解说脚本';
  const toneGuidance = options?.tone ? TONE_GUIDANCE[options.tone] : '使用中立、专业的语气';

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

const callAI = async (
  modelType: AIModelType,
  apiKey: string,
  prompt: string,
  options?: any
): Promise<string> => {
  const config = MODEL_CONFIGS[modelType];
  if (!config) throw new AIServiceError(`不支持的模型类型: ${modelType}`);

  const url = modelType === 'wenxin' ? `${config.url}?access_token=${apiKey}` : config.url;
  const headers = modelType === 'wenxin' ? config.headers('') : config.headers(apiKey);
  
  try {
    const response = await axios.post(url, config.transformRequest(prompt, options), { headers });
    return config.transformResponse(response.data);
  } catch (error: any) {
    const errMsg = error.response?.data?.error?.message || 
                   error.response?.data?.error_msg || 
                   error.response?.data?.header?.message ||
                   `${modelType} API调用失败`;
    throw new AIServiceError(errMsg, error.response?.status);
  }
};

// ============================================
// 导出服务
// ============================================

export const aiService = {
  // 统一调用接口
  generateScript: async (
    modelType: AIModelType,
    apiKey: string,
    analysis: any,
    options?: ScriptGenerationSettings
  ): Promise<string> => {
    const prompt = buildPrompt(analysis, options);
    return callAI(modelType, apiKey, prompt, options);
  },

  // 构建提示词
  buildPrompt,

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
          id: uuidv4(),
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
        } else if (currentContent.includes('对话') || currentContent.toLowerCase().includes('dialogue')) {
          currentType = 'dialogue';
        } else if (currentContent.includes('描述') || currentContent.toLowerCase().includes('description')) {
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
export const generateScriptWithModel = aiService.generateScript;

export const parseGeneratedScript = (content: string, projectId: string): Script => {
  const segments = aiService.parseScriptContent(content);
  return {
    id: uuidv4(),
    projectId,
    content: segments,
    fullText: segments.map(s => s.content).join('\n\n'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// OpenAI 兼容接口 (用于 generateScriptWithAI)
export const generateScriptWithAI = async (
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
      message.error('未配置 OpenAI API 密钥，请先在设置中配置');
      throw new Error('未配置API密钥');
    }

    const analysis = {
      title: '视频内容',
      duration: videoMetadata.duration,
      summary: keyFramesDescriptions.join('\n'),
      keyMoments: [],
      emotions: [],
    };

    return aiService.generateScript('deepseek', apiKey, analysis, {
      style: preferences.style as any,
      tone: preferences.tone as any,
    });
  } catch (error) {
    console.error('脚本生成失败:', error);
    message.error(error instanceof Error ? error.message : '脚本生成失败');
    throw error;
  }
};

export const analyzeKeyFramesWithAI = async (framePaths: string[]): Promise<string[]> => {
  return framePaths.map((_, i) => `关键帧 ${i + 1} 中的场景描述`);
};

export const improveScriptWithAI = async (
  originalScript: string,
  instructions: string
): Promise<string> => {
  const apiKey = await getApiKey('openai');
  if (!apiKey) {
    message.error('未配置 OpenAI API 密钥');
    throw new Error('未配置API密钥');
  }

  const prompt = `请根据以下指示优化视频脚本:\n\n原始脚本:\n${originalScript}\n\n优化指示:\n${instructions}`;
  return callAI('deepseek', apiKey, prompt);
};

export default aiService;
