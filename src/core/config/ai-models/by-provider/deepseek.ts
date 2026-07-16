/**
 * DeepSeek 模型目录（2 个）
 *
 * Stage 8 PR-3.1：从 catalog.ts 拆分而来。
 */
import type { AIModel } from '@/types';

export const deepseekModels: AIModel[] = [
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek-V4-Pro',
    provider: 'deepseek',
    category: ['text', 'code'],
    description: 'DeepSeek 最新旗舰推理模型（2026），擅长复杂推断，适合镜头到文案的对齐评分与优先级排序。2.5 折优惠中。',
    features: ['高智能推理', '判别', '重排序'],
    tokenLimit: 64000,
    contextWindow: 64000,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see platform.deepseek.com' },
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek-V4-Flash',
    provider: 'deepseek',
    category: ['text', 'code'],
    description: 'DeepSeek 最新高速模型（2026），高性价比，适合批量脚本生成与改写。（注：原 deepseek-chat / deepseek-reasoner 将废弃，统一迁移至此）',
    features: ['高性价比', '中文可用', '重写能力'],
    tokenLimit: 64000,
    contextWindow: 64000,
    isPro: false,
    pricing: { input: 0, output: 0, unit: 'see platform.deepseek.com' },
  },
];
