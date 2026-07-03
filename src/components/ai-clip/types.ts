import type { VideoInfo } from '@/types';
import type {
  CutPoint,
  ClipSuggestion,
  ClipSegment,
  AIClipConfig,
  ClipAnalysisResult
} from '../../core/services/ai-clip';

export interface AIClipAssistantProps {
  videoInfo: VideoInfo;
  onAnalysisComplete?: (result: ClipAnalysisResult) => void;
  onApplySuggestions?: (segments: ClipSegment[]) => void;
}
export { type CutPoint, type ClipSuggestion, type ClipSegment, type AIClipConfig, type ClipAnalysisResult };
