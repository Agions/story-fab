/**
 * 科大讯飞 (iFlytek) 模型目录（2 个）
 *
 * Stage 8 PR-3.1：从 catalog.ts 拆分而来。
 */
import type { AIModel } from '@/types';

export const iflytekModels: AIModel[] = [
  {
    id: 'spark-4.0',
    name: 'Spark 4.0',
    provider: 'iflytek',
    category: ['text', 'audio'],
    description: '讯飞星火 4.0（2024-06），语音合成生态完整，适合与 TTS 联动生成配音解说。',
    features: ['语音生态', 'TTS 联动', '中文语音'],
    tokenLimit: 8192,
    contextWindow: 32000,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see iflytek pricing' },
  },
  {
    id: 'spark-3.5',
    name: 'Spark 3.5',
    provider: 'iflytek',
    category: ['text', 'audio'],
    description: '讯飞星火 3.5（2024-01），语音识别与合成双能力，适合讯飞系 AI 配音工作流。',
    features: ['语音双能力', '中文', '生态完整'],
    tokenLimit: 8192,
    contextWindow: 32000,
    isPro: false,
    pricing: { input: 0, output: 0, unit: 'see iflytek pricing' },
  },
];
