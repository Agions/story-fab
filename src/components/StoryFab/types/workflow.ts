/**
 * story-fab Workflow — unified types, constants, initial state, helpers
 * Previously split across: workflow.types.ts / workflow.constants.ts / workflow.initialState.ts
 * All content now in one self-contained file, zero circular imports.
 */
import type { VideoInfo, VideoAnalysis, ScriptData, ProjectData, ExportSettings } from '@/core/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type storyfabFeatureType = 'smartClip' | 'voiceover' | 'subtitle' | 'effect' | 'none';

export type storyfabStep =
  | 'project-create'
  | 'video-upload'
  | 'ai-analyze'
  | 'clip-repurpose'
  | 'semantic-segment'
  | 'director-review'
  | 'script-generate'
  | 'video-synth'
  | 'voice-synth'
  | 'video-export';

export type storyfabMode = 'clip' | 'commentary';

export interface SemanticSegment {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  description?: string;
}

export interface storyfabState {
  mode: storyfabMode;
  currentStep: storyfabStep;
  stepStatus: {
    'project-create': boolean;
    'video-upload': boolean;
    'ai-analyze': boolean;
    'clip-repurpose': boolean;
    'semantic-segment': boolean;
    'director-review': boolean;
    'script-generate': boolean;
    'video-synth': boolean;
    'voice-synth': boolean;
    'video-export': boolean;
  };
  selectedFeature: storyfabFeatureType;
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
  // Commentary mode specific
  commentaryPlan: {
    segments: SemanticSegment[];
    totalDuration: number;
  } | null;
  directorPhase: 'pending' | 'reviewing' | 'approved';
  semanticSegments: SemanticSegment[];
}

// storyfabAction discriminated union
export type storyfabAction =
  | { type: 'SET_MODE'; payload: storyfabMode }
  | { type: 'SET_STEP'; payload: storyfabStep }
  | { type: 'SET_STEP_COMPLETE'; payload: { step: storyfabStep; complete: boolean } }
  | { type: 'SET_FEATURE'; payload: storyfabFeatureType }
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
  | { type: 'RESET_STEP'; payload: storyfabStep };

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLIP_STEPS = [
  'project-create',
  'video-upload',
  'ai-analyze',
  'clip-repurpose',
  'video-export',
] as const;

export const COMMENTARY_STEPS = [
  'project-create',
  'video-upload',
  'ai-analyze',
  'semantic-segment',
  'director-review',
  'script-generate',
  'video-synth',
  'voice-synth',
  'video-export',
] as const;

export const STORYFAB_STEPS = CLIP_STEPS;

export const INITIAL_STEP_STATUS = {
  'project-create': false,
  'video-upload': false,
  'ai-analyze': false,
  'clip-repurpose': false,
  'semantic-segment': false,
  'director-review': false,
  'script-generate': false,
  'video-synth': false,
  'voice-synth': false,
  'video-export': false,
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

export const initialState: storyfabState = {
  mode: 'clip',
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
  commentaryPlan: null,
  directorPhase: 'pending',
  semanticSegments: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getStepsForMode(mode: storyfabMode): readonly storyfabStep[] {
  return mode === 'clip' ? CLIP_STEPS : COMMENTARY_STEPS;
}

export function getNextStep(currentStep: storyfabStep, mode: storyfabMode = 'clip'): storyfabStep {
  const steps = getStepsForMode(mode);
  const currentIndex = steps.indexOf(currentStep);
  return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : currentStep;
}

export function getPrevStep(currentStep: storyfabStep, mode: storyfabMode = 'clip'): storyfabStep {
  const steps = getStepsForMode(mode);
  const currentIndex = steps.indexOf(currentStep);
  return currentIndex > 0 ? steps[currentIndex - 1] : currentStep;
}

export function getTotalSteps(mode: storyfabMode): number {
  return getStepsForMode(mode).length;
}
