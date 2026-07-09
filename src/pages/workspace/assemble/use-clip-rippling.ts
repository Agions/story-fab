import { useCallback, useMemo } from 'react';
import { createReducerHook } from '@/shared/hooks/useReducerHook';
import type { RepurposingClip, PipelineStage } from '@/core/services/pipeline/clip-pipeline/pipeline';
import type { SocialPlatform, AspectRatio } from '../shared/clip-rippling-config';
import {
  initialClipRipplingState,
  clipRipplingReducer,
  type ClipRipplingState,
} from './clip-rippling.reducer';

interface UseClipRipplingResult {
  state: ClipRipplingState;
  setPlatform: (platform: SocialPlatform) => void;
  setSelectedFormats: (selectedFormats: AspectRatio[]) => void;
  toggleSelectedFormat: (format: AspectRatio) => void;
  setTargetCount: (targetCount: number) => void;
  setRunning: (running: boolean) => void;
  setProgress: (progress: number) => void;
  setStage: (stage: PipelineStage | '') => void;
  setResults: (results: RepurposingClip[]) => void;
  setSelectedClips: (selectedClips: Set<string>) => void;
  toggleClip: (id: string) => void;
  setExporting: (exporting: boolean) => void;
  setExportedPaths: (exportedPaths: string[]) => void;
  resetRun: () => void;
}

export function useClipRippling(): UseClipRipplingResult {
  const { state, dispatch } = createReducerHook(clipRipplingReducer, initialClipRipplingState);

  const setPlatform = useCallback((platform: SocialPlatform) => dispatch({ type:'SET_PLATFORM', payload: platform }), []);
  const setSelectedFormats = useCallback(
    (selectedFormats: AspectRatio[]) => dispatch({ type:'SET_SELECTED_FORMATS', payload: selectedFormats }),
    [],
  );
  const toggleSelectedFormat = useCallback(
    (format: AspectRatio) => dispatch({ type:'TOGGLE_SELECTED_FORMAT', payload: format }),
    [],
  );
  const setTargetCount = useCallback(
    (targetCount: number) => dispatch({ type:'SET_TARGET_COUNT', payload: targetCount }),
    [],
  );
  const setRunning = useCallback((running: boolean) => dispatch({ type:'SET_RUNNING', payload: running }), []);
  const setProgress = useCallback((progress: number) => dispatch({ type:'SET_PROGRESS', payload: progress }), []);
  const setStage = useCallback((stage: PipelineStage | '') => dispatch({ type:'SET_STAGE', payload: stage }), []);
  const setResults = useCallback(
    (results: RepurposingClip[]) => dispatch({ type:'SET_RESULTS', payload: results }),
    [],
  );
  const setSelectedClips = useCallback(
    (selectedClips: Set<string>) => dispatch({ type:'SET_SELECTED_CLIPS', payload: selectedClips }),
    [],
  );
  const toggleClip = useCallback((id: string) => dispatch({ type:'TOGGLE_CLIP', payload: id }), []);
  const setExporting = useCallback((exporting: boolean) => dispatch({ type:'SET_EXPORTING', payload: exporting }), []);
  const setExportedPaths = useCallback(
    (exportedPaths: string[]) => dispatch({ type:'SET_EXPORTED_PATHS', payload: exportedPaths }),
    [],
  );
  const resetRun = useCallback(() => dispatch({ type:'RESET_RUN', payload: undefined }), []);

  return useMemo(
    () => ({
      state,
      setPlatform,
      setSelectedFormats,
      toggleSelectedFormat,
      setTargetCount,
      setRunning,
      setProgress,
      setStage,
      setResults,
      setSelectedClips,
      toggleClip,
      setExporting,
      setExportedPaths,
      resetRun,
    }),
    [
      state,
      setPlatform,
      setSelectedFormats,
      toggleSelectedFormat,
      setTargetCount,
      setRunning,
      setProgress,
      setStage,
      setResults,
      setSelectedClips,
      toggleClip,
      setExporting,
      setExportedPaths,
      resetRun,
    ],
  );
}

export type { ClipRipplingState };
export { initialClipRipplingState };
