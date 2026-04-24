/**
 * Core 常量统一导出
 *
 * Single source of truth: @/core/config/models.config.ts
 * 本文件保留用于向后兼容，所有常量已重定向到 models.config.ts
 *
 * 历史：原本 CORE_AI_MODELS 定义在此文件，models.config.ts 后于 2026-04-21 重构吸收。
 */

export {
  AI_MODELS,
  DEFAULT_MODEL_ID,
  MODEL_RECOMMENDATIONS,
  MODEL_PROVIDERS,
  MODEL_VERIFICATION,
  MODEL_CATALOG_VERIFIED_AT,
  getModelById,
  getModelsByProvider,
  getModelsByCategory,
  getRecommendedModels,
} from '../config/models.config';

// ============================================================================
// Legacy re-exports（已废弃，请使用上述导出）
// ============================================================================
// 历史：曾在此定义 CORE_AI_MODELS / LLM_MODELS / DEFAULT_LLM_MODEL / MODEL_RECOMMENDATIONS
// 现已统一迁移至 @/core/config/models.config.ts
