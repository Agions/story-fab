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
