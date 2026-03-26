/**
 * Services 统一导出
 * 只导出服务实例，类型统一从 @/core/types 导入
 */

// 导出基类和错误类型
export { BaseService, ServiceError } from './base.service';

// 导出各个服务
export { aiService } from './ai.service';
export { videoService } from './video.service';
export { storageService } from './storage.service';
export { visionService } from './vision.service';
export { workflowService } from './workflow.service';
export { scriptTemplateService } from '../templates/script.templates';
export { editorService, EditorService } from './editor.service';
export { costService, CostService } from './cost.service';
export { aiClipService, AIClipService } from './aiClip.service';
export { clipWorkflowService, ClipWorkflowService } from './clip-workflow.service';
export { commentaryMixService, CommentaryMixService } from './commentary-mix.service';
export { audioVideoSyncService, AudioVideoSyncService } from './audio-sync.service';
export { subtitleService, SubtitleService } from './subtitle.service';
export { sceneCommentaryAlignmentService, SceneCommentaryAlignmentService } from './scene-commentary-alignment.service';
export { aiDirectorService, AIDirectorService } from './ai-director.service';
export { overlayQualityService, OverlayQualityService } from './overlay-quality.service';
export { optimizeOverlayIteratively } from './overlay-optimization.service';
export { voiceSynthesisService, VoiceSynthesisService } from './voice-synthesis.service';
export { videoEffectService, VideoEffectService } from './video-effect.service';
export { exportService, ExportService } from './export.service';
export { pipelineService, PipelineService } from './pipeline.service';

// 新增服务
export { smartCutService, SmartCutService } from './smart-cut.service';
export { autoMusicService, AutoMusicService } from './auto-music.service';

export { enhancedCommentaryService, EnhancedCommentaryService } from './enhanced-commentary.service';



// ASR & OCR 服务
export { asrService, ASRService } from './asr.service';
export { ocrService, OCRService } from './ocr.service';
