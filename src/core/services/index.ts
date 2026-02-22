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
