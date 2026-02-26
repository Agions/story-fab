import type { VideoInfo } from '@/core/types';
import type {
  CutPoint,
  ClipSuggestion,
  ClipSegment,
  AIClipConfig,
  ClipAnalysisResult
} from '@/core/services/aiClip.service';

export interface AIClipAssistantProps {
  videoInfo: VideoInfo;
  onAnalysisComplete?: (result: ClipAnalysisResult) => void;
  onApplySuggestions?: (segments: ClipSegment[]) => void;
}

export type ClipStep = 'config' | 'analyze' | 'suggestions' | 'preview';

export interface StepConfig {
  title: string;
  icon: React.ReactNode;
}

export { type CutPoint, type ClipSuggestion, type ClipSegment, type AIClipConfig, type ClipAnalysisResult };
