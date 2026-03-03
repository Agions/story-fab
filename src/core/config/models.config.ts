/**
 * AI 模型配置中心
 * 集中管理所有 AI 模型配置，禁止硬编码
 */

import type { AIModel, ModelProvider, ModelCategory } from '@/core/types';

// 模型提供商配置
export const MODEL_PROVIDERS: Record<
  ModelProvider,
  {
    name: string;
    icon: string;
    website: string;
    apiDocs: string;
    keyFormat: string;
    keyPlaceholder: string;
  }
> = {
  openai: {
    name: 'OpenAI',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    website: 'https://openai.com',
    apiDocs: 'https://platform.openai.com/docs',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
  },
  anthropic: {
    name: 'Anthropic',
    icon: 'https://www.anthropic.com/images/icons/apple-touch-icon.png',
    website: 'https://anthropic.com',
    apiDocs: 'https://docs.anthropic.com',
    keyFormat: 'sk-ant-...',
    keyPlaceholder: 'sk-ant-xxxxxxxxxxxxxxxx',
  },
  google: {
    name: 'Google',
    icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    website: 'https://ai.google.dev',
    apiDocs: 'https://ai.google.dev/docs',
    keyFormat: 'AIza...',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxx',
  },
  alibaba: {
    name: '阿里云',
    icon: 'https://img.alicdn.com/tfs/TB1Ly5oS3HqK1RjSZFPXXcwapXa-238-54.png',
    website: 'https://dashscope.aliyun.com',
    apiDocs: 'https://help.aliyun.com/dashscope',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx',
  },
  zhipu: {
    name: '智谱AI',
    icon: 'https://www.zhipuai.cn/favicon.ico',
    website: 'https://open.bigmodel.cn',
    apiDocs: 'https://open.bigmodel.cn/dev/howuse/glm-4',
    keyFormat: '...',
    keyPlaceholder: 'xxxxxxxx.xxxxxxxx',
  },
  iflytek: {
    name: '科大讯飞',
    icon: 'https://xinghuo.xfyun.cn/favicon.ico',
    website: 'https://xinghuo.xfyun.cn',
    apiDocs: 'https://www.xfyun.cn/doc/spark/Web.html',
    keyFormat: 'APPID:API_KEY:API_SECRET',
    keyPlaceholder: '请输入 APPID、API_KEY 和 API_SECRET',
  },
  deepseek: {
    name: 'DeepSeek',
    icon: 'https://www.deepseek.com/favicon.ico',
    website: 'https://www.deepseek.com',
    apiDocs: 'https://platform.deepseek.com/docs',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
  },
  moonshot: {
    name: '月之暗面',
    icon: 'https://kimi.moonshot.cn/favicon.ico',
    website: 'https://kimi.moonshot.cn',
    apiDocs: 'https://platform.moonshot.cn/docs',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
  },
};

// 模型列表配置 - 2026年3月最新（每个厂商保留最新旗舰模型）
export const AI_MODELS: AIModel[] = [
  // OpenAI 模型 - 2026年3月
  {
    id: 'gpt-5.3',
    name: 'GPT-5.3',
    provider: 'openai',
    category: ['text', 'code', 'image', 'video'],
    description: 'OpenAI 最新旗舰多模态模型，支持视频分析',
    features: ['视频理解', '高级推理', '代码生成', '实时联网'],
    tokenLimit: 200000,
    isPro: true,
    contextWindow: 200000,
    pricing: { input: 0.007, output: 0.021, unit: '1K tokens' },
  },
  // Anthropic 模型 - 2026年3月
  {
    id: 'claude-4.6',
    name: 'Claude 4.6 Opus',
    provider: 'anthropic',
    category: ['text', 'code', 'image'],
    description: 'Anthropic 最强旗舰模型',
    features: ['深度分析', '视觉理解', '长文本处理', '超长上下文'],
    tokenLimit: 300000,
    isPro: true,
    contextWindow: 300000,
    pricing: { input: 0.018, output: 0.09, unit: '1K tokens' },
  },
  // Google 模型 - 2026年3月
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    category: ['text', 'code', 'image', 'video'],
    description: 'Google 先进多模态模型',
    features: ['多模态分析', '视频理解', '长文本处理'],
    tokenLimit: 1000000,
    isPro: true,
    contextWindow: 1000000,
    pricing: { input: 0.0035, output: 0.0105, unit: '1K tokens' },
  },
  // 阿里模型
  {
    id: 'qwen-3.5',
    name: 'Qwen 3.5',
    provider: 'alibaba',
    category: ['text', 'code', 'image', 'video'],
    description: '通义千问最新旗舰模型',
    features: ['中文优化', '多模态', '长文本', '视频理解'],
    tokenLimit: 32000,
    isPro: true,
    contextWindow: 32000,
    pricing: { input: 0.004, output: 0.012, unit: '1K tokens' },
  },
  // 智谱模型
  {
    id: 'glm-5',
    name: 'GLM-5',
    provider: 'zhipu',
    category: ['text', 'code', 'image', 'video'],
    description: '智谱最新旗舰模型',
    features: ['中文理解', '代码生成', '多模态'],
    tokenLimit: 200000,
    isPro: true,
    contextWindow: 200000,
    pricing: { input: 0.001, output: 0.003, unit: '1K tokens' },
  },
  // 讯飞模型
  {
    id: 'spark-x1',
    name: 'Spark X1',
    provider: 'iflytek',
    category: ['text', 'code', 'audio'],
    description: '讯飞最新最强模型',
    features: ['中文优化', '多轮对话', '语音理解'],
    tokenLimit: 14000,
    isPro: true,
    contextWindow: 14000,
    pricing: { input: 0.003, output: 0.009, unit: '1K tokens' },
  },
  // DeepSeek - 2026年3月
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    category: ['text', 'code', 'image'],
    description: 'DeepSeek 最新旗舰推理模型',
    features: ['高性能推理', '代码生成', '长上下文'],
    tokenLimit: 64000,
    isPro: true,
    contextWindow: 64000,
    pricing: { input: 0.002, output: 0.006, unit: '1K tokens' },
  },
  // Kimi (月之暗面)
  {
    id: 'kimi-k2.5',
    name: 'Kimi k2.5',
    provider: 'moonshot',
    category: ['text', 'code', 'image'],
    description: 'Kimi 最新模型',
    features: ['长文本处理', '中文优化', '多模态'],
    tokenLimit: 48000,
    isPro: true,
    contextWindow: 48000,
    pricing: { input: 0.003, output: 0.009, unit: '1K tokens' },
  },
];

// 模型推荐配置 - 2026年3月
export const MODEL_RECOMMENDATIONS: Record<string, string[]> = {
  script: ['gpt-5.3', 'claude-4.6', 'qwen-3.5', 'gemini-3.1-pro'],
  analysis: ['gemini-3.1-pro', 'gpt-5.3', 'qwen-3.5'],
  code: ['claude-4.6', 'deepseek-r1', 'glm-5'],
  fast: ['qwen-3.5', 'glm-5', 'deepseek-r1'],
};

// 获取模型配置
export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

// 获取提供商模型
export const getModelsByProvider = (provider: ModelProvider): AIModel[] => {
  return AI_MODELS.filter(model => model.provider === provider);
};

// 获取分类模型
export const getModelsByCategory = (category: ModelCategory): AIModel[] => {
  return AI_MODELS.filter(model => model.category.includes(category));
};

// 获取推荐模型
export const getRecommendedModels = (task: keyof typeof MODEL_RECOMMENDATIONS): AIModel[] => {
  const modelIds = MODEL_RECOMMENDATIONS[task] || [];
  return modelIds.map(id => getModelById(id)).filter(Boolean) as AIModel[];
};
