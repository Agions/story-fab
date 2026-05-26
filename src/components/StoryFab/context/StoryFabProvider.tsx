/**
 * AI Editor Provider
 * 从 AIEditorContext.tsx 提取的 Provider 组件
 */
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import type { storyfabState, storyfabStep, storyfabFeatureType, storyfabAction, storyfabMode } from '../types/workflow';
import { initialState, getNextStep, getPrevStep, getStepsForMode, getTotalSteps } from '../types/workflow';
import { storyFabReducer } from '../types/workflow.reducer';
import type { VideoInfo, VideoAnalysis, ScriptData, ProjectData, ExportSettings } from '@/core/types';

// 上下文类型
interface StoryFabContextType {
  state: storyfabState;
  dispatch: React.Dispatch<storyfabAction>;
  // 便捷方法
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
  // Blob URL 清理
  revokeVideoBlobUrl: () => void;
  // 流程控制
  goToNextStep: () => void;
  goToPrevStep: () => void;
  reset: () => void;
  resetStep: (step: storyfabStep) => void;
  // 计算属性
  canProceed: () => boolean;
  completedSteps: number;
  totalSteps: number;
}

// 创建上下文
export const StoryFabContext = createContext<StoryFabContextType | undefined>(undefined);

// Provider 组件
interface StoryFabProviderProps {
  children: ReactNode;
}

export const StoryFabProvider: React.FC<StoryFabProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(storyFabReducer, initialState);

  // 追踪当前 blob URL，用于清理
  const videoBlobUrlRef = React.useRef<string | null>(null);

  // 清理 blob URL，防止内存泄漏
  const revokeVideoBlobUrl = React.useCallback(() => {
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }
  }, []);

  // 确保组件卸载时也清理 blob URL
  React.useEffect(() => {
    return () => {
      if (videoBlobUrlRef.current) {
        URL.revokeObjectURL(videoBlobUrlRef.current);
        videoBlobUrlRef.current = null;
      }
    };
  }, []);

  // 便捷方法 - 使用 useCallback 稳定函数引用
  const setMode = useCallback((mode: storyfabMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setStep = useCallback((step: storyfabStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setFeature = useCallback((feature: storyfabFeatureType) => {
    dispatch({ type: 'SET_FEATURE', payload: feature });
  }, []);

  const setProject = useCallback((project: ProjectData | null) => {
    dispatch({ type: 'SET_PROJECT', payload: project });
  }, []);

  const setVideo = useCallback((video: VideoInfo | null) => {
    // 清理旧的 blob URL
    revokeVideoBlobUrl();
    dispatch({ type: 'SET_VIDEO', payload: video });
  }, [revokeVideoBlobUrl]);

  const setDuration = useCallback((duration: number) => {
    dispatch({ type: 'SET_DURATION', payload: duration });
  }, []);

  // 使用 useRef 存储 currentVideo 避免 stale closure，同时保持函数签名稳定
  const currentVideoRef = React.useRef(state.currentVideo);
  currentVideoRef.current = state.currentVideo;

  const updateVideo = useCallback((updates: Partial<VideoInfo>) => {
    if (currentVideoRef.current) {
      dispatch({
        type: 'SET_VIDEO',
        payload: { ...currentVideoRef.current, ...updates },
      });
    }
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
    const nextStep = getNextStep(state.currentStep, state.mode);
    dispatch({ type: 'SET_STEP', payload: nextStep });
  }, [state.currentStep, state.mode]);

  const goToPrevStep = useCallback(() => {
    const prevStep = getPrevStep(state.currentStep, state.mode);
    dispatch({ type: 'SET_STEP', payload: prevStep });
  }, [state.currentStep, state.mode]);

  const reset = useCallback(() => {
    revokeVideoBlobUrl();
    dispatch({ type: 'RESET' });
  }, [revokeVideoBlobUrl]);

  const resetStep = useCallback((step: storyfabStep) => {
    dispatch({ type: 'RESET_STEP', payload: step });
  }, []);

  const completedSteps = useMemo(() => {
    return Object.values(state.stepStatus).filter(Boolean).length;
  }, [state.stepStatus]);

  const totalSteps = useMemo(() => {
    return getTotalSteps(state.mode);
  }, [state.mode]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- 依赖子字段已充分
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 只读子字段，state 整体变化不需重新创建
  const canProceed = useCallback((): boolean => {
    const { currentStep, stepStatus } = state;
    return stepStatus[currentStep] || currentStep === 'project-create';
  }, [state.currentStep, state.stepStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // 静态方法集合（dispatch 稳定，useReducer 保证），从不因 state 变化而重建
  const staticValue = useMemo(() => ({
    dispatch,
    setMode,
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
    setDuration,
    updateVideo,
    revokeVideoBlobUrl,
    goToNextStep,
    goToPrevStep,
    reset,
    resetStep,
    completedSteps,
    totalSteps,
  }), [
    dispatch,
    setMode,
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
    setDuration,
    updateVideo,
    revokeVideoBlobUrl,
    goToNextStep,
    goToPrevStep,
    reset,
    resetStep,
    completedSteps,
    totalSteps,
  ]);

  // 动态 value：每次 state 变化时重建，但静态方法引用不变
  const value = useMemo<StoryFabContextType>(
    () => ({ state, ...staticValue, canProceed }),
    [state, staticValue, canProceed]
  );

  return (
    <StoryFabContext.Provider value={value}>
      {children}
    </StoryFabContext.Provider>
  );
};

// 使用上下文的 Hook
export const useStoryFab = (): StoryFabContextType => {
  const context = useContext(StoryFabContext);
  if (!context) {
    throw new Error('useStoryFab must be used within StoryFabProvider');
  }
  return context;
};

// 导出上下文类型
export type { StoryFabContextType };

// 旧版兼容 Hook（别名）
/** @deprecated 请使用 useStoryFab 代替 */
export const useAIEditor = useStoryFab;
