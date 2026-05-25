/**
 * Services 统一导出
 * 只导出服务实例，类型统一从 @/core/types 导入
 */

// 基础 & providers
export { BaseService, ServiceError } from './providers/base.service';
export * from './providers';

// AI 服务（ai/ 子目录 — 模型调用层）
export { aiService } from './ai/ai.service';
export { visionService } from './ai/vision.service';
export { voiceSynthesisService, VoiceSynthesisService } from './ai/voice-synthesis.service';
export { scriptGenerationService } from './ai/scriptService';
export { sceneCommentaryAlignmentService, SceneCommentaryAlignmentService } from './ai/sceneCommentaryService';
export { resolveLegacyModel, getLegacyModelCompatMap } from './ai/aiModelAdapter';

// AI 剪辑批处理（aiClip/ — 原 ai/batch/，现提升到 services/ 一级）
export { aiClipService, AIClipService } from './aiClip';
export { analyzeVideo } from './aiClip/analyzer';
export { batchProcess } from './aiClip/batchProcessor';

// 剪辑 pipeline（pipeline/clip-pipeline/ — 原 ai/pipeline/，现提升到 services/ 一级）
export { clipWorkflowService, ClipWorkflowService } from './pipeline/clip-pipeline/clipWorkflow';
export { clipRepurposingPipeline, ClipRepurposingPipeline } from './pipeline/clip-pipeline/pipeline';
export { clipScorer } from './pipeline/clip-pipeline/clipScorer';
export { multiExporter } from './pipeline/clip-pipeline/multiExport';
export { seoGenerator } from './pipeline/clip-pipeline/seoGenerator';

// 编辑器服务
export { editorService, EditorService } from './editor';
export * from './editor';

// 导出服务（export/ 子目录）
export { exportService, ExportService } from './export/export.service';
export { exportProgress } from './export/exportProgress';

// 字幕服务（subtitle/ 子目录）
export { subtitleService, SubtitleService } from './subtitle/subtitle.service';

// 视频特效 & 信号（video/ 子目录）
export { videoEffectService, VideoEffectService } from './video/videoEffectService';
export { detectEmotionPeaks, calculateEmotionScore } from './video/emotionDetector';

// 工作流编排（workflow/ 子目录 — 旁白agents）
export { orchestrateCommentaryAgents } from './workflow/commentaryAgents';

// Commentary Mode 服务（解说模式核心服务）
export * from './commentary';