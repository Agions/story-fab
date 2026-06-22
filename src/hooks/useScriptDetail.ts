import { useCallback, useMemo, useReducer } from 'react';
import type { Script, ScriptSegment } from '@/core/services/ai/scriptService';
import {
  initialScriptDetailState,
  scriptDetailReducer,
  type ScriptDetailState,
  type ScriptDetailProject,
} from './useScriptDetail.reducer';

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
  const [state, dispatch] = useReducer(scriptDetailReducer, initialScriptDetailState);

  const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', loading }), []);
  const setProject = useCallback(
    (project: ScriptDetailProject | null) => dispatch({ type: 'SET_PROJECT', project }),
    [],
  );
  const setScript = useCallback(
    (script: Script | null) => dispatch({ type: 'SET_SCRIPT', script }),
    [],
  );
  const setSegments = useCallback(
    (segments: ScriptSegment[]) => dispatch({ type: 'SET_SEGMENTS', segments }),
    [],
  );
  const setLoadError = useCallback(
    (loadError: string) => dispatch({ type: 'SET_LOAD_ERROR', loadError }),
    [],
  );
  const incrementReloadToken = useCallback(
    () => dispatch({ type: 'INCREMENT_RELOAD_TOKEN' }),
    [],
  );
  const setIsSaving = useCallback(
    (isSaving: boolean) => dispatch({ type: 'SET_IS_SAVING', isSaving }),
    [],
  );
  const setIsExporting = useCallback(
    (isExporting: boolean) => dispatch({ type: 'SET_IS_EXPORTING', isExporting }),
    [],
  );
  const setIsDeleting = useCallback(
    (isDeleting: boolean) => dispatch({ type: 'SET_IS_DELETING', isDeleting }),
    [],
  );
  const setDeleteConfirmOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_DELETE_CONFIRM_OPEN', open }),
    [],
  );
  const resetForLoad = useCallback(() => dispatch({ type: 'RESET_FOR_LOAD' }), []);
  const resetForReload = useCallback(() => dispatch({ type: 'RESET_FOR_RELOAD' }), []);

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
