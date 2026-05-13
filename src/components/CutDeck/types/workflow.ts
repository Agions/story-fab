/**
 * cut_deck Workflow — unified types, constants, initial state, helpers
 * Previously split across: workflow.types.ts / workflow.constants.ts / workflow.initialState.ts
 * All content now in one self-contained file, zero circular imports.
 */
import type { VideoInfo, VideoAnalysis, ScriptData, ProjectData, ExportSettings } from '@/core/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type cut_deckFeatureType = 'smartClip' | 'voiceover' | 'subtitle' | 'effect' | 'none';

export type cut_deckStep =
  | 'project-create'
  | 'video-upload'
  | 'ai-analyze'
  | 'clip-repurpose'
  | 'script-generate'
  | 'video-synthesize'
  | 'export';

export interface cut_deckState {
  currentStep: cut_deckStep;
  stepStatus: {
    'project-create': boolean;
    'video-upload': boolean;
    'ai-analyze': boolean;
    'clip-repurpose': boolean;
    'script-generate': boolean;
    'video-synthesize': boolean;
    'export': boolean;
  };
  selectedFeature: cut_deckFeatureType;
  project: ProjectData | null;
  currentVideo: VideoInfo | null;
  analysis: VideoAnalysis | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  subtitleData: {
    ocr: Array<{ startTime: number; endTime: number; text: string }> | null;
    asr: Array<{ startTime: number; endTime: number; text: string; speaker?: string }> | null;
  };
  isGeneratingSubtitle: boolean;
  subtitleProgress: number;
  scriptData: { narration: ScriptData | null; remix: ScriptData | null };
  isGeneratingScript: boolean;
  scriptProgress: number;
  voiceData: { audioUrl: string | null; voiceSettings: { voiceId: string; speed: number; volume: number } };
  isSynthesizingVoice: boolean;
  voiceProgress: number;
  synthesisData: { finalVideoUrl: string | null; settings: { syncAudioVideo: boolean; addSubtitles: boolean; addWatermark: boolean } };
  isSynthesizing: boolean;
  synthesisProgress: number;
  exportSettings: ExportSettings | null;
  isExporting: boolean;
  exportProgress: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}

// cut_deckAction discriminated union
export type cut_deckAction =
  | { type: 'SET_STEP'; payload: cut_deckStep }
  | { type: 'SET_STEP_COMPLETE'; payload: { step: cut_deckStep; complete: boolean } }
  | { type: 'SET_FEATURE'; payload: cut_deckFeatureType }
  | { type: 'SET_PROJECT'; payload: ProjectData | null }
  | { type: 'SET_VIDEO'; payload: VideoInfo | null }
  | { type: 'SET_ANALYSIS'; payload: VideoAnalysis | null }
  | { type: 'SET_ANALYZING'; payload: { isAnalyzing: boolean; progress?: number } }
  | { type: 'SET_OCR_SUBTITLE'; payload: Array<{ startTime: number; endTime: number; text: string }> | null }
  | { type: 'SET_ASR_SUBTITLE'; payload: Array<{ startTime: number; endTime: number; text: string; speaker?: string }> | null }
  | { type: 'SET_SUBTITLE_PROGRESS'; payload: { isGenerating: boolean; progress?: number } }
  | { type: 'SET_NARRATION_SCRIPT'; payload: ScriptData | null }
  | { type: 'SET_REMIX_SCRIPT'; payload: ScriptData | null }
  | { type: 'SET_SCRIPT_PROGRESS'; payload: { isGenerating: boolean; progress?: number } }
  | { type: 'SET_VOICE'; payload: { audioUrl: string | null; settings?: { voiceId?: string; speed?: number; volume?: number } } }
  | { type: 'SET_VOICE_PROGRESS'; payload: { isSynthesizing: boolean; progress?: number } }
  | { type: 'SET_SYNTHESIS'; payload: { finalVideoUrl: string | null; settings?: { syncAudioVideo?: boolean; addSubtitles?: boolean; addWatermark?: boolean } } }
  | { type: 'SET_SYNTHESIS_PROGRESS'; payload: { isSynthesizing: boolean; progress?: number } }
  | { type: 'SET_EXPORT_SETTINGS'; payload: ExportSettings | null }
  | { type: 'SET_EXPORT_PROGRESS'; payload: { isExporting: boolean; progress?: number } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }
  | { type: 'RESET_STEP'; payload: cut_deckStep };

// ─── Constants ────────────────────────────────────────────────────────────────

export const CUT_DECK_STEPS = [
  'project-create',
  'video-upload',
  'ai-analyze',
  'clip-repurpose',
  'script-generate',
  'video-synthesize',
  'export',
] as const;

export const INITIAL_STEP_STATUS = {
  'project-create': false,
  'video-upload': false,
  'ai-analyze': false,
  'clip-repurpose': false,
  'script-generate': false,
  'video-synthesize': false,
  'export': false,
} as const;

export const DEFAULT_VOICE_SETTINGS = {
  voiceId: 'female_zh',
  speed: 1.0,
  volume: 0.8,
} as const;

export const DEFAULT_SYNTHESIS_SETTINGS = {
  syncAudioVideo: true,
  addSubtitles: true,
  addWatermark: false,
} as const;

// ─── Initial State ────────────────────────────────────────────────────────────

export const initialState: cut_deckState = {
  currentStep: 'project-create',
  stepStatus: { ...INITIAL_STEP_STATUS },
  selectedFeature: 'none',
  project: null,
  currentVideo: null,
  analysis: null,
  isAnalyzing: false,
  analysisProgress: 0,
  subtitleData: { ocr: null, asr: null },
  isGeneratingSubtitle: false,
  subtitleProgress: 0,
  scriptData: { narration: null, remix: null },
  isGeneratingScript: false,
  scriptProgress: 0,
  voiceData: { audioUrl: null, voiceSettings: { ...DEFAULT_VOICE_SETTINGS } },
  isSynthesizingVoice: false,
  voiceProgress: 0,
  synthesisData: { finalVideoUrl: null, settings: { ...DEFAULT_SYNTHESIS_SETTINGS } },
  isSynthesizing: false,
  synthesisProgress: 0,
  exportSettings: null,
  isExporting: false,
  exportProgress: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  error: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getNextStep(currentStep: cut_deckStep): cut_deckStep {
  const currentIndex = CUT_DECK_STEPS.indexOf(currentStep);
  return currentIndex < CUT_DECK_STEPS.length - 1 ? CUT_DECK_STEPS[currentIndex + 1] : currentStep;
}

export function getPrevStep(currentStep: cut_deckStep): cut_deckStep {
  const currentIndex = CUT_DECK_STEPS.indexOf(currentStep);
  return currentIndex > 0 ? CUT_DECK_STEPS[currentIndex - 1] : currentStep;
}
