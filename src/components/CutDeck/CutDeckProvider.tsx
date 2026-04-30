/**
 * AI Editor Provider
 * 从 AIEditorContext.tsx 提取的 Provider 组件
 */
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import type { CutDeckState, CutDeckStep, AIFeatureType, CutDeckAction } from './types';
import { initialState } from './initialState';
import { clipFlowReducer } from './reducer';
import { getNextStep, getPrevStep } from './types';
import { CUT_DECK_STEPS } from './constants';
import type { VideoInfo, VideoAnalysis, ScriptData, ProjectData, ExportSettings } from '../../core/types';

// 上下文类型
interface CutDeckContextType {
  state: CutDeckState;
  dispatch: React.Dispatch<CutDeckAction>;
  // 便捷方法
  setStep: (step: CutDeckStep) => void;
  setFeature: (feature: AIFeatureType) => void;
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
  // 流程控制
  goToNextStep: () => void;
  goToPrevStep: () => void;
  reset: () => void;
  resetStep: (step: CutDeckStep) => void;
  // 计算属性
  canProceed: () => boolean;
  completedSteps: number;
  totalSteps: number;
}

// 创建上下文
export const CutDeckContext = createContext<CutDeckContextType | undefined>(undefined);

// Provider 组件
interface CutDeckProviderProps {
  children: ReactNode;
}

export const CutDeckProvider: React.FC<CutDeckProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(clipFlowReducer, initialState);

  // 便捷方法 - 使用 useCallback 稳定函数引用
  const setStep = useCallback((step: CutDeckStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setFeature = useCallback((feature: AIFeatureType) => {
    dispatch({ type: 'SET_FEATURE', payload: feature });
  }, []);

  const setProject = useCallback((project: ProjectData | null) => {
    dispatch({ type: 'SET_PROJECT', payload: project });
  }, []);

  const setVideo = useCallback((video: VideoInfo | null) => {
    dispatch({ type: 'SET_VIDEO', payload: video });
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_PLAYING', payload: playing });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  }, []);

  const setAnalysis = useCallback((analysis: VideoAnalysis | null) => {
    dispatch({ type: 'SET_ANALYSIS', payload: analysis });
  }, []);

  const setOcrSubtitle = useCallback((data: Array<{ startTime: number; endTime: number; text: string }> | null) => {
    dispatch({ type: 'SET_OCR_SUBTITLE', payload: data });
  }, []);

  const setAsrSubtitle = useCallback((data: Array<{ startTime: number; endTime: number; text: string; speaker?: string }> | null) => {
    dispatch({ type: 'SET_ASR_SUBTITLE', payload: data });
  }, []);

  const setNarrationScript = useCallback((script: ScriptData | null) => {
    dispatch({ type: 'SET_NARRATION_SCRIPT', payload: script });
  }, []);

  const setRemixScript = useCallback((script: ScriptData | null) => {
    dispatch({ type: 'SET_REMIX_SCRIPT', payload: script });
  }, []);

  const setVoice = useCallback((audioUrl: string | null, settings?: { voiceId?: string; speed?: number; volume?: number }) => {
    dispatch({ type: 'SET_VOICE', payload: { audioUrl, settings } });
  }, []);

  const setSynthesis = useCallback((videoUrl: string | null, settings?: { syncAudioVideo?: boolean; addSubtitles?: boolean; addWatermark?: boolean }) => {
    dispatch({ type: 'SET_SYNTHESIS', payload: { finalVideoUrl: videoUrl, settings } });
  }, []);

  const setExportSettings = useCallback((settings: ExportSettings | null) => {
    dispatch({ type: 'SET_EXPORT_SETTINGS', payload: settings });
  }, []);

  // 流程控制
  const goToNextStep = useCallback(() => {
    const nextStep = getNextStep(state.currentStep);
    dispatch({ type: 'SET_STEP', payload: nextStep });
  }, [state.currentStep]);

  const goToPrevStep = useCallback(() => {
    const prevStep = getPrevStep(state.currentStep);
    dispatch({ type: 'SET_STEP', payload: prevStep });
  }, [state.currentStep]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const resetStep = useCallback((step: CutDeckStep) => {
    dispatch({ type: 'RESET_STEP', payload: step });
  }, []);

  // 计算属性
  const canProceed = useCallback((): boolean => {
    const { currentStep, stepStatus } = state;
    return stepStatus[currentStep] || currentStep === 'project-create';
  }, [state.currentStep, state.stepStatus]);

  const completedSteps = useMemo(() => {
    return Object.values(state.stepStatus).filter(Boolean).length;
  }, [state.stepStatus]);

  const totalSteps = CUT_DECK_STEPS.length;

  // 使用 useMemo 稳定化 context value，避免不必要的重渲染
  const value = useMemo<CutDeckContextType>(() => ({
    state,
    dispatch,
    setStep,
    setFeature,
    setProject,
    setVideo,
    setPlaying,
    setCurrentTime,
    setAnalysis,
    setOcrSubtitle,
    setAsrSubtitle,
    setNarrationScript,
    setRemixScript,
    setVoice,
    setSynthesis,
    setExportSettings,
    goToNextStep,
    goToPrevStep,
    reset,
    resetStep,
    canProceed,
    completedSteps,
    totalSteps,
  }), [
    state,
    setStep,
    setFeature,
    setProject,
    setVideo,
    setPlaying,
    setCurrentTime,
    setAnalysis,
    setOcrSubtitle,
    setAsrSubtitle,
    setNarrationScript,
    setRemixScript,
    setVoice,
    setSynthesis,
    setExportSettings,
    goToNextStep,
    goToPrevStep,
    reset,
    resetStep,
    canProceed,
    completedSteps,
  ]);

  return (
    <CutDeckContext.Provider value={value}>
      {children}
    </CutDeckContext.Provider>
  );
};

// 使用上下文的 Hook
export const useCutDeck = (): CutDeckContextType => {
  const context = useContext(CutDeckContext);
  if (!context) {
    throw new Error('useCutDeck must be used within CutDeckProvider');
  }
  return context;
};

// 导出旧版兼容 Hook（别名）
/** @deprecated 请使用 useCutDeck 代替 */
export const useAIEditor = useCutDeck;

// 导出上下文类型
export type { CutDeckContextType };
