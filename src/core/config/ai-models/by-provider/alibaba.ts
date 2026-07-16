/**
 * 阿里云 Qwen 模型目录（3 个）
 *
 * Stage 8 PR-3.1：从 catalog.ts 拆分而来。
 */
import type { AIModel } from '@/types';

export const alibabaModels: AIModel[] = [
  {
    id: 'qwen3.6-max-preview',
    name: 'Qwen3.6 Max (Preview)',
    provider: 'alibaba',
    category: ['text', 'code', 'image'],
    description: '阿里云通义千问最高智能预览版（2026-04），适合高质量解说稿与复杂文案创作。',
    features: ['最高智能', '中文专家', '复杂推理'],
    tokenLimit: 131072,
    contextWindow: 131072,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see dashscope.aliyun.com' },
  },
  {
    id: 'qwen3.6-plus',
    name: 'Qwen3.6 Plus',
    provider: 'alibaba',
    category: ['text', 'code', 'image'],
    description: '阿里云通义千问旗舰模型（2026-04），中文能力突出，适合中文解说文案生成与改写。',
    features: ['中文优化', '多模态', '成本可控'],
    tokenLimit: 131072,
    contextWindow: 131072,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see dashscope.aliyun.com' },
  },
  {
    id: 'qwen3.6-flash',
    name: 'Qwen3.6 Flash',
    provider: 'alibaba',
    category: ['text', 'code', 'image'],
    description: '阿里云通义千问高速模型（2026-04），响应快，适合批量分析与低延迟任务。',
    features: ['高速', '低成本', '中文优化'],
    tokenLimit: 131072,
    contextWindow: 131072,
    isPro: false,
    pricing: { input: 0, output: 0, unit: 'see dashscope.aliyun.com' },
  },
];
