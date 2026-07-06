/**
 * AI 服务 - 统一封装多种 AI 模型 API
 * 支持：通义千问、讯飞星火、智谱清言、DeepSeek、Moonshot Kimi
 *
 * 重构说明：
 * - 原 548 行单体服务已拆分为 4 个独立模块
 * - 本文件作为向后兼容的入口，重新导出所有服务
 * - 新代码请直接导入 script/ 目录下的具体模块
 */

// 重新导出所有脚本相关服务
export {
  scriptGenerationService,
  generateScriptWithModel,
  parseGeneratedScript,
  generateScriptWithOpenAI,
  analyzeKeyFramesWithAI,
  type AIScriptDraft,
  type AnalysisInput,
  type ScriptGenerationSettings,
} from './script/script-generation-service';

// 单独导出错误类
export { AIServiceError } from './script/ai-api-client';

// 导出工具函数
export { parseScriptContent, formatScriptToText, createScriptDraft } from './script/';
export { buildScriptPrompt } from './script/';
export { invokeAIModel } from './script/';
export { AI_MODEL_CONFIGS, type AIModelType, type ModelConfig } from './script/';
