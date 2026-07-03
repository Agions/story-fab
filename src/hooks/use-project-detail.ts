import { useCallback, useMemo, useReducer } from 'react';
import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { ScriptSegment } from '@/types';
import {
  initialProjectDetailState,
  projectDetailReducer,
  type ProjectDetailState,
  type ProjectDetailProject,
} from './use-project-detail.reducer';

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
  const [state, dispatch] = useReducer(projectDetailReducer, initialProjectDetailState);

  const setActiveStep = useCallback((step: string) => dispatch({ type: 'SET_ACTIVE_STEP', step }), []);
  const setProject = useCallback(
    (project: ProjectDetailState['project']) => dispatch({ type: 'SET_PROJECT', project }),
    [],
  );
  const updateProject = useCallback(
    (project: NonNullable<ProjectDetailState['project']>) => dispatch({ type: 'UPDATE_PROJECT', project }),
    [],
  );
  const setActiveScript = useCallback(
    (script: AIScriptDraft | null) => dispatch({ type: 'SET_ACTIVE_SCRIPT', script }),
    [],
  );
  const updateActiveScript = useCallback(
    (script: AIScriptDraft) => dispatch({ type: 'UPDATE_ACTIVE_SCRIPT', script }),
    [],
  );
  const updateActiveScriptFromSegments = useCallback(
    (segments: ScriptSegment[], activeScript: AIScriptDraft) =>
      dispatch({ type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS', segments, activeScript }),
    [],
  );
  const setAiLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_AI_LOADING', loading }), []);
  const setDrawerVisible = useCallback(
    (visible: boolean) => dispatch({ type: 'SET_DRAWER_VISIBLE', visible }),
    [],
  );
  const setDeleteConfirmOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_DELETE_CONFIRM_OPEN', open }),
    [],
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
export type { ProjectDetailState, ProjectDetailProject };
export { initialProjectDetailState };
