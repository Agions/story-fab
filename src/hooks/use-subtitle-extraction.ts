import { useCallback, useMemo } from 'react';
import { createReducerHook } from '@/shared/hooks/useReducerHook';
import {
  initialSubtitleExtractorState,
  subtitleExtractorReducer,
  type SubtitleExtractorState,
  type SubtitleFormat,
  type SubtitleSegment,
} from './use-subtitle-extraction.reducer';

interface UseSubtitleExtractionResult {
  state: SubtitleExtractorState;
  setFormat: (format: SubtitleFormat) => void;
  setTranslate: (translate: boolean) => void;
  setIsExtracting: (isExtracting: boolean) => void;
  setProgress: (progress: number) => void;
  incrementProgress: (delta: number, cap: number) => void;
  setExtractedSubtitles: (subtitles: SubtitleSegment[]) => void;
  updateSubtitleText: (id: string, text: string) => void;
  setEditingId: (editingId: string | null) => void;
  setEditingText: (editingText: string) => void;
  setActiveSubId: (activeSubId: string | null) => void;
  setVideoDuration: (videoDuration: number) => void;
  startEdit: (sub: SubtitleSegment) => void;
  cancelEdit: () => void;
  resetForExtract: () => void;
}

export function useSubtitleExtraction(): UseSubtitleExtractionResult {
  const { state, dispatch } = createReducerHook(subtitleExtractorReducer, initialSubtitleExtractorState);

  const setFormat = useCallback((format: SubtitleFormat) => dispatch({ type: 'SET_FORMAT', format }), [dispatch]);
  const setTranslate = useCallback((translate: boolean) => dispatch({ type: 'SET_TRANSLATE', translate }), [dispatch]);
  const setIsExtracting = useCallback(
    (isExtracting: boolean) => dispatch({ type: 'SET_IS_EXTRACTING', isExtracting }),
    [dispatch],
  );
  const setProgress = useCallback((progress: number) => dispatch({ type: 'SET_PROGRESS', progress }), [dispatch]);
  const incrementProgress = useCallback(
    (delta: number, cap: number) => dispatch({ type: 'INCREMENT_PROGRESS', delta, cap }),
    [dispatch],
  );
  const setExtractedSubtitles = useCallback(
    (subtitles: SubtitleSegment[]) => dispatch({ type: 'SET_EXTRACTED_SUBTITLES', subtitles }),
    [dispatch],
  );
  const updateSubtitleText = useCallback(
    (id: string, text: string) => dispatch({ type: 'UPDATE_SUBTITLE_TEXT', id, text }),
    [dispatch],
  );
  const setEditingId = useCallback(
    (editingId: string | null) => dispatch({ type: 'SET_EDITING_ID', editingId }),
    [dispatch],
  );
  const setEditingText = useCallback(
    (editingText: string) => dispatch({ type: 'SET_EDITING_TEXT', editingText }),
    [dispatch],
  );
  const setActiveSubId = useCallback(
    (activeSubId: string | null) => dispatch({ type: 'SET_ACTIVE_SUB_ID', activeSubId }),
    [dispatch],
  );
  const setVideoDuration = useCallback(
    (videoDuration: number) => dispatch({ type: 'SET_VIDEO_DURATION', videoDuration }),
    [dispatch],
  );
  const startEdit = useCallback((sub: SubtitleSegment) => dispatch({ type: 'START_EDIT', sub }), [dispatch]);
  const cancelEdit = useCallback(() => dispatch({ type: 'CANCEL_EDIT' }), [dispatch]);
  const resetForExtract = useCallback(() => dispatch({ type: 'RESET_FOR_EXTRACT' }), [dispatch]);

  return useMemo(
    () => ({
      state,
      setFormat,
      setTranslate,
      setIsExtracting,
      setProgress,
      incrementProgress,
      setExtractedSubtitles,
      updateSubtitleText,
      setEditingId,
      setEditingText,
      setActiveSubId,
      setVideoDuration,
      startEdit,
      cancelEdit,
      resetForExtract,
    }),
    [
      state,
      setFormat,
      setTranslate,
      setIsExtracting,
      setProgress,
      incrementProgress,
      setExtractedSubtitles,
      updateSubtitleText,
      setEditingId,
      setEditingText,
      setActiveSubId,
      setVideoDuration,
      startEdit,
      cancelEdit,
      resetForExtract,
    ],
  );
}

export type { SubtitleExtractorState, SubtitleFormat, SubtitleSegment };
export { initialSubtitleExtractorState };
