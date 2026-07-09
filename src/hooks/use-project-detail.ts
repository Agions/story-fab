import { useCallback, useMemo } from 'react';
import { useReducerHookFactory } from '@/shared/hooks/use-reducer-hook';
import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { ScriptSegment } from '@/types';
import {
  initialProjectDetailState,
  projectDetailReducer,
  type ProjectDetailState,
} from './use-project-detail-reducer';

interface UseProjectDetailResult {
  state: ProjectDetailState;
  setActiveStep: (step: string) => void;
  setProject: (project: ProjectDetailState['project']) => void;
  updateProject: (project: NonNullable<ProjectDetailState['project']>) => void;
  setActiveScript: (script: AIScriptDraft | null) => void;
  updateActiveScript: (script: AIScriptDraft) => void;
  updateActiveScriptFromSegments: (segments: ScriptSegment[], activeScript: AIScriptDraft) => void;
  setAiLoading: (loading: boolean) => void;
  setDrawerVisible: (visible: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
}

export function useProjectDetail(): UseProjectDetailResult {
  const { state, dispatch } = useReducerHookFactory(projectDetailReducer, initialProjectDetailState);

  const setActiveStep = useCallback((step: string) => dispatch({ type:'SET_ACTIVE_STEP', payload: step }), [dispatch]);
  const setProject = useCallback(
    (project: ProjectDetailState['project']) => dispatch({ type:'SET_PROJECT', payload: project }),
    [dispatch],
  );
  const updateProject = useCallback(
    (project: NonNullable<ProjectDetailState['project']>) => dispatch({ type:'UPDATE_PROJECT', payload: project }),
    [dispatch],
  );
  const setActiveScript = useCallback(
    (script: AIScriptDraft | null) => dispatch({ type:'SET_ACTIVE_SCRIPT', payload: script }),
    [dispatch],
  );
  const updateActiveScript = useCallback(
    (script: AIScriptDraft) => dispatch({ type:'UPDATE_ACTIVE_SCRIPT', payload: script }),
    [dispatch],
  );
  const updateActiveScriptFromSegments = useCallback(
    (segments: ScriptSegment[], activeScript: AIScriptDraft) =>
      dispatch({ type:'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS', payload: { segments, activeScript } }),
    [dispatch],
  );
  const setAiLoading = useCallback((loading: boolean) => dispatch({ type:'SET_AI_LOADING', payload: loading }), [dispatch]);
  const setDrawerVisible = useCallback(
    (visible: boolean) => dispatch({ type:'SET_DRAWER_VISIBLE', payload: visible }),
    [dispatch],
  );
  const setDeleteConfirmOpen = useCallback(
    (open: boolean) => dispatch({ type:'SET_DELETE_CONFIRM_OPEN', payload: open }),
    [dispatch],
  );

  return useMemo(
    () => ({
      state,
      setActiveStep,
      setProject,
      updateProject,
      setActiveScript,
      updateActiveScript,
      updateActiveScriptFromSegments,
      setAiLoading,
      setDrawerVisible,
      setDeleteConfirmOpen,
    }),
    [
      state,
      setActiveStep,
      setProject,
      updateProject,
      setActiveScript,
      updateActiveScript,
      updateActiveScriptFromSegments,
      setAiLoading,
      setDrawerVisible,
      setDeleteConfirmOpen,
    ],
  );
}

// Re-export types for consumer convenience
export type { ProjectDetailState };
export { initialProjectDetailState };
