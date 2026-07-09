import { useCallback, useMemo } from 'react';
import { createReducerHook } from '@/shared/hooks/useReducerHook';
import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { ScriptSegment } from '@/types';
import {
  initialScriptDetailState,
  scriptDetailReducer,
  type ScriptDetailState,
} from './use-script-detail.reducer';

interface UseScriptDetailResult {
  state: ScriptDetailState;
  setLoading: (loading: boolean) => void;
  setProject: (project: ScriptDetailState['project']) => void;
  setScript: (script: AIScriptDraft | null) => void;
  setSegments: (segments: ScriptSegment[]) => void;
  setLoadError: (loadError: string) => void;
  incrementReloadToken: () => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
  resetForLoad: () => void;
  resetForReload: () => void;
}

export function useScriptDetail(): UseScriptDetailResult {
  const { state, dispatch } = createReducerHook(scriptDetailReducer, initialScriptDetailState);

  const setLoading = useCallback((loading: boolean) => dispatch({ type:'SET_LOADING', payload: loading }), [dispatch]);
  const setProject = useCallback(
    (project: ScriptDetailState['project']) => dispatch({ type:'SET_PROJECT', payload: project }),
    [dispatch],
  );
  const setScript = useCallback(
    (script: AIScriptDraft | null) => dispatch({ type:'SET_SCRIPT', payload: script }),
    [dispatch],
  );
  const setSegments = useCallback(
    (segments: ScriptSegment[]) => dispatch({ type:'SET_SEGMENTS', payload: segments }),
    [dispatch],
  );
  const setLoadError = useCallback(
    (loadError: string) => dispatch({ type:'SET_LOAD_ERROR', payload: loadError }),
    [dispatch],
  );
  const incrementReloadToken = useCallback(
    () => dispatch({ type:'INCREMENT_RELOAD_TOKEN', payload: undefined }),
    [dispatch],
  );
  const setIsSaving = useCallback(
    (isSaving: boolean) => dispatch({ type:'SET_IS_SAVING', payload: isSaving }),
    [dispatch],
  );
  const setIsExporting = useCallback(
    (isExporting: boolean) => dispatch({ type:'SET_IS_EXPORTING', payload: isExporting }),
    [dispatch],
  );
  const setIsDeleting = useCallback(
    (isDeleting: boolean) => dispatch({ type:'SET_IS_DELETING', payload: isDeleting }),
    [dispatch],
  );
  const setDeleteConfirmOpen = useCallback(
    (open: boolean) => dispatch({ type:'SET_DELETE_CONFIRM_OPEN', payload: open }),
    [dispatch],
  );
  const resetForLoad = useCallback(() => dispatch({ type:'RESET', payload: undefined }), [dispatch]);
  const resetForReload = useCallback(() => dispatch({ type:'RESET', payload: undefined }), [dispatch]);

  return useMemo(
    () => ({
      state,
      setLoading,
      setProject,
      setScript,
      setSegments,
      setLoadError,
      incrementReloadToken,
      setIsSaving,
      setIsExporting,
      setIsDeleting,
      setDeleteConfirmOpen,
      resetForLoad,
      resetForReload,
    }),
    [
      state,
      setLoading,
      setProject,
      setScript,
      setSegments,
      setLoadError,
      incrementReloadToken,
      setIsSaving,
      setIsExporting,
      setIsDeleting,
      setDeleteConfirmOpen,
      resetForLoad,
      resetForReload,
    ],
  );
}

export type { ScriptDetailState };
export { initialScriptDetailState };
