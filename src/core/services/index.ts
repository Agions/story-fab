/**
 * Services 统一导出
 */

// 导出基类和错误类型
export { BaseService, ServiceError } from './base.service';
export type { RequestConfig as BaseRequestConfig } from './base.service';

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
export { voiceSynthesisService, VoiceSynthesisService } from './voice-synthesis.service';
export { videoEffectService, VideoEffectService } from './video-effect.service';
export { exportService, ExportService } from './export.service';

// 重新导出类型
export type { AIResponse, RequestConfig } from './ai.service';
export type {
  WorkflowState,
  WorkflowData,
  WorkflowConfig,
  WorkflowCallbacks,
  TimelineData,
  WorkflowStep
} from './workflow.service';
export type {
  EditorConfig,
  EditorAction,
  EditorHistory
} from './editor.service';
export type {
  CostRecord,
  CostStats,
  CostBudget
} from './cost.service';
export type {
  CutPoint,
  CutPointType,
  ClipSuggestion,
  ClipSegment,
  AIClipConfig,
  ClipAnalysisResult,
  BatchClipTask
} from './aiClip.service';
export type { ClipConfig, ClipSegment as WorkflowClipSegment, ClipResult } from './clip-workflow.service';
export type { MixConfig, MixResult, VideoClipInfo, TimelineData } from './commentary-mix.service';
export type { SyncConfig, SyncResult, SyncIssue, SyncTimeline } from './audio-sync.service';
export type { SubtitleConfig, SubtitleEntry, SubtitleData, SpeechRecognitionResult } from './subtitle.service';
export type { VoiceConfig, VoiceItem, SynthesisResult } from './voice-synthesis.service';
export type { EffectConfig, FilterEffect, TransitionEffect, AnimationEffect, ColorCorrection, EffectPreset } from './video-effect.service';
export type { 
  ExportFormat, ExportQuality, ExportResolution, EncoderSettings, ExportConfig, 
  ExportResult, ExportProgress 
} from './export.service';
