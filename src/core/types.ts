/**
 * @deprecated 请从 @/types 导入所有类型
 * 此文件为向后兼容的重导出层，将在后续版本移除
 */
export type {
  // project
  Project,
  ProjectStatus,
  ProjectSettings,
  ProjectData,
  VideoProject,
  User,
  UserPreferences,
  AppSettings,
  ApiResponse,
  PaginationParams,
  SelectOption,
  TaskStatus,
  SubtitleStyle,
} from '@/types';

export type {
  // media
  VideoAsset,
  VideoInfo,
  VideoMetadata,
  VideoSegment,
  SimpleVideoSegment,
  Scene,
  SceneType,
  AudioPeak,
  KeyFrame,
  HighlightSegment,
  HighlightOptions,
  DetectHighlightsInput,
  SmartVideoSegment,
  SegmentType,
  SegmentOptions,
  DetectSmartSegmentsInput,
  ProcessingProgress,
  ProgressCallback,
  FFmpegStatus,
  TranscodeOptions,
  ExtractKeyFramesOptions,
  CutOptions,
  SubtitleEntry,
  Subtitle,
} from '@/types';

export type {
  // script
  Script,
  ScriptSegment,
  ScriptMetadata,
  ScriptTemplate,
  ScriptData,
  ScriptGenerationOptions,
  ScriptStylePreset,
  SegmentMode,
  CommentarySegment,
  CommentaryScriptOutput,
  GenerateScriptInput,
} from '@/types';

export type {
  // voice
  Voice,
  VoiceSettings,
  VoiceConfig,
  VoiceInfo,
  TtsBackendName,
  TtsBackend,
  SynthesisResult,
  SynthesisProgress,
  SynthesizeOptions,
  SynthesizeResult as TtsSynthesizeResult,
} from '@/types';

export type {
  // analysis
  AIModel,
  ModelProvider,
  ModelCategory,
  AIModelConfig,
  AIModelInfo,
  AIModelSettings,
  AIModelType,
  AnalysisResult,
  Keyframe,
  DetectedObject,
  EmotionData,
  Emotion,
  KeyMoment,
  AnalysisStats,
  VideoAnalysis,
  AIAnalysisResult,
  EmotionAnalysis,
  ObjectDetection,
  AIAnalyzeProps,
  DirectorState,
  DirectorPlan,
  DirectorStatusResponse,
  PlanModifications,
} from '@/types';

export type {
  // pipeline
  WorkflowState,
  WorkflowStatus,
  WorkflowStepType,
  WorkflowStepInstance,
  WorkflowResult,
  PipelineContext,
  StepOptions,
  StepMeta,
  Step,
  PipelineResult,
  EditorPanel,
  AIFeatureType,
} from '@/types';

export type {
  // export
  ExportFormat,
  ExportQuality,
  ExportResolution,
  ExportSettings,
  ExportConfig,
  ExportResult,
  ExportRecord,
  EncoderSettings,
} from '@/types';

export {
  EXPORT_PRESETS,
  FORMAT_INFO,
} from '@/types';

// 保留 ReactNode 相关的 ModalProps（依赖 React）
import type { ReactNode } from 'react';
export interface ModalProps {
  open: boolean;
  title?: string;
  content?: ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  width?: number | string;
  footer?: ReactNode;
}

// 保留旧的 WorkflowStep 兼容别名
export type WorkflowStep = import('@/types').WorkflowStepType;
