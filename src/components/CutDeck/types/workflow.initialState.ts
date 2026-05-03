/**
 * AI Editor 初始状态
 * 从 AIEditorContext.tsx 提取
 */
import type { CutDeckState } from './workflow.types';
import { INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from './workflow.constants';

export const initialState: CutDeckState = {
  currentStep: 'project-create',
  stepStatus: { ...INITIAL_STEP_STATUS },
  selectedFeature: 'none',
  project: null,
  currentVideo: null,
  analysis: null,
  isAnalyzing: false,
  analysisProgress: 0,
  subtitleData: {
    ocr: null,
    asr: null,
  },
  isGeneratingSubtitle: false,
  subtitleProgress: 0,
  scriptData: {
    narration: null,
    remix: null,
  },
  isGeneratingScript: false,
  scriptProgress: 0,
  voiceData: {
    audioUrl: null,
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS },
  },
  isSynthesizingVoice: false,
  voiceProgress: 0,
  synthesisData: {
    finalVideoUrl: null,
    settings: { ...DEFAULT_SYNTHESIS_SETTINGS },
  },
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
