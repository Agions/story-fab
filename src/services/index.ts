/**
 * Services 统一导出层
 * 替代原 core/services/index.ts，提供更清晰的 API 表面
 *
 * 使用方式：
 *   import { aiService, videoProcessor, subtitleService } from '@/services';
 */

// ─── AI 服务 ───
export {
  aiService,
  visionService,
  scriptGenerationService,
  generateScriptWithModel,
  sceneCommentaryAlignmentService,
  voiceSynthesisService,
  resolveLegacyModel,
  aiClipService,
  analyzeVideo,
  batchProcess,
  BaseService,
  ServiceError,
} from './ai';

// ─── TTS 服务 ───
export { voiceSynthesisService as ttsService } from './tts';

// ─── 视频服务 ───
export {
  videoProcessor,
  TauriVideoProcessor,
  BaseVideoProcessor,
  VideoProcessingError,
  videoEffectService,
  detectEmotionPeaks,
  calculateEmotionScore,
} from './video';

// ─── 字幕服务 ───
export { subtitleService } from './subtitle';

// ─── 高光检测 ───
export { analyzeVideo as analyzeHighlights } from './highlight';

// ─── 项目服务 ───
export * from './project';

// ─── 导出服务 ───
export { ExportService, FORMAT_MIME_TYPES } from './export';

// ─── 编辑器服务 ───
// EditorService 已移除，由 workspace-store.ts (Zustand) 接管编辑器状态

// ─── 解说模式 ───
export * from '@/core/services/commentary';
