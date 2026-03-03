export interface VideoAnalysis {
  id: string;
  title: string;
  duration: number;
  keyMoments: KeyMoment[];
  emotions: Emotion[];
  summary: string;
}

export interface KeyMoment {
  timestamp: number;
  description: string;
  importance: number;
}

export interface Emotion {
  timestamp: number;
  type: string;
  intensity: number;
}

export interface Script {
  id: string;
  videoId: string;
  content: ScriptSegment[];
  createdAt: string;
  updatedAt: string;
  modelUsed?: string;
}

export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  type: 'narration' | 'dialogue' | 'description';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  videoPath?: string;
  outputDir?: string;
  metadata?: any;
  analysis?: VideoAnalysis;
  scripts: Script[];
  createdAt: string;
  updatedAt: string;
  aiModel?: AIModelConfig;
}

// 重命名以避免与 core/types 中的 AIModel 冲突
export interface AIModelConfig {
  key: string;
  name: string;
  provider: string;
  apiKey?: string;
}

// AI 模型信息（用于 UI 展示）
export interface AIModelInfo {
  name: string;
  provider: string;
  description: string;
  icon: string;
  apiKeyFormat: string;
}

// AI 模型设置
export interface AIModelSettings {
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
  apiVersion?: string;
}

// AI 模型类型 - 2026年3月最新
export type AIModelType = 'openai' | 'anthropic' | 'google' | 'alibaba' | 'zhipu' | 'iflytek' | 'deepseek' | 'moonshot';

// 用于 Project.aiModel 的 AI_MODEL_INFO
export const AI_MODEL_INFO: Record<AIModelType, AIModelConfig> = {
  openai: {
    key: 'openai',
    name: 'OpenAI',
    provider: 'OpenAI'
  },
  anthropic: {
    key: 'anthropic',
    name: 'Anthropic',
    provider: 'Anthropic'
  },
  google: {
    key: 'google',
    name: 'Google',
    provider: 'Google'
  },
  alibaba: {
    key: 'alibaba',
    name: '通义千问',
    provider: '阿里云'
  },
  zhipu: {
    key: 'zhipu',
    name: '智谱GLM',
    provider: '智谱AI'
  },
  iflytek: {
    key: 'iflytek',
    name: '讯飞星火',
    provider: '科大讯飞'
  },
  deepseek: {
    key: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek'
  },
  moonshot: {
    key: 'moonshot',
    name: 'Kimi',
    provider: '月之暗面'
  }
};

// 用于 UI 展示的 AI_MODEL_INFO（包含更多字段）
export const AI_MODEL_INFO_UI: Record<AIModelType, AIModelInfo> = {
  openai: {
    name: 'OpenAI',
    provider: 'OpenAI',
    description: 'OpenAI 最新旗舰多模态模型 GPT-5.3，支持视频分析',
    icon: 'OpenAIIcon',
    apiKeyFormat: 'sk-...'
  },
  anthropic: {
    name: 'Claude',
    provider: 'Anthropic',
    description: 'Anthropic 最强旗舰模型 Claude 4.6 Opus，支持长文本处理',
    icon: 'ClaudeIcon',
    apiKeyFormat: 'sk-ant-...'
  },
  google: {
    name: 'Gemini',
    provider: 'Google',
    description: 'Google 最强多模态模型 Gemini 3 Ultra，支持音视频理解',
    icon: 'GeminiIcon',
    apiKeyFormat: 'AIza...'
  },
  alibaba: {
    name: '通义千问',
    provider: '阿里云',
    description: '阿里云最新旗舰模型 Qwen 3.5，支持中文优化和多模态',
    icon: 'QwenIcon',
    apiKeyFormat: 'sk-...'
  },
  zhipu: {
    name: '智谱GLM',
    provider: '智谱AI',
    description: '智谱最新旗舰模型 GLM-5，支持长文本和多模态',
    icon: 'GLMIcon',
    apiKeyFormat: '...'
  },
  iflytek: {
    name: '讯飞星火',
    provider: '科大讯飞',
    description: '讯飞最新最强模型 Spark X1，支持中文优化',
    icon: 'SparkIcon',
    apiKeyFormat: 'APPID:API_KEY:API_SECRET'
  },
  deepseek: {
    name: 'DeepSeek',
    provider: 'DeepSeek',
    description: 'DeepSeek 最新旗舰推理模型 R1，支持高性能推理',
    icon: 'DeepSeekIcon',
    apiKeyFormat: 'sk-...'
  },
  moonshot: {
    name: 'Kimi',
    provider: '月之暗面',
    description: '月之暗面最新模型 Kimi k2.5，支持长文本处理',
    icon: 'KimiIcon',
    apiKeyFormat: '...'
  }
};

/**
 * 脚本生成选项
 */
export interface ScriptGenerationOptions {
  style?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  purpose?: string;
}

/**
 * 存储的应用设置
 */
export interface AppSettings {
  autoSave: boolean;
  defaultAIModel?: AIModelType;
  aiModelsSettings: Partial<Record<AIModelType, AIModelSettings>>;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * 项目数据（简化版）
 */
export interface ProjectData {
  id: string;
  name: string;
  description: string;
  videoPath: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  keyFrames?: string[];
  script?: any[];
} 