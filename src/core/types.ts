/**
 * @deprecated 请从 @/types 导入所有类型
 * 此文件为向后兼容的重导出层，将在后续版本移除
 */
export type {
  // project
  Project,
  ProjectStatus,
  ProjectData,
  User,
  AppSettings,
  ApiResponse,
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
  ScriptData,
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
  AIModelSettings,
  AIModelType,
  AnalysisResult,
  Keyframe,
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
