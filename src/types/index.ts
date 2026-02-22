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

export type AIModelType = 'wenxin' | 'qianwen' | 'spark' | 'chatglm' | 'doubao' | 'deepseek' | 'minimax';

// 用于 Project.aiModel 的 AI_MODEL_INFO
export const AI_MODEL_INFO: Record<AIModelType, AIModelConfig> = {
  wenxin: {
    key: 'wenxin',
    name: '文心一言',
    provider: '百度'
  },
  qianwen: {
    key: 'qianwen',
    name: '通义千问',
    provider: '阿里'
  },
  spark: {
    key: 'spark',
    name: '讯飞星火',
    provider: '科大讯飞'
  },
  chatglm: {
    key: 'chatglm',
    name: '智谱清言',
    provider: '智谱AI'
  },
  doubao: {
    key: 'doubao',
    name: '字节豆包',
    provider: '字节跳动'
  },
  deepseek: {
    key: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek'
  },
  minimax: {
    key: 'minimax',
    name: 'MiniMax',
    provider: 'SenseTouch'
  }
};

// 用于 UI 展示的 AI_MODEL_INFO（包含更多字段）
export const AI_MODEL_INFO_UI: Record<AIModelType, AIModelInfo> = {
  wenxin: {
    name: '文心一言',
    provider: '百度',
    description: '百度文心大模型，有丰富的中文理解能力。',
    icon: 'WenxinIcon',
    apiKeyFormat: 'API_KEY:SECRET_KEY'
  },
  qianwen: {
    name: '通义千问',
    provider: '阿里云',
    description: '阿里云推出的创新大模型，拥有强大的文本处理能力。',
    icon: 'QianwenIcon',
    apiKeyFormat: 'API_KEY'
  },
  spark: {
    name: '讯飞星火',
    provider: '科大讯飞',
    description: '科大讯飞的认知大模型，支持多种语言理解和生成任务。',
    icon: 'SparkIcon',
    apiKeyFormat: 'APPID:API_KEY:API_SECRET'
  },
  chatglm: {
    name: 'ChatGLM',
    provider: '智谱AI',
    description: '智谱AI推出的开源双语对话模型，支持中英文的对话生成。',
    icon: 'ChatGLMIcon',
    apiKeyFormat: 'API_KEY'
  },
  doubao: {
    name: '豆包',
    provider: '字节跳动',
    description: '字节跳动推出的AI助手，拥有优秀的文本创作和理解能力。',
    icon: 'DoubaoIcon',
    apiKeyFormat: 'API_KEY'
  },
  deepseek: {
    name: 'DeepSeek',
    provider: 'DeepSeek',
    description: '深度搜索推出的大语言模型，拥有强大的创作与思考能力。',
    icon: 'DeepSeekIcon',
    apiKeyFormat: 'API_KEY'
  },
  minimax: {
    name: 'MiniMax',
    provider: 'SenseTouch',
    description: 'MiniMax出品的多模态通用大模型，包括文本、语音及音乐等丰富能力。',
    icon: 'MiniMaxIcon',
    apiKeyFormat: 'API_KEY'
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