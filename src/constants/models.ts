/**
 * 模型配置
 * 支持 AI 模型列表及配置信息
 */

export type ModelProvider = 
  | 'openai' | 'anthropic' | 'google' | 'baidu' 
  | 'iflytek' | 'alibaba' | 'tencent' | 'zhipu' 
  | 'moonshot' | 'deepseek' | 'minimax';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  maxTokens: number;
  icon?: string;
}

export const AI_MODELS: AIModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'OpenAI 最新多模态模型', maxTokens: 128000 },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'OpenAI 高性能模型', maxTokens: 128000 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'OpenAI 经济型模型', maxTokens: 16385 },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Anthropic 最强模型', maxTokens: 200000 },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', description: 'Anthropic 平衡型模型', maxTokens: 200000 },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', description: 'Google 多模态模型', maxTokens: 32760 },
  { id: 'ernie-4.0', name: '文心一言 4.0', provider: 'baidu', description: '百度旗舰模型', maxTokens: 8000 },
  { id: 'qwen-max', name: '通义千问 Max', provider: 'alibaba', description: '阿里云旗舰模型', maxTokens: 6000 },
  { id: 'spark-v3.5', name: '讯飞星火 v3.5', provider: 'iflytek', description: '讯飞旗舰模型', maxTokens: 8192 },
  { id: 'glm-4', name: '智谱 GLM-4', provider: 'zhipu', description: '智谱旗舰模型', maxTokens: 128000 },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', description: 'DeepSeek 对话模型', maxTokens: 32000 },
  { id: 'moonshot-v1', name: 'Moonshot v1', provider: 'moonshot', description: '月之暗面对话模型', maxTokens: 32000 },
];

export const PROVIDER_NAMES: Record<ModelProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  baidu: '百度',
  iflytek: '讯飞',
  alibaba: '阿里云',
  tencent: '腾讯',
  zhipu: '智谱',
  moonshot: '月之暗面',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
};

export const PROVIDER_ICONS: Record<ModelProvider, string> = {
  openai: '🤖',
  anthropic: '🧠',
  google: '🔵',
  baidu: '🔴',
  iflytek: '🟢',
  alibaba: '🟠',
  tencent: '🟣',
  zhipu: '⚪',
  moonshot: '🌙',
  deepseek: '🔮',
  minimax: '⭐',
};
