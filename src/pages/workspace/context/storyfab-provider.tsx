/**
 * StoryFab Provider — compatibility layer
 *
 * Wraps the Zustand store and provides the same API as the old useReducer context.
 * This avoids changing all 11 consumer files.
 */
import React, { ReactNode, useRef, useCallback } from 'react';
import { useStoryFabStore } from '@/stores/storyfab-store';

// Re-export the store for direct usage
export { useStoryFabStore } from '@/stores/storyfab-store';

// Context for backward compatibility (some components may still use useContext)
export const StoryFabContext = React.createContext<ReturnType<typeof useStoryFabStore> | undefined>(undefined);

interface StoryFabProviderProps {
  children: ReactNode;
}

export const StoryFabProvider: React.FC<StoryFabProviderProps> = ({ children }) => {
  const store = useStoryFabStore();

  return (
    <StoryFabContext.Provider value={store}>
      {children}
    </StoryFabContext.Provider>
  );
};

/**
 * Compatibility hook — same API as old useStoryFab
 */
export const useStoryFab = () => {
  const store = useStoryFabStore();
  const state = store.state;

  // Blob URL cleanup ref
  const videoBlobUrlRef = useRef<string | null>(null);

  const revokeVideoBlobUrl = useCallback(() => {
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }
  }, []);

  return {
    state,
    dispatch: store.dispatch,
    setMode: store.setMode,
    setStep: store.setStep,
    setFeature: store.setFeature,
    setProject: store.setProject,
    setVideo: store.setVideo,
    setPlaying: store.setPlaying,
    setCurrentTime: store.setCurrentTime,
    setAnalysis: store.setAnalysis,
    setOcrSubtitle: store.setOcrSubtitle,
    setAsrSubtitle: store.setAsrSubtitle,
    setNarrationScript: store.setNarrationScript,
    setRemixScript: store.setRemixScript,
    setVoice: store.setVoice,
    setSynthesis: store.setSynthesis,
    setExportSettings: store.setExportSettings,
    setDuration: store.setDuration,
    updateVideo: store.updateVideo,
    revokeVideoBlobUrl,
    goToNextStep: store.goToNextStep,
    goToPrevStep: store.goToPrevStep,
    reset: store.reset,
    resetStep: store.resetStep,
    canProceed: store.canProceed,
    completedSteps: store.completedSteps,
    totalSteps: store.totalSteps,
  };
};

export type StoryFabContextType = ReturnType<typeof useStoryFab>;
