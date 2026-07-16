import { useMemo } from 'react';
import { useReducerHookFactory } from '@/shared/hooks/use-reducer-hook';
import { useBoundActions } from '@/shared/hooks/use-bound-actions';
import {
  initialSubtitleExtractorState,
  subtitleExtractorReducer,
  type SubtitleExtractorState,
  type SubtitleFormat,
  type SubtitleSegment,
} from './use-subtitle-extraction-reducer';

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

// module-level single-arg action creators — 稳定引用配合 useBoundActions useMemo。
// 多参数 action（incrementProgress）保持 inline 在 hook 内。
const singleArgCreators = {
  SET_FORMAT: (format: SubtitleFormat) => ({ type: 'SET_FORMAT' as const, payload: format }),
  SET_TRANSLATE: (translate: boolean) => ({ type: 'SET_TRANSLATE' as const, payload: translate }),
  SET_IS_EXTRACTING: (isExtracting: boolean) => ({
    type: 'SET_IS_EXTRACTING' as const,
    payload: isExtracting,
  }),
  SET_PROGRESS: (progress: number) => ({ type: 'SET_PROGRESS' as const, payload: progress }),
  SET_EXTRACTED_SUBTITLES: (subtitles: SubtitleSegment[]) => ({
    type: 'SET_EXTRACTED_SUBTITLES' as const,
    payload: subtitles,
  }),
  SET_EDITING_ID: (editingId: string | null) => ({
    type: 'SET_EDITING_ID' as const,
    payload: editingId,
  }),
  SET_EDITING_TEXT: (editingText: string) => ({
    type: 'SET_EDITING_TEXT' as const,
    payload: editingText,
  }),
  SET_ACTIVE_SUB_ID: (activeSubId: string | null) => ({
    type: 'SET_ACTIVE_SUB_ID' as const,
    payload: activeSubId,
  }),
  SET_VIDEO_DURATION: (videoDuration: number) => ({
    type: 'SET_VIDEO_DURATION' as const,
    payload: videoDuration,
  }),
  START_EDIT: (sub: SubtitleSegment) => ({ type: 'START_EDIT' as const, payload: sub }),
  CANCEL_EDIT: () => ({ type: 'CANCEL_EDIT' as const, payload: undefined }),
  RESET_FOR_EXTRACT: () => ({ type: 'RESET_FOR_EXTRACT' as const, payload: undefined }),
};

export function useSubtitleExtraction(): UseSubtitleExtractionResult {
  const { state, dispatch } = useReducerHookFactory(
    subtitleExtractorReducer,
    initialSubtitleExtractorState,
  );
  const actions = useBoundActions(dispatch, singleArgCreators);

  return useMemo(
    () => ({
      state,
      setFormat: actions.SET_FORMAT,
      setTranslate: actions.SET_TRANSLATE,
      setIsExtracting: actions.SET_IS_EXTRACTING,
      setProgress: actions.SET_PROGRESS,
      setExtractedSubtitles: actions.SET_EXTRACTED_SUBTITLES,
      // UPDATE_SUBTITLE_TEXT 是 (id, text) → { id, text } 多参数 inline
      updateSubtitleText: (id: string, text: string) =>
        dispatch({ type: 'UPDATE_SUBTITLE_TEXT', payload: { id, text } }),
      setEditingId: actions.SET_EDITING_ID,
      setEditingText: actions.SET_EDITING_TEXT,
      setActiveSubId: actions.SET_ACTIVE_SUB_ID,
      setVideoDuration: actions.SET_VIDEO_DURATION,
      startEdit: actions.START_EDIT,
      // void actions（无参 API）需要 1 行 wrapper：bound signature 是 (payload: undefined) => void
      cancelEdit: () => actions.CANCEL_EDIT(undefined),
      resetForExtract: () => actions.RESET_FOR_EXTRACT(undefined),
      // incrementProgress 是 2 参数 (delta, cap) → { delta, cap }，保持 inline
      incrementProgress: (delta: number, cap: number) =>
        dispatch({ type: 'INCREMENT_PROGRESS', payload: { delta, cap } }),
    }),
    [state, actions, dispatch],
  );
}

export type { SubtitleExtractorState, SubtitleFormat, SubtitleSegment };
export { initialSubtitleExtractorState };
