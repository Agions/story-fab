/**
 * CutDeck Zustand Store
 * 从 useReducer 迁移到 Zustand 统一状态管理
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { CutDeckState, CutDeckStep, AIFeatureType } from '../types/workflow.types';
import type { VideoInfo, VideoAnalysis, ScriptData, ProjectData, ExportSettings } from '@/core/types';
import { initialState } from '../types/workflow.initialState';
import { getNextStep, getPrevStep } from '../types/workflow.types';
import { CUT_DECK_STEPS } from '../types/workflow.constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CutDeckStore extends CutDeckState {
  // Setters
  setStep: (step: CutDeckStep) => void;
  setStepComplete: (step: CutDeckStep, complete: boolean) => void;
  setFeature: (feature: AIFeatureType) => void;
  setProject: (project: ProjectData | null) => void;
  setVideo: (video: VideoInfo | null) => void;
  setAnalysis: (analysis: VideoAnalysis | null) => void;
  setAnalyzing: (isAnalyzing: boolean, progress?: number) => void;
  setOcrSubtitle: (data: Array<{ startTime: number; endTime: number; text: string }> | null) => void;
  setAsrSubtitle: (data: Array<{ startTime: number; endTime: number; text: string; speaker?: string }> | null) => void;
  setSubtitleProgress: (isGenerating: boolean, progress?: number) => void;
  setNarrationScript: (script: ScriptData | null) => void;
  setRemixScript: (script: ScriptData | null) => void;
  setScriptProgress: (isGenerating: boolean, progress?: number) => void;
  setVoice: (audioUrl: string | null, settings?: { voiceId?: string; speed?: number; volume?: number }) => void;
  setVoiceProgress: (isSynthesizing: boolean, progress?: number) => void;
  setSynthesis: (videoUrl: string | null, settings?: { syncAudioVideo?: boolean; addSubtitles?: boolean; addWatermark?: boolean }) => void;
  setSynthesisProgress: (isSynthesizing: boolean, progress?: number) => void;
  setExportSettings: (settings: ExportSettings | null) => void;
  setExportProgress: (isExporting: boolean, progress?: number) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  resetStep: (step: CutDeckStep) => void;
  // Computed
  canProceed: () => boolean;
  completedSteps: () => number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCutDeckStore = create<CutDeckStore>((set, get) => ({
  // ─── Initial State ────────────────────────────────────────────────────────
  ...initialState,

  // ─── Setters ─────────────────────────────────────────────────────────────
  setStep: (step) => set({ currentStep: step }),

  setStepComplete: (step, complete) =>
    set((state) => ({
      stepStatus: { ...state.stepStatus, [step]: complete },
    })),

  setFeature: (feature) => set({ selectedFeature: feature }),

  setProject: (project) =>
    set((state) => ({
      project,
      stepStatus: project ? { ...state.stepStatus, 'project-create': true } : state.stepStatus,
      currentStep: project ? 'video-upload' : state.currentStep,
    })),

  setVideo: (video) =>
    set((state) => ({
      currentVideo: video,
      duration: video?.duration || 0,
      stepStatus: video ? { ...state.stepStatus, 'video-upload': true } : state.stepStatus,
    })),

  setAnalysis: (analysis) =>
    set((state) => ({
      analysis,
      stepStatus: analysis ? { ...state.stepStatus, 'ai-analyze': true } : state.stepStatus,
    })),

  setAnalyzing: (isAnalyzing, progress) =>
    set((state) => ({
      isAnalyzing,
      analysisProgress: progress ?? state.analysisProgress,
    })),

  setOcrSubtitle: (data) =>
    set((state) => ({
      subtitleData: { ...state.subtitleData, ocr: data },
    })),

  setAsrSubtitle: (data) =>
    set((state) => ({
      subtitleData: { ...state.subtitleData, asr: data },
    })),

  setSubtitleProgress: (isGenerating, progress) =>
    set((state) => ({
      isGeneratingSubtitle: isGenerating,
      subtitleProgress: progress ?? state.subtitleProgress,
    })),

  setNarrationScript: (script) =>
    set((state) => ({
      scriptData: { ...state.scriptData, narration: script },
    })),

  setRemixScript: (script) =>
    set((state) => ({
      scriptData: { ...state.scriptData, remix: script },
    })),

  setScriptProgress: (isGenerating, progress) =>
    set((state) => ({
      isGeneratingScript: isGenerating,
      scriptProgress: progress ?? state.scriptProgress,
    })),

  setVoice: (audioUrl, settings) =>
    set((state) => ({
      voiceData: {
        audioUrl,
        voiceSettings: settings
          ? { ...state.voiceData.voiceSettings, ...settings }
          : state.voiceData.voiceSettings,
      },
    })),

  setVoiceProgress: (isSynthesizing, progress) =>
    set((state) => ({
      isSynthesizingVoice: isSynthesizing,
      voiceProgress: progress ?? state.voiceProgress,
    })),

  setSynthesis: (finalVideoUrl, settings) =>
    set((state) => ({
      synthesisData: {
        finalVideoUrl,
        settings: settings
          ? { ...state.synthesisData.settings, ...settings }
          : state.synthesisData.settings,
      },
    })),

  setSynthesisProgress: (isSynthesizing, progress) =>
    set((state) => ({
      isSynthesizing,
      synthesisProgress: progress ?? state.synthesisProgress,
    })),

  setExportSettings: (settings) => set({ exportSettings: settings }),

  setExportProgress: (isExporting, progress) =>
    set((state) => ({
      isExporting,
      exportProgress: progress ?? state.exportProgress,
      stepStatus:
        isExporting === false && state.exportSettings
          ? { ...state.stepStatus, export: true }
          : state.stepStatus,
    })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setError: (error) => set({ error }),

  reset: () => initialState,

  resetStep: (step) => {
    const resetIndex = CUT_DECK_STEPS.indexOf(step);
    const newStepStatus = { ...initialState.stepStatus };
    for (let i = resetIndex; i < CUT_DECK_STEPS.length; i++) {
      newStepStatus[CUT_DECK_STEPS[i]] = false;
    }
    const state = get();
    set({
      currentStep: step,
      stepStatus: newStepStatus,
      currentVideo: null,
      analysis: null,
      subtitleData: { ocr: null, asr: null },
      scriptData: { narration: null, remix: null },
      voiceData: { audioUrl: null, voiceSettings: state.voiceData.voiceSettings },
      synthesisData: { finalVideoUrl: null, settings: state.synthesisData.settings },
      exportSettings: null,
      error: null,
    });
  },

  // ─── Computed ─────────────────────────────────────────────────────────────
  canProceed: () => {
    const { currentStep, stepStatus } = get();
    return stepStatus[currentStep] || currentStep === 'project-create';
  },

  completedSteps: () => {
    const { stepStatus } = get();
    return Object.values(stepStatus).filter(Boolean).length;
  },
}));

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * 推荐 Hook — 使用浅比较优化重渲染
 * 用法: const { state, setStep } = useCutDeckStore()
 */
export const useCutDeckStoreShallow = <T>(selector: (state: CutDeckStore) => T): T => {
  return useCutDeckStore(useShallow(selector));
};
