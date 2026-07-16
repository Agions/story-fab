/**
 * AI 模型查找性能基准
 *
 * Stage 8 PR-5.1。
 * 覆盖 AI_MODELS（50 模型）上的常见查找操作。
 */
import { bench, describe } from 'vitest';
import {
  getModelById,
  getModelsByProvider,
  getModelsByCategory,
  getRecommendedModels,
} from '@/core/config/ai-models/catalog';

describe('ai-models lookup', () => {
  bench('getModelById (50 models, hit middle)', () => {
    getModelById('gpt-4o');
  });

  bench('getModelById (50 models, miss)', () => {
    getModelById('nonexistent-model');
  });

  bench('getModelsByProvider (openai)', () => {
    getModelsByProvider('openai');
  });

  bench('getModelsByCategory (text)', () => {
    getModelsByCategory('text');
  });

  bench('getRecommendedModels (script)', () => {
    getRecommendedModels('script');
  });

  bench('getRecommendedModels (fast)', () => {
    getRecommendedModels('fast');
  });
});
