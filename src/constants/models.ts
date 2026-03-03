/**
 * 模型配置 - 2026年3月最新
 * 支持 AI 模型列表及配置信息
 */

export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'iflytek'
  | 'alibaba'
  | 'zhipu'
  | 'moonshot'
  | 'deepseek';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  maxTokens: number;
  icon?: string;
}

export const AI_MODELS: AIModel[] = [
  // OpenAI - 2026年3月
  {
    id: 'gpt-5.3',
    name: 'GPT-5.3',
    provider: 'openai',
    description: 'OpenAI 最新旗舰多模态模型',
    maxTokens: 200000,
  },
  // Anthropic - 2026年3月
  {
    id: 'claude-4.6',
    name: 'Claude 4.6 Opus',
    provider: 'anthropic',
    description: 'Anthropic 最强模型',
    maxTokens: 300000,
  },
  // Google - 2026年3月
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    description: 'Google 先进多模态模型',
    maxTokens: 1000000,
  },
  // 阿里云 - 2026年3月
  {
    id: 'qwen-3.5',
    name: '通义千问 3.5',
    provider: 'alibaba',
    description: '阿里云旗舰模型',
    maxTokens: 32000,
  },
  // 讯飞 - 2026年3月
  {
    id: 'spark-x1',
    name: '讯飞星火 X1',
    provider: 'iflytek',
    description: '讯飞最强模型',
    maxTokens: 14000,
  },
  // 智谱 - 2026年3月
  {
    id: 'glm-5',
    name: '智谱 GLM-5',
    provider: 'zhipu',
    description: '智谱最新旗舰模型',
    maxTokens: 200000,
  },
  // DeepSeek - 2026年3月
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    description: 'DeepSeek 最新旗舰推理模型',
    maxTokens: 64000,
  },
  // 月之暗面 (Kimi)
  {
    id: 'kimi-k2.5',
    name: 'Kimi k2.5',
    provider: 'moonshot',
    description: '月之暗面最新模型',
    maxTokens: 48000,
  },
];

export const PROVIDER_NAMES: Record<ModelProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  iflytek: '讯飞',
  alibaba: '阿里云',
  zhipu: '智谱',
  moonshot: '月之暗面',
  deepseek: 'DeepSeek',
};

export const PROVIDER_ICONS: Record<ModelProvider, string> = {
  openai: '🤖',
  anthropic: '🧠',
  google: '🔵',
  iflytek: '🟢',
  alibaba: '🟠',
  zhipu: '⚪',
  moonshot: '🌙',
  deepseek: '🔮',
};
