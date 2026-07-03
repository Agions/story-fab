/**
 * StoryFab Store — Zustand v5
 *
 * Replaces the useReducer-based StoryFab context.
 * Provides the same API: useStoryFabStore() with state and actions.
 */
import { create } from 'zustand';
import type {
  storyfabState,
  storyfabStep,
  storyfabFeatureType,
  storyfabMode,
  storyfabAction,
} from '@/core/types/storyfab';
import {
  initialState,
  getNextStep,
  getPrevStep,
  getTotalSteps,
} from '@/core/types/storyfab';
import { storyFabReducer } from '@/core/types/storyfab';
import type { VideoInfo, VideoAnalysis, ScriptData, ProjectData, ExportSettings } from '@/types';

interface StoryFabStore {
  state: storyfabState;
  // Actions
  dispatch: (action: storyfabAction) => void;
  setMode: (mode: storyfabMode) => void;
  setStep: (step: storyfabStep) => void;
  setFeature: (feature: storyfabFeatureType) => void;
  setProject: (project: ProjectData | null) => void;
  setVideo: (video: VideoInfo | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setAnalysis: (analysis: VideoAnalysis | null) => void;
  setOcrSubtitle: (data: Array<{ startTime: number; endTime: number; text: string }> | null) => void;
  setAsrSubtitle: (data: Array<{ startTime: number; endTime: number; text: string; speaker?: string }> | null) => void;
  setNarrationScript: (script: ScriptData | null) => void;
  setRemixScript: (script: ScriptData | null) => void;
  setVoice: (audioUrl: string | null, settings?: { voiceId?: string; speed?: number; volume?: number }) => void;
  setSynthesis: (videoUrl: string | null, settings?: { syncAudioVideo?: boolean; addSubtitles?: boolean; addWatermark?: boolean }) => void;
  setExportSettings: (settings: ExportSettings | null) => void;
  setDuration: (duration: number) => void;
  updateVideo: (updates: Partial<VideoInfo>) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  reset: () => void;
  resetStep: (step: storyfabStep) => void;
  // Computed
  canProceed: () => boolean;
  completedSteps: number;
  totalSteps: number;
}

export const useStoryFabStore = create<StoryFabStore>((set, get) => ({
  state: initialState,

  dispatch: (action) => {
    set((s) => ({ state: storyFabReducer(s.state, action) }));
  },

  setMode: (mode) => get().dispatch({ type: 'SET_MODE', payload: mode }),
  setStep: (step) => get().dispatch({ type: 'SET_STEP', payload: step }),
  setFeature: (feature) => get().dispatch({ type: 'SET_FEATURE', payload: feature }),
  setProject: (project) => get().dispatch({ type: 'SET_PROJECT', payload: project }),
  setVideo: (video) => get().dispatch({ type: 'SET_VIDEO', payload: video }),
  setPlaying: (playing) => get().dispatch({ type: 'SET_PLAYING', payload: playing }),
  setCurrentTime: (time) => get().dispatch({ type: 'SET_CURRENT_TIME', payload: time }),
  setAnalysis: (analysis) => get().dispatch({ type: 'SET_ANALYSIS', payload: analysis }),
  setOcrSubtitle: (data) => get().dispatch({ type: 'SET_OCR_SUBTITLE', payload: data }),
  setAsrSubtitle: (data) => get().dispatch({ type: 'SET_ASR_SUBTITLE', payload: data }),
  setNarrationScript: (script) => get().dispatch({ type: 'SET_NARRATION_SCRIPT', payload: script }),
  setRemixScript: (script) => get().dispatch({ type: 'SET_REMIX_SCRIPT', payload: script }),
  setVoice: (audioUrl, settings) => get().dispatch({ type: 'SET_VOICE', payload: { audioUrl, settings } }),
  setSynthesis: (videoUrl, settings) => get().dispatch({ type: 'SET_SYNTHESIS', payload: { finalVideoUrl: videoUrl, settings } }),
  setExportSettings: (settings) => get().dispatch({ type: 'SET_EXPORT_SETTINGS', payload: settings }),
  setDuration: (duration) => get().dispatch({ type: 'SET_DURATION', payload: duration }),

  updateVideo: (updates) => {
    const { state } = get();
    if (state.currentVideo) {
      get().dispatch({ type: 'SET_VIDEO', payload: { ...state.currentVideo, ...updates } });
    }
  },

  goToNextStep: () => {
    const { state } = get();
    const nextStep = getNextStep(state.currentStep, state.mode);
    get().dispatch({ type: 'SET_STEP', payload: nextStep });
  },

  goToPrevStep: () => {
    const { state } = get();
    const prevStep = getPrevStep(state.currentStep, state.mode);
    get().dispatch({ type: 'SET_STEP', payload: prevStep });
  },

  reset: () => get().dispatch({ type: 'RESET' }),

  resetStep: (step) => get().dispatch({ type: 'RESET_STEP', payload: step }),

  canProceed: () => {
    const { state } = get();
    return state.stepStatus[state.currentStep] || state.currentStep === 'project-create';
  },

  get completedSteps() {
    return Object.values(get().state.stepStatus).filter(Boolean).length;
  },

  get totalSteps() {
    return getTotalSteps(get().state.mode);
  },
}));
