/**
 * 脚本生成服务模块
 * 统一导出所有脚本相关服务
 *
 * 重构说明：
 * - 原 scriptService.ts (548行) 拆分为 4 个独立模块
 * - aiModelConfigs.ts: AI 模型配置
 * - aiApiClient.ts: 统一 API 调用层
 * - promptBuilder.ts: 提示词构建
 * - scriptParser.ts: 脚本解析
 * - scriptGenerationService.ts: 服务层
 */

// 导出服务
export {
  scriptGenerationService,
  generateScriptWithModel,
  parseGeneratedScript,
  generateScriptWithOpenAI,
  type AIScriptDraft,
  type Script,
  type ScriptSegment,
  type LegacyAIModelType,
  type AnalysisInput,
  type ScriptGenerationSettings,
} from './script-generation-service';

// 导出错误类
export { AIServiceError } from './ai-api-client';

// 导出工具
export { parseScriptContent, formatScriptToText, createScriptDraft } from './script-parser';
export { buildScriptPrompt } from './prompt-builder';
export { invokeAIModel } from './ai-api-client';
export { AI_MODEL_CONFIGS, type AIModelType, type ModelConfig } from './ai-model-configs';
