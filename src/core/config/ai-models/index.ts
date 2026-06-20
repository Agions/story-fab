/**
 * AI 模型配置中心 — 统一导出
 *
 * 【优化思路】原 aiModels.config.ts 1069 行拆为 2 个职责单一的模块：
 * - providers.ts: 提供者元数据 + 验证信息
 * - catalog.ts:   模型列表 + 推荐配置 + 查找函数
 *
 * 本文件作为统一出口，保持所有原有 API 不变。
 */

export {
  MODEL_PROVIDERS,
  MODEL_CATALOG_VERIFIED_AT,
  DEFAULT_MODEL_ID,
  MODEL_VERIFICATION,
} from './providers';

export {
  AI_MODELS,
  MODEL_RECOMMENDATIONS,
  getModelById,
  getModelsByProvider,
  getModelsByCategory,
  getRecommendedModels,
} from './catalog';
