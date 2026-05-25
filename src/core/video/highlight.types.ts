/**
 * Highlight Detection & Smart Segmentation Types
 * 本地 AI 高光检测和智能分段类型定义
 */

// ============================================
// Highlight Detection
// ============================================

export interface HighlightSegment {
  startMs: number;
  endMs: number;
  score: number;
  reason: string;
  audioScore?: number;
  sceneScore?: number;
  motionScore?: number;
}

export interface HighlightOptions {
  threshold?: number;
  minDurationMs?: number;
  topN?: number;
  windowMs?: number;
  detectScene?: boolean;
  sceneThreshold?: number;
}

export interface DetectHighlightsInput {
  videoPath: string;
  threshold?: number;
  minDurationMs?: number;
  topN?: number;
  windowMs?: number;
  detectScene?: boolean;
  sceneThreshold?: number;
}

// ============================================
// Smart Segmentation
// ============================================

export type SegmentType = 'dialogue' | 'action' | 'transition' | 'silence' | 'content';

export interface SmartVideoSegment {
  startMs: number;
  endMs: number;
  segmentType: string;
  durationMs: number;
  confidence: number;
  isSceneChange?: boolean;
  peakEnergy?: number;
  silenceRatio?: number;
  /** Suggested playback speed (1.0=normal, 2.0=2x, 4.0=4x, 6.0=6x fast-forward).
   *  Low/transition segments get accelerated to compress dead time;
   *  high-energy/action segments stay at 1.0x. */
  suggestedSpeed?: number;
  /** Recommended transition effect to apply before this segment.
   *  Computed by transition-suggestion.ts based on prev/curr/next segment types. */
  suggestedTransition?: {
    type: 'none' | 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'glitch';
    duration: number;
    reason: string;
    confidence: number;
  };
}

export interface SegmentOptions {
  minDurationMs?: number;
  maxDurationMs?: number;
  sceneThreshold?: number;
  silenceThresholdDb?: number;
  detectDialogue?: boolean;
  detectTransitions?: boolean;
}

export interface DetectSmartSegmentsInput {
  videoPath: string;
  minDurationMs?: number;
  maxDurationMs?: number;
  sceneThreshold?: number;
  silenceThresholdDb?: number;
  detectDialogue?: boolean;
  detectTransitions?: boolean;
}

// ============================================
// UI State Types
// ============================================

export interface HighlightPanelState {
  isLoading: boolean;
  highlights: HighlightSegment[];
  selectedHighlight: HighlightSegment | null;
  error: string | null;
}

export interface SmartSegmentPanelState {
  isLoading: boolean;
  segments: SmartVideoSegment[];
  selectedSegment: SmartVideoSegment | null;
  error: string | null;
}
