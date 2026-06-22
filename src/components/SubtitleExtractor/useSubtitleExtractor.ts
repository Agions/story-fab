import { useCallback, useMemo, useReducer } from 'react';
import {
  initialSubtitleExtractorState,
  subtitleExtractorReducer,
  type SubtitleExtractorState,
  type SubtitleFormat,
  type SubtitleSegment,
} from './useSubtitleExtractor.reducer';

interface UseSubtitleExtractorResult {
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

export function useSubtitleExtractor(): UseSubtitleExtractorResult {
  const [state, dispatch] = useReducer(subtitleExtractorReducer, initialSubtitleExtractorState);

  const setFormat = useCallback((format: SubtitleFormat) => dispatch({ type: 'SET_FORMAT', format }), []);
  const setTranslate = useCallback((translate: boolean) => dispatch({ type: 'SET_TRANSLATE', translate }), []);
  const setIsExtracting = useCallback(
    (isExtracting: boolean) => dispatch({ type: 'SET_IS_EXTRACTING', isExtracting }),
    [],
  );
  const setProgress = useCallback((progress: number) => dispatch({ type: 'SET_PROGRESS', progress }), []);
  const incrementProgress = useCallback(
    (delta: number, cap: number) => dispatch({ type: 'INCREMENT_PROGRESS', delta, cap }),
    [],
  );
  const setExtractedSubtitles = useCallback(
    (subtitles: SubtitleSegment[]) => dispatch({ type: 'SET_EXTRACTED_SUBTITLES', subtitles }),
    [],
  );
  const updateSubtitleText = useCallback(
    (id: string, text: string) => dispatch({ type: 'UPDATE_SUBTITLE_TEXT', id, text }),
    [],
  );
  const setEditingId = useCallback(
    (editingId: string | null) => dispatch({ type: 'SET_EDITING_ID', editingId }),
    [],
  );
  const setEditingText = useCallback(
    (editingText: string) => dispatch({ type: 'SET_EDITING_TEXT', editingText }),
    [],
  );
  const setActiveSubId = useCallback(
    (activeSubId: string | null) => dispatch({ type: 'SET_ACTIVE_SUB_ID', activeSubId }),
    [],
  );
  const setVideoDuration = useCallback(
    (videoDuration: number) => dispatch({ type: 'SET_VIDEO_DURATION', videoDuration }),
    [],
  );
  const startEdit = useCallback((sub: SubtitleSegment) => dispatch({ type: 'START_EDIT', sub }), []);
  const cancelEdit = useCallback(() => dispatch({ type: 'CANCEL_EDIT' }), []);
  const resetForExtract = useCallback(() => dispatch({ type: 'RESET_FOR_EXTRACT' }), []);

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
