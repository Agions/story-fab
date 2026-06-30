/**
 * useProjectEditState — useReducer-backed replacement for the 17
 * `useState` calls previously inline in ProjectEdit. See the
 * sibling `.reducer.ts` for the state shape and setter surface.
 *
 * Usage:
 *   const { formName, setFormName, ... } = useProjectEditState({
 *     defaultProjectName,
 *   });
 *
 * The hook owns the state and persists settings (saveBehavior /
 * autoSaveEnabled) to localStorage when the corresponding setter is
 * invoked, so the call sites don't need extra `try { localStorage... }`
 * blocks.
 */
import { useMemo, useReducer } from 'react';

import {
  PROJECT_AUTO_SAVE_KEY,
  PROJECT_SAVE_BEHAVIOR_KEY,
  type ProjectSaveBehavior,
} from '@/shared/constants/constants';
import { createDefaultProjectName } from '../project-edit-utils';
import {
  createInitialProjectEditState,
  createProjectEditSetters,
  projectEditReducer,
  type ProjectEditSetters,
  type ProjectEditState,
} from './use-project-edit-state.reducer';

interface UseProjectEditStateOptions {
  /** Override the default project name (typically passed from outside so
   *  the name is stable across re-renders). */
  defaultProjectName?: string;
}

function readSaveBehavior(): ProjectSaveBehavior {
  try {
    return localStorage.getItem(PROJECT_SAVE_BEHAVIOR_KEY) === 'detail' ? 'detail' : 'stay';
  } catch {
    return 'stay';
  }
}

function readAutoSaveEnabled(): boolean {
  try {
    return localStorage.getItem(PROJECT_AUTO_SAVE_KEY) === '1';
  } catch {
    return false;
  }
}

interface UseProjectEditStateResult extends ProjectEditState, ProjectEditSetters {}

export function useProjectEditState(
  options: UseProjectEditStateOptions = {},
): UseProjectEditStateResult {
  const defaultProjectName = options.defaultProjectName ?? createDefaultProjectName();

  const [state, dispatch] = useReducer(
    projectEditReducer,
    defaultProjectName,
    (name) => createInitialProjectEditState(name, readSaveBehavior, readAutoSaveEnabled),
  );

  const setters = useMemo(() => createProjectEditSetters(dispatch), []);

  return { ...state, ...setters };
}

