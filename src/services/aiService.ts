import axios from 'axios';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { getApiKey } from './tauriService';
import { AIModelType, AIModelConfig } from '@/types';
import { VideoMetadata } from './videoService';

export interface ScriptGenerationSettings {
  style?: string;    // 风格: 简洁/详细/幽默等
  tone?: string;     // 语气: 正式/轻松/专业等
  targetLength?: number;  // 目标时长(秒)
  instruction?: string;   // 特殊指令
  aiModel?: AIModelConfig;      // 使用的AI模型
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
  modelUsed?: string;    // 使用的模型名称
}

// 文心一言API接口定义
interface WenxinResponse {
  id: string;
  object: string;
  created: number;
  result: string;
  need_clear_history: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 通义千问API接口定义
interface QianwenResponse {
  output: {
    text: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  request_id: string;
}

// 讯飞星火API接口定义
interface SparkResponse {
  header: {
    code: number;
    message: string;
    sid: string;
  };
  payload: {
    choices: {
      text: string;
    }[];
    usage: {
      text: {
        question_tokens: number;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  };
}

// 智谱清言API接口定义
interface ChatGLMResponse {
  id: string;
  created: number;
  choices: {
    content: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 豆包API接口定义
interface DoubaoResponse {
  id: string;
  output: {
    text: string;
  };
  usage: {
    total_tokens: number;
  };
}

// 统一的AI服务错误类型
export class AIServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// 格式化时间戳为 MM:SS 格式
const formatTimestamp = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 根据视频分析生成脚本的提示模板
const getScriptPrompt = (analysis: any, options?: any) => {
  const { keyMoments, emotions, summary } = analysis;
  
  // 构建关键时刻和情感部分
  const keyMomentsText = keyMoments.map((moment: any) => 
    `时间点: ${Math.floor(moment.timestamp / 60)}分${moment.timestamp % 60}秒, 描述: ${moment.description}, 重要性: ${moment.importance}/10`
  ).join('\n');
  
  const emotionsText = emotions.map((emotion: any) => 
    `时间点: ${Math.floor(emotion.timestamp / 60)}分${emotion.timestamp % 60}秒, 情感: ${emotion.type}, 强度: ${emotion.intensity}`
  ).join('\n');
  
  // 添加自定义脚本设置
  let styleGuidance = '请生成一个专业、信息丰富的解说脚本';
  let toneGuidance = '使用中立、专业的语气';
  
  if (options) {
    if (options.style === 'informative') {
      styleGuidance = '请生成一个客观、教育性、详细的信息型解说脚本';
    } else if (options.style === 'entertaining') {
      styleGuidance = '请生成一个活泼、风趣、吸引人的娱乐型解说脚本';
    } else if (options.style === 'dramatic') {
      styleGuidance = '请生成一个情感丰富、紧张、引人入胜的戏剧型解说脚本';
    } else if (options.style === 'casual') {
      styleGuidance = '请生成一个轻松、对话式、自然的随意型解说脚本';
    }
    
    if (options.tone === 'neutral') {
      toneGuidance = '使用中立、专业的语气';
    } else if (options.tone === 'enthusiastic') {
      toneGuidance = '使用热情、充满活力的语气';
    } else if (options.tone === 'serious') {
      toneGuidance = '使用严肃、庄重的语气';
    } else if (options.tone === 'humorous') {
      toneGuidance = '使用幽默、诙谐的语气';
    } else if (options.tone === 'inspirational') {
      toneGuidance = '使用励志、鼓舞人心的语气';
    }
  }
  
  // 构建完整提示
  return `请根据以下视频分析信息，为我创建一个视频解说脚本。

视频摘要:
${summary}

关键时刻:
${keyMomentsText}

情感标记:
${emotionsText}

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

// AI模型服务
export const aiService = {
  // 文心一言API调用
  wenxinGenerateScript: async (apiKey: string, analysis: any, options?: any): Promise<string> => {
    try {
      const prompt = getScriptPrompt(analysis, options);
      
      const response = await axios.post<WenxinResponse>(
        'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=' + apiKey,
        {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.result;
    } catch (error: any) {
      console.error('文心一言API调用失败:', error);
      throw new AIServiceError(
        error.response?.data?.error_msg || '文心一言API调用失败',
        error.response?.status
      );
    }
  },
  
  // 通义千问API调用
  qianwenGenerateScript: async (apiKey: string, analysis: any, options?: any): Promise<string> => {
    try {
      const prompt = getScriptPrompt(analysis, options);
      
      const response = await axios.post<QianwenResponse>(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
          model: 'qwen3.5-plus',
          input: {
            prompt
          },
          parameters: {}
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.output.text;
    } catch (error: any) {
      console.error('通义千问API调用失败:', error);
      throw new AIServiceError(
        error.response?.data?.message || '通义千问API调用失败',
        error.response?.status
      );
    }
  },
  
  // 讯飞星火API调用
  sparkGenerateScript: async (apiKey: string, analysis: any, options?: any): Promise<string> => {
    try {
      const prompt = getScriptPrompt(analysis, options);
      
      const response = await axios.post<SparkResponse>(
        'https://spark-api.xf-yun.com/v2.1/chat',
        {
          header: {
            app_id: options?.appId || '',
            uid: 'ClipFlow_user'
          },
          parameter: {
            chat: {
              domain: 'general',
              temperature: 0.7,
              max_tokens: 4096
            }
          },
          payload: {
            message: {
              text: [
                { role: 'user', content: prompt }
              ]
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      if (response.data.header.code !== 0) {
        throw new AIServiceError(`讯飞星火API错误: ${response.data.header.message}`);
      }
      
      return response.data.payload.choices[0].text;
    } catch (error: any) {
      console.error('讯飞星火API调用失败:', error);
      throw new AIServiceError(
        error.response?.data?.header?.message || '讯飞星火API调用失败',
        error.response?.status
      );
    }
  },
  
  // 智谱清言API调用
  chatglmGenerateScript: async (apiKey: string, analysis: any, options?: any): Promise<string> => {
    try {
      const prompt = getScriptPrompt(analysis, options);
      
      const response = await axios.post<ChatGLMResponse>(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4096
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      return response.data.choices[0].content;
    } catch (error: any) {
      console.error('智谱清言API调用失败:', error);
      throw new AIServiceError(
        error.response?.data?.error?.message || '智谱清言API调用失败',
        error.response?.status
      );
    }
  },
  
  // 豆包API调用
  doubaoGenerateScript: async (apiKey: string, analysis: any, options?: any): Promise<string> => {
    try {
      const prompt = getScriptPrompt(analysis, options);
      
      const response = await axios.post<DoubaoResponse>(
        'https://api.doubao.com/v1/chat/completions',
        {
          model: 'doubao-pro',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4096
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      return response.data.output.text;
    } catch (error: any) {
      console.error('字节豆包API调用失败:', error);
      throw new AIServiceError(
        error.response?.data?.error?.message || '字节豆包API调用失败',
        error.response?.status
      );
    }
  },
  
  // DeepSeek API调用
  deepseekGenerateScript: async (apiKey: string, analysis: any, options?: any): Promise<string> => {
    try {
      const prompt = getScriptPrompt(analysis, options);
      
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      if (!response.data.choices || !response.data.choices.length) {
        throw new AIServiceError('DeepSeek API返回的数据格式不正确');
      }
      
      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('DeepSeek API调用失败:', error);
      throw new AIServiceError(
        error.response?.data?.error?.message || 'DeepSeek API调用失败',
        error.response?.status
      );
    }
  },
  
  // 统一调用接口
  generateScript: async (modelType: AIModelType, apiKey: string, analysis: any, options?: any): Promise<string> => {
    switch (modelType) {
      case 'wenxin':
        return aiService.wenxinGenerateScript(apiKey, analysis, options);
      case 'qianwen':
        return aiService.qianwenGenerateScript(apiKey, analysis, options);
      case 'spark':
        return aiService.sparkGenerateScript(apiKey, analysis, options);
      case 'chatglm':
        return aiService.chatglmGenerateScript(apiKey, analysis, options);
      case 'doubao':
        return aiService.doubaoGenerateScript(apiKey, analysis, options);
      case 'deepseek':
        return aiService.deepseekGenerateScript(apiKey, analysis, options);
      default:
        throw new AIServiceError(`不支持的模型类型: ${modelType}`);
    }
  },
  
  // 构建提示词方法
  buildPrompt: (analysis: any, options: any = {}): string => {
    const { title, duration, keyMoments, emotions, summary } = analysis;
    
    // 基本视频信息
    let prompt = `
请为以下视频编写一段高质量的解说脚本:

标题: ${title}
时长: ${duration}秒 (约${Math.round(duration / 60)}分钟)
视频概述: ${summary}

关键时刻:
`;

    // 添加关键时刻
    if (keyMoments && keyMoments.length > 0) {
      keyMoments.forEach((moment: any) => {
        prompt += `[${formatTimestamp(moment.timestamp)}] ${moment.description}\n`;
      });
    }

    // 添加情感变化
    if (emotions && emotions.length > 0) {
      prompt += `\n情感变化:\n`;
      emotions.forEach((emotion: any) => {
        prompt += `[${formatTimestamp(emotion.timestamp)}] ${emotion.type} (强度: ${emotion.intensity.toFixed(1)})\n`;
      });
    }

    // 添加脚本要求
    prompt += `
请根据以上信息，生成一个完整的视频解说脚本。脚本应包括以下特点:
1. 引人入胜的开场白，吸引观众注意
2. 按时间顺序涵盖所有关键时刻
3. 适当的情感表达
4. 流畅的叙事结构
5. 清晰的总结收尾

脚本格式要求:
- 每个段落应包含时间戳，内容和类型
- 时间戳格式: [MM:SS]
- 类型分为: 旁白、对话或描述
`;

    // 添加选项中的额外要求
    if (options.tone) {
      prompt += `\n请使用${options.tone}的语气。`;
    }
    
    if (options.style) {
      prompt += `\n脚本风格应该是${options.style}。`;
    }
    
    if (options.targetAudience) {
      prompt += `\n目标受众是${options.targetAudience}。`;
    }

    return prompt;
  },

  // 解析脚本内容为结构化数据
  parseScriptContent: (scriptText: string): ScriptSegment[] => {
    const lines = scriptText.split('\n');
    const segments: ScriptSegment[] = [];
    
    // 正则表达式匹配时间戳 [MM:SS] 或 [HH:MM:SS]
    const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/;
    
    let currentContent = '';
    let currentStartTime = 0;
    let currentEndTime = 0;
    let currentType: "narration" | "dialogue" | "description" = "narration";
    let hasCurrentSegment = false;
    
    const saveCurrentSegment = () => {
      if (hasCurrentSegment && currentContent) {
        segments.push({
          id: uuidv4(),
          startTime: currentStartTime,
          endTime: currentEndTime,
          content: currentContent,
          type: currentType
        });
        
        currentContent = '';
        hasCurrentSegment = false;
      }
    };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // 检查是否有时间戳
      const timestampMatch = trimmedLine.match(timestampRegex);
      
      if (timestampMatch) {
        // 保存之前的段落
        saveCurrentSegment();
        
        // 解析时间戳
        const minutes = parseInt(timestampMatch[1], 10);
        const seconds = parseInt(timestampMatch[2], 10);
        const hours = timestampMatch[3] ? parseInt(timestampMatch[3], 10) : 0;
        
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // 提取内容
        const content = trimmedLine.replace(timestampRegex, '').trim();
        
        // 设置新段落信息
        currentStartTime = totalSeconds;
        currentEndTime = totalSeconds + 10; // 默认持续10秒
        currentContent = content;
        hasCurrentSegment = true;
        
        // 确定类型
        if (content.includes('旁白') || content.toLowerCase().includes('narration')) {
          currentType = 'narration';
        } else if (content.includes('对话') || content.toLowerCase().includes('dialogue')) {
          currentType = 'dialogue';
        } else if (content.includes('描述') || content.toLowerCase().includes('description')) {
          currentType = 'description';
        } else {
          currentType = 'narration'; // 默认为旁白
        }
      } else if (hasCurrentSegment) {
        // 继续追加内容到当前段落
        currentContent += ' ' + trimmedLine;
        
        // 增加结束时间
        currentEndTime += 2; // 每行文本增加2秒
      }
    }
    
    // 保存最后一个段落
    saveCurrentSegment();
    
    return segments;
  }
};

// 根据AI模型类型调用对应的API生成脚本
export const generateScriptWithModel = async (
  modelType: AIModelType,
  apiKey: string,
  analysis: any,
  options?: any
): Promise<string> => {
  switch (modelType) {
    case 'wenxin':
      return aiService.wenxinGenerateScript(apiKey, analysis, options);
    case 'qianwen':
      return aiService.qianwenGenerateScript(apiKey, analysis, options);
    case 'spark':
      return aiService.sparkGenerateScript(apiKey, analysis, options);
    case 'chatglm':
      return aiService.chatglmGenerateScript(apiKey, analysis, options);
    case 'doubao':
      return aiService.doubaoGenerateScript(apiKey, analysis, options);
    case 'deepseek':
      return aiService.deepseekGenerateScript(apiKey, analysis, options);
    default:
      throw new AIServiceError(`不支持的AI模型类型: ${modelType}`);
  }
};

// 根据生成的脚本文本解析为结构化数据
export const parseGeneratedScript = (content: string, projectId: string): Script => {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const segments: ScriptSegment[] = [];
  const scriptId = uuidv4();
  
  // 匹配时间戳的正则表达式
  const timeRegex = /\[(\d{1,2}):(\d{2})\]/;
  let currentSegment: Partial<ScriptSegment> = {};
  let currentContent = '';
  
  for (const line of lines) {
    const timeMatch = line.match(timeRegex);
    
    if (timeMatch) {
      // 如果已有一个处理中的片段，保存它
      if (currentContent.trim()) {
        segments.push({
          id: uuidv4(),
          startTime: currentSegment.startTime || 0,
          endTime: currentSegment.endTime || 0,
          content: currentContent.trim(),
          type: 'narration'
        });
      }
      
      // 解析时间戳
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      const startTime = minutes * 60 + seconds;
      
      // 设置下一个片段的起始时间
      currentSegment = {
        startTime,
        // 暂时将结束时间设为开始时间+10秒，后续会调整
        endTime: startTime + 10
      };
      
      // 提取时间戳后的内容
      currentContent = line.replace(timeRegex, '').trim();
    } else if (currentSegment.startTime !== undefined) {
      // 添加内容到当前片段
      currentContent += ' ' + line.trim();
    }
  }
  
  // 处理最后一个片段
  if (currentContent.trim() && currentSegment.startTime !== undefined) {
    segments.push({
      id: uuidv4(),
      startTime: currentSegment.startTime || 0,
      endTime: currentSegment.endTime || 0,
      content: currentContent.trim(),
      type: 'narration'
    });
  }
  
  // 调整所有片段的结束时间
  for (let i = 0; i < segments.length - 1; i++) {
    segments[i].endTime = segments[i + 1].startTime;
  }
  
  return {
    id: scriptId,
    projectId,
    content: segments,
    fullText: segments.map(s => s.content).join('\n\n'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export default aiService;

/**
 * AI响应接口
 */
interface AIResponse {
  text: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * 使用AI生成脚本
 * @param videoMetadata 视频元数据
 * @param keyFramesDescriptions 关键帧描述数组
 * @param preferences 生成偏好设置
 * @returns 生成的脚本内容
 */
export const generateScriptWithAI = async (
  videoMetadata: VideoMetadata,
  keyFramesDescriptions: string[],
  preferences: {
    style?: string; // 剧本风格：幽默、严肃、感人等
    tone?: string;  // 语气：正式、随意、生动等
    length?: 'short' | 'medium' | 'long'; // 长度：短、中、长
    purpose?: string; // 目的：教育、营销、娱乐等
    targetAudience?: string; // 目标受众：儿童、成人、专业人士等
    additionalRequirements?: string; // 其他要求
  }
): Promise<string> => {
  try {
    // 获取API密钥
    const apiKey = await getApiKey('openai');
    if (!apiKey) {
      message.error('未配置OpenAI API密钥，请先在设置中配置');
      throw new Error('未配置API密钥');
    }

    console.log('开始生成脚本...');
    
    // 构建提示词
    const prompt = constructPrompt(videoMetadata, keyFramesDescriptions, preferences);
    
    // 调用OpenAI API
    const response = await callOpenAI(prompt, apiKey);
    
    console.log('脚本生成完成');
    return response.text;
  } catch (error) {
    console.error('脚本生成失败:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
      
    let friendlyMessage = '脚本生成失败';
    if (errorMessage.includes('API密钥')) {
      friendlyMessage = '请检查API密钥是否正确';
    } else if (errorMessage.includes('网络')) {
      friendlyMessage = '网络连接失败，请检查网络设置';
    }
    
    message.error(friendlyMessage);
    throw new Error(friendlyMessage);
  }
};

/**
 * 构建AI提示词
 */
function constructPrompt(
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
): string {
  // 组装关键帧描述
  const framesDescription = keyFramesDescriptions
    .map((desc, index) => `关键帧${index + 1}: ${desc}`)
    .join('\n');
  
  // 脚本长度指南
  const lengthGuide = {
    short: '短剧本(1-2分钟)',
    medium: '中等长度剧本(2-5分钟)',
    long: '长剧本(5-10分钟)'
  }[preferences.length || 'medium'];
  
  // 构建提示词
  const prompt = `
请为以下视频内容创建一个引人入胜的短剧本:

视频信息:
- 时长: ${videoMetadata.duration}秒
- 分辨率: ${videoMetadata.width}x${videoMetadata.height}
- 帧率: ${videoMetadata.fps}fps

关键视觉内容:
${framesDescription}

生成要求:
- 风格: ${preferences.style || '自然流畅'}
- 语气: ${preferences.tone || '专业'}
- 长度: ${lengthGuide}
- 目的: ${preferences.purpose || '内容展示'}
- 目标受众: ${preferences.targetAudience || '普通观众'}
${preferences.additionalRequirements ? `- 额外要求: ${preferences.additionalRequirements}` : ''}

请生成一个按时间轴组织的剧本，每个片段包含开始时间、结束时间和对应的文本内容。
剧本应该与视频内容高度契合，并确保整体叙事连贯、有吸引力。
`;

  return prompt;
}

/**
 * 调用OpenAI API
 */
async function callOpenAI(prompt: string, apiKey: string): Promise<AIResponse> {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的视频脚本撰写助手，善于根据视频内容创作引人入胜的短视频脚本。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API请求失败: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      text: data.choices[0].message.content,
      usage: data.usage
    };
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    throw error;
  }
}

/**
 * 使用AI分析关键帧内容
 * @param framePaths 关键帧图片路径数组
 * @returns 关键帧描述数组
 */
export const analyzeKeyFramesWithAI = async (
  framePaths: string[]
): Promise<string[]> => {
  try {
    console.log('正在分析关键帧内容:', framePaths);
    
    // 模拟关键帧分析
    // 在实际应用中，这里应该使用 AI 模型分析图片内容
    const descriptions = framePaths.map((_, index) => {
      return `关键帧 ${index + 1} 中的场景描述`;
    });
    
    console.log('关键帧分析结果:', descriptions);
    return descriptions;
  } catch (error) {
    console.error('分析关键帧内容失败:', error);
    message.error('分析关键帧内容失败，将使用默认描述');
    
    // 返回默认描述
    return framePaths.map((_, index) => `关键帧 ${index + 1}`);
  }
};

/**
 * 使用AI优化脚本
 * @param originalScript 原始脚本内容
 * @param instructions 优化指令
 * @returns 优化后的脚本内容
 */
export const improveScriptWithAI = async (
  originalScript: string,
  instructions: string
): Promise<string> => {
  try {
    // 获取API密钥
    const apiKey = await getApiKey('openai');
    if (!apiKey) {
      message.error('未配置OpenAI API密钥，请先在设置中配置');
      throw new Error('未配置API密钥');
    }

    console.log('开始优化脚本...');
    
    // 构建提示词
    const prompt = `
请根据以下指示优化视频脚本:

原始脚本:
${originalScript}

优化指示:
${instructions}

请保持原始脚本的时间轴格式和整体结构，同时根据上述指示进行改进。
`;
    
    // 调用OpenAI API
    const response = await callOpenAI(prompt, apiKey);
    
    console.log('脚本优化完成');
    return response.text;
  } catch (error) {
    console.error('脚本优化失败:', error);
    message.error('脚本优化失败，请稍后再试');
    throw new Error('脚本优化失败');
  }
}; 