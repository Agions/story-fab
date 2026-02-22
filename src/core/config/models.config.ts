/**
 * AI 模型配置中心
 * 集中管理所有 AI 模型配置，禁止硬编码
 */

import type { AIModel, ModelProvider, ModelCategory } from '@/core/types';

// 模型提供商配置
export const MODEL_PROVIDERS: Record<ModelProvider, {
  name: string;
  icon: string;
  website: string;
  apiDocs: string;
  keyFormat: string;
  keyPlaceholder: string;
}> = {
  openai: {
    name: 'OpenAI',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    website: 'https://openai.com',
    apiDocs: 'https://platform.openai.com/docs',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
  },
  anthropic: {
    name: 'Anthropic',
    icon: 'https://www.anthropic.com/images/icons/apple-touch-icon.png',
    website: 'https://anthropic.com',
    apiDocs: 'https://docs.anthropic.com',
    keyFormat: 'sk-ant-...',
    keyPlaceholder: 'sk-ant-xxxxxxxxxxxxxxxx'
  },
  google: {
    name: 'Google',
    icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    website: 'https://ai.google.dev',
    apiDocs: 'https://ai.google.dev/docs',
    keyFormat: 'AIza...',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxx'
  },
  baidu: {
    name: '百度',
    icon: 'https://nlp-eb.cdn.bcebos.com/logo/ernie-bot.png',
    website: 'https://qianfan.baidu.com',
    apiDocs: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html',
    keyFormat: 'API_KEY:SECRET_KEY',
    keyPlaceholder: '请输入 API_KEY 和 SECRET_KEY'
  },
  alibaba: {
    name: '阿里云',
    icon: 'https://img.alicdn.com/tfs/TB1Ly5oS3HqK1RjSZFPXXcwapXa-238-54.png',
    website: 'https://dashscope.aliyun.com',
    apiDocs: 'https://help.aliyun.com/dashscope',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx'
  },
  zhipu: {
    name: '智谱AI',
    icon: 'https://www.zhipuai.cn/favicon.ico',
    website: 'https://open.bigmodel.cn',
    apiDocs: 'https://open.bigmodel.cn/dev/howuse/glm-4',
    keyFormat: '...',
    keyPlaceholder: 'xxxxxxxx.xxxxxxxx'
  },
  iflytek: {
    name: '科大讯飞',
    icon: 'https://xinghuo.xfyun.cn/favicon.ico',
    website: 'https://xinghuo.xfyun.cn',
    apiDocs: 'https://www.xfyun.cn/doc/spark/Web.html',
    keyFormat: 'APPID:API_KEY:API_SECRET',
    keyPlaceholder: '请输入 APPID、API_KEY 和 API_SECRET'
  },
  tencent: {
    name: '腾讯云',
    icon: 'https://cloud.tencent.com/favicon.ico',
    website: 'https://cloud.tencent.com/product/hunyuan',
    apiDocs: 'https://cloud.tencent.com/document/product/1729',
    keyFormat: 'SecretId:SecretKey',
    keyPlaceholder: '请输入 SecretId 和 SecretKey'
  }
};

// 模型列表配置
export const AI_MODELS: AIModel[] = [
  // OpenAI 模型
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    category: ['text', 'code', 'image'],
    description: '最强大的多模态大模型，支持文本、代码和图像分析',
    features: ['视觉理解', '高级推理', '代码生成'],
    tokenLimit: 128000,
    isPro: true,
    contextWindow: 128000,
    pricing: { input: 0.005, output: 0.015, unit: '1K tokens' }
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    category: ['text', 'code', 'image'],
    description: '高性价比的多模态模型，适合日常任务',
    features: ['快速响应', '成本优化', '多模态'],
    tokenLimit: 128000,
    contextWindow: 128000,
    pricing: { input: 0.00015, output: 0.0006, unit: '1K tokens' }
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    category: ['text', 'code'],
    description: '性能均衡的大型语言模型',
    features: ['文本生成', '代码辅助', '快速响应'],
    tokenLimit: 16000,
    contextWindow: 16000,
    pricing: { input: 0.0005, output: 0.0015, unit: '1K tokens' }
  },
  // Anthropic 模型
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    category: ['text', 'code', 'image'],
    description: 'Anthropic 最强大的多模态模型',
    features: ['深度分析', '视觉理解', '长文本处理'],
    tokenLimit: 200000,
    isPro: true,
    contextWindow: 200000,
    pricing: { input: 0.015, output: 0.075, unit: '1K tokens' }
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    category: ['text', 'code', 'image'],
    description: '平衡性能与速度',
    features: ['创意写作', '精确回答', '图像分析'],
    tokenLimit: 200000,
    contextWindow: 200000,
    pricing: { input: 0.003, output: 0.015, unit: '1K tokens' }
  },
  // Google 模型
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'google',
    category: ['text', 'code', 'image', 'video'],
    description: 'Google 最先进的多模态模型，支持视频分析',
    features: ['多模态分析', '视频理解', '长文本处理'],
    tokenLimit: 1000000,
    isPro: true,
    contextWindow: 1000000,
    pricing: { input: 0.0035, output: 0.0105, unit: '1K tokens' }
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'google',
    category: ['text', 'code', 'image', 'video'],
    description: '快速高效的多模态模型',
    features: ['高速处理', '视频分析', '成本优化'],
    tokenLimit: 1000000,
    contextWindow: 1000000,
    pricing: { input: 0.00035, output: 0.00105, unit: '1K tokens' }
  },
  // 百度模型
  {
    id: 'ernie-4',
    name: 'ERNIE 5.5',
    provider: 'baidu',
    category: ['text', 'code'],
    description: '百度最新自然语言理解模型',
    features: ['中文优化', '知识图谱', '对话能力'],
    tokenLimit: 8000,
    contextWindow: 8000,
    pricing: { input: 0.004, output: 0.012, unit: '1K tokens' }
  },
  {
    id: 'ernie-speed',
    name: 'ERNIE Speed 5',
    provider: 'baidu',
    category: ['text'],
    description: '轻量级高速模型',
    features: ['快速响应', '成本优化'],
    tokenLimit: 8000,
    contextWindow: 8000,
    pricing: { input: 0.001, output: 0.003, unit: '1K tokens' }
  },
  // 阿里模型
  {
    id: 'qwen3.5-max',
    name: 'Qwen Max',
    provider: 'alibaba',
    category: ['text', 'code', 'image'],
    description: '通义千问最强模型',
    features: ['中文优化', '多模态', '长文本'],
    tokenLimit: 32000,
    isPro: true,
    contextWindow: 32000,
    pricing: { input: 0.004, output: 0.012, unit: '1K tokens' }
  },
  {
    id: 'qwen3.5-plus',
    name: 'Qwen Plus',
    provider: 'alibaba',
    category: ['text', 'code'],
    description: '高性价比模型',
    features: ['平衡性能', '中文优化'],
    tokenLimit: 32000,
    contextWindow: 32000,
    pricing: { input: 0.0008, output: 0.002, unit: '1K tokens' }
  },
  // 智谱模型
  {
    id: 'glm-5',
    name: 'GLM-5',
    provider: 'zhipu',
    category: ['text', 'code'],
    description: '智谱最新大模型',
    features: ['中文理解', '代码生成'],
    tokenLimit: 128000,
    contextWindow: 128000,
    pricing: { input: 0.001, output: 0.003, unit: '1K tokens' }
  },
  // 讯飞模型
  {
    id: 'spark-v3.5',
    name: '讯飞星火 V3.5',
    provider: 'iflytek',
    category: ['text', 'code'],
    description: '科大讯飞认知大模型',
    features: ['中文优化', '多轮对话'],
    tokenLimit: 8000,
    contextWindow: 8000,
    pricing: { input: 0.002, output: 0.006, unit: '1K tokens' }
  },
  // 腾讯模型
  {
    id: 'hunyuan-pro',
    name: '腾讯混元 Pro',
    provider: 'tencent',
    category: ['text', 'code'],
    description: '腾讯混元大模型',
    features: ['中文优化', '多模态'],
    tokenLimit: 32000,
    contextWindow: 32000,
    pricing: { input: 0.003, output: 0.009, unit: '1K tokens' }
  }
];

// 模型推荐配置
export const MODEL_RECOMMENDATIONS: Record<string, string[]> = {
  script: ['gpt-5', 'claude-opus-4-6', 'qwen3.5-max', 'gemini-3-pro'],
  analysis: ['gemini-3-pro', 'gemini-3-flash', 'gpt-5', 'qwen3.5-max'],
  code: ['claude-sonnet-4-6', 'gpt-5-mini', 'qwen3.5-plus', 'glm-5'],
  fast: ['gpt-5-mini', 'gemini-3-flash', 'qwen3.5-plus', 'ernie-speed']
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
