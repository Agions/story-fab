/**
 * Moonshot / Kimi 模型目录（4 个）
 *
 * Stage 8 PR-3.1：从 catalog.ts 拆分而来。
 */
import type { AIModel } from '@/types';

export const moonshotModels: AIModel[] = [
  {
    id: 'kimi-k2.6',
    name: 'Kimi K2.6',
    provider: 'moonshot',
    category: ['text', 'code', 'image'],
    description: '月之暗面最新旗舰（2026），原生多模态，Agent 性能出色，适合高质量解说稿生成。',
    features: ['原生多模态', '中文专家', '长上下文'],
    tokenLimit: 256000,
    contextWindow: 256000,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see platform.moonshot.cn' },
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    provider: 'moonshot',
    category: ['text', 'code', 'image'],
    description: '月之暗面旗舰（2025），原生多模态，适合高质量解说稿生成与素材分析。',
    features: ['原生多模态', '中文专家', '长上下文'],
    tokenLimit: 256000,
    contextWindow: 256000,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see platform.moonshot.cn' },
  },
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    provider: 'moonshot',
    category: ['text', 'code'],
    description: '月之暗面主力模型（2025），32K 上下文，适合中等长度解说稿一气生成。',
    features: ['长上下文', '中文专家', '快速'],
    tokenLimit: 32000,
    contextWindow: 32000,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see platform.moonshot.cn' },
  },
  {
    id: 'kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'moonshot',
    category: ['text', 'code'],
    description: '月之暗面推理增强版（2026），深度思考能力，适合复杂规划与逻辑推理任务。',
    features: ['推理增强', '深度思考', '中文专家'],
    tokenLimit: 32000,
    contextWindow: 32000,
    isPro: true,
    pricing: { input: 0, output: 0, unit: 'see platform.moonshot.cn' },
  },
];
