/**
 * AI 服务统一导出
 * 合并自 core/services/ai/ + core/services/aiClip/ + core/services/providers/
 *
 * 提供 LLM 调用、视觉分析、脚本生成等 AI 能力
 */

// ─── AI 核心服务 ───
export { aiService } from '@/core/services/ai/ai-service';
export { visionService } from '@/core/services/ai/vision-service';
export { scriptGenerationService, generateScriptWithModel } from '@/core/services/ai/script-service';
export { sceneCommentaryAlignmentService } from '@/core/services/ai/scene-commentary-service';
export { voiceSynthesisService } from '@/core/services/ai/voice-synthesis-service';

// ─── AI 模型适配 ───
export { resolveLegacyModel, getLegacyModelCompatMap } from '@/core/services/ai/ai-model-adapter';

// ─── AI 剪辑批处理 ───
export { aiClipService } from '@/core/services/aiClip';
export { analyzeVideo } from '@/core/services/aiClip/analyzer';
export { batchProcess } from '@/core/services/aiClip/batch-processor';

// ─── LLM Providers ───
export { BaseService, ServiceError } from '@/core/services/providers/base-service';
export * from '@/core/services/providers';
