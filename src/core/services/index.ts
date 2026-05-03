/**
 * Services 统一导出
 * 只导出服务实例，类型统一从 @/core/types 导入
 *
 * 目录结构：
 *   ai/          — AI 模型调用（视觉、语音合成、脚本生成、对齐）
 *   asr/         — 语音识别 & 音视频同步
 *   aiClip/      — AI 剪辑分析
 *   clip-pipeline/ — 长视频拆条 pipeline（评分、SEO、导出）
 *   editor/      — 编辑器操作（时间线、轨道、剪辑历史）
 *   export/      — 多格式导出
 *   providers/   — AI 模型 providers（OpenAI/Anthropic/Baidu/…）
 *   subtitle/    — 字幕服务
 *   video/       — 视频特效 & 信号处理
 *   workflow/    — 工作流编排
 */

// 基础 & providers
export { BaseService, ServiceError } from './providers/base.service';
export * from './providers';

// AI 服务（ai/ 子目录）
export { aiService } from './ai/ai.service';
export { visionService } from './ai/vision.service';
export { voiceSynthesisService, VoiceSynthesisService } from './ai/voice-synthesis.service';
export { scriptGenerationService } from './ai/aiScriptGenerationService';
export { sceneCommentaryAlignmentService, SceneCommentaryAlignmentService } from './ai/scene-commentary-alignment.service';
export { resolveLegacyModel, getLegacyModelCompatMap } from './ai/aiModelAdapter';

// ASR & 音视频同步（asr/ 子目录）
export { asrService, ASRService } from './asr/asr.service';
export { audioVideoSyncService, AudioVideoSyncService } from './asr/audio-sync.service';

// AI 剪辑分析（aiClip/ 子目录）
export { aiClipService, AIClipService } from './aiClip';
export { analyzeVideo } from './aiClip/analyzer';
export { batchProcess } from './aiClip/batchProcessor';

// 剪辑 pipeline（clip-pipeline/ 子目录）
export { clipWorkflowService, ClipWorkflowService } from './clip-pipeline/clip-workflow.service';
export { clipRepurposingPipeline, ClipRepurposingPipeline } from './clip-pipeline/pipeline';
export { clipScorer } from './clip-pipeline/clipScorer';
export { multiFormatExporter } from './clip-pipeline/multiFormatExport';
export { seoGenerator } from './clip-pipeline/seoGenerator';

// 编辑器服务
export { editorService, EditorService } from './editor';
export * from './editor';

// 导出服务（export/ 子目录）
export { exportService, ExportService } from './export/export.service';
export { exportProgress } from './export/export-progress';

// 字幕服务（subtitle/ 子目录）
export { subtitleService, SubtitleService } from './subtitle/subtitle.service';

// 视频特效 & 信号（video/ 子目录）
export { videoEffectService, VideoEffectService } from './video/video-effect.service';
export { detectEmotionPeaks, calculateEmotionScore } from './video/emotion-peak-detector';

// 工作流（workflow/ 子目录）
export { orchestrateCommentaryAgents } from './workflow/commentaryAgents';

// 脚本模板
export { scriptTemplateService } from '../templates/script.templates';
