/**
 * AI 模型配置中心 — 门面重导出
 *
 * 【优化思路】原始文件 1069 行已拆分为 3 个职责单一的子模块：
 *   - providers.ts: 提供者元数据 + 验证信息（~200 行）
 *   - catalog.ts:   模型列表 + 推荐配置 + 查找函数（~650 行）
 *   - selection.ts:  模型选择启发式算法（~265 行）
 *
 * 本文件保留为统一 re-export 门面，确保 17 个引用此路径的文件无需修改。
 */

export {
  // 提供者
  MODEL_PROVIDERS,
  MODEL_CATALOG_VERIFIED_AT,
  DEFAULT_MODEL_ID,
  MODEL_VERIFICATION,
  type ModelVerificationMeta,
  // 模型目录
  AI_MODELS,
  MODEL_RECOMMENDATIONS,
  getModelById,
  getModelsByProvider,
  getModelsByCategory,
  getRecommendedModels,
  // 选择算法
  estimateContentTokens,
  selectOptimalModel,
  recommendModelsForTask,
  type ContentProfile,
  type TaskType,
  type ModelSelectionHint,
} from './ai-models';
