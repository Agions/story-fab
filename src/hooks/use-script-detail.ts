import { useCallback, useMemo } from 'react';
import { createReducerHook } from '@/shared/hooks/useReducerHook';
import type { Script, ScriptSegment } from '@/core/services/ai/script-service';
import {
  initialScriptDetailState,
  scriptDetailReducer,
  type ScriptDetailState,
  type ScriptDetailProject,
} from './use-script-detail.reducer';

interface UseScriptDetailResult {
  state: ScriptDetailState;
  setLoading: (loading: boolean) => void;
  setProject: (project: ScriptDetailProject | null) => void;
  setScript: (script: Script | null) => void;
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

  const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', loading }), [dispatch]);
  const setProject = useCallback(
    (project: ScriptDetailProject | null) => dispatch({ type: 'SET_PROJECT', project }),
    [dispatch],
  );
  const setScript = useCallback(
    (script: Script | null) => dispatch({ type: 'SET_SCRIPT', script }),
    [dispatch],
  );
  const setSegments = useCallback(
    (segments: ScriptSegment[]) => dispatch({ type: 'SET_SEGMENTS', segments }),
    [dispatch],
  );
  const setLoadError = useCallback(
    (loadError: string) => dispatch({ type: 'SET_LOAD_ERROR', loadError }),
    [dispatch],
  );
  const incrementReloadToken = useCallback(
    () => dispatch({ type: 'INCREMENT_RELOAD_TOKEN' }),
    [dispatch],
  );
  const setIsSaving = useCallback(
    (isSaving: boolean) => dispatch({ type: 'SET_IS_SAVING', isSaving }),
    [dispatch],
  );
  const setIsExporting = useCallback(
    (isExporting: boolean) => dispatch({ type: 'SET_IS_EXPORTING', isExporting }),
    [dispatch],
  );
  const setIsDeleting = useCallback(
    (isDeleting: boolean) => dispatch({ type: 'SET_IS_DELETING', isDeleting }),
    [dispatch],
  );
  const setDeleteConfirmOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_DELETE_CONFIRM_OPEN', open }),
    [dispatch],
  );
  const resetForLoad = useCallback(() => dispatch({ type: 'RESET_FOR_LOAD' }), [dispatch]);
  const resetForReload = useCallback(() => dispatch({ type: 'RESET_FOR_RELOAD' }), [dispatch]);

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

export type { ScriptDetailState, ScriptDetailProject };
export { initialScriptDetailState };
