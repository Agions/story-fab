/**
 * Services 统一导出
 * 只导出服务实例，类型统一从 @/core/types 导入
 */

// 导出基类和错误类型
export { BaseService, ServiceError } from './base.service';

// 导出各个服务
export { aiService } from './ai.service';
export { visionService } from './vision.service';
export { scriptTemplateService } from '../templates/script.templates';
export { editorService, EditorService } from './editor.service';
export { aiClipService, AIClipService } from './aiClip.service';
export { clipWorkflowService, ClipWorkflowService } from './clip-workflow.service';
export { audioVideoSyncService, AudioVideoSyncService } from './audio-sync.service';
export { subtitleService, SubtitleService } from './subtitle.service';
export { sceneCommentaryAlignmentService, SceneCommentaryAlignmentService } from './scene-commentary-alignment.service';
export { voiceSynthesisService, VoiceSynthesisService } from './voice-synthesis.service';
export { videoEffectService, VideoEffectService } from './video-effect.service';
export { exportService, ExportService } from './export.service';





// ASR & OCR 服务
export { asrService, ASRService } from './asr.service';
