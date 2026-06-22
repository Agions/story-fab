/**
 * useProjectEditState — reducer backing the ProjectEdit page.
 *
 * Replaces 17 individual `useState` calls (formName/formDescription,
 * currentStep/saving/project, videoPath/videoSelected/videoMetadata/keyFrames,
 * scriptSegments, isNewProject/initialLoading/error, saveBehavior/autoSaveEnabled,
 * reloadToken) with a single useReducer that supports both value and
 * updater setter signatures.
 *
 * Pattern: §A2 state-machine migration (see large-file-splitting skill).
 *   - 1 reducer + 1 initial state factory + 1 setter factory (`makeSetter`)
 *   - `Updater<T> = T | ((prev: T) => T)` preserves useCallback `(prev) => next`
 *     call-site compatibility.
 *   - Public setter names match the original useState setters, so consumers
 *     need no changes beyond the import swap.
 */
import type { ProjectData } from '../projectEditUtils';
import type { ProjectSaveBehavior } from '@/shared/constants/settings';
import type { VideoMetadata } from '@/core/video';
import type { ScriptSegment } from '@/core/types';

/** All page state in one shape. Fields grouped loosely by domain. */
export interface ProjectEditState {
  // Form (top-level text inputs)
  formName: string;
  formDescription: string;

  // Project + step navigation
  project: ProjectData | null;
  isNewProject: boolean;
  currentStep: number;
  saving: boolean;
  initialLoading: boolean;
  error: string | null;
  reloadToken: number;

  // Video + analysis pipeline
  videoPath: string;
  videoSelected: boolean;
  videoMetadata: VideoMetadata | null;
  keyFrames: string[];
  scriptSegments: ScriptSegment[];

  // Settings (persisted to localStorage by the caller, not in this reducer)
  saveBehavior: ProjectSaveBehavior;
  autoSaveEnabled: boolean;
}

type ProjectEditAction =
  | { type: 'set'; key: keyof ProjectEditState; value: ProjectEditState[keyof ProjectEditState] }
  | { type: 'update'; key: keyof ProjectEditState; updater: (prev: ProjectEditState[keyof ProjectEditState]) => ProjectEditState[keyof ProjectEditState] };

export function projectEditReducer(
  state: ProjectEditState,
  action: ProjectEditAction,
): ProjectEditState {
  switch (action.type) {
    case 'set':
      // The dispatch sites already pin the value type via makeSetter<K>.
      // Cast through unknown to bridge the union of value types.
      return { ...state, [action.key]: action.value } as ProjectEditState;
    case 'update': {
      // Same bridge — the updater function is constructed by makeSetter<K>
      // and applies to a single field. The reducer's union-typed parameter
      // can't carry that precision through, so we cast at the call site.
      const current = state[action.key];
      const next = (
        action.updater as unknown as (prev: typeof current) => typeof current
      )(current);
      return { ...state, [action.key]: next } as ProjectEditState;
    }
    default:
      return state;
  }
}

export type Updater<T> = T | ((prev: T) => T);

function makeSetter<K extends keyof ProjectEditState>(
  dispatch: (action: ProjectEditAction) => void,
  key: K,
): (payload: Updater<ProjectEditState[K]>) => void {
  return (payload) => {
    if (typeof payload === 'function') {
      const updater = payload as unknown as (
        prev: ProjectEditState[keyof ProjectEditState],
      ) => ProjectEditState[keyof ProjectEditState];
      dispatch({ type: 'update', key, updater });
    } else {
      dispatch({ type: 'set', key, value: payload });
    }
  };
}

/**
 * Build a fresh state. Reads persisted settings from localStorage and
 * computes a default project name from the current timestamp. Kept as a
 * factory (not a const) so each useReducer call gets a fresh object —
 * React would otherwise reuse the reference across re-mounts.
 */
export function createInitialProjectEditState(
  defaultProjectName: string,
  readSaveBehavior: () => ProjectSaveBehavior,
  readAutoSaveEnabled: () => boolean,
): ProjectEditState {
  return {
    formName: defaultProjectName,
    formDescription: '',
    project: null,
    isNewProject: true,
    currentStep: 0,
    saving: false,
    initialLoading: false,
    error: null,
    reloadToken: 0,
    videoPath: '',
    videoSelected: false,
    videoMetadata: null,
    keyFrames: [],
    scriptSegments: [],
    saveBehavior: readSaveBehavior(),
    autoSaveEnabled: readAutoSaveEnabled(),
  };
}

/** Setter surface — one entry per state field, names match original useState. */
export interface ProjectEditSetters {
  setFormName: (v: Updater<string>) => void;
  setFormDescription: (v: Updater<string>) => void;
  setProject: (v: Updater<ProjectData | null>) => void;
  setIsNewProject: (v: Updater<boolean>) => void;
  setCurrentStep: (v: Updater<number>) => void;
  setSaving: (v: Updater<boolean>) => void;
  setInitialLoading: (v: Updater<boolean>) => void;
  setError: (v: Updater<string | null>) => void;
  setReloadToken: (v: Updater<number>) => void;
  setVideoPath: (v: Updater<string>) => void;
  setVideoSelected: (v: Updater<boolean>) => void;
  setVideoMetadata: (v: Updater<VideoMetadata | null>) => void;
  setKeyFrames: (v: Updater<string[]>) => void;
  setScriptSegments: (v: Updater<ScriptSegment[]>) => void;
  setSaveBehavior: (v: Updater<ProjectSaveBehavior>) => void;
  setAutoSaveEnabled: (v: Updater<boolean>) => void;
}

export function createProjectEditSetters(
  dispatch: (action: ProjectEditAction) => void,
): ProjectEditSetters {
  return {
    setFormName: makeSetter(dispatch, 'formName'),
    setFormDescription: makeSetter(dispatch, 'formDescription'),
    setProject: makeSetter(dispatch, 'project'),
    setIsNewProject: makeSetter(dispatch, 'isNewProject'),
    setCurrentStep: makeSetter(dispatch, 'currentStep'),
    setSaving: makeSetter(dispatch, 'saving'),
    setInitialLoading: makeSetter(dispatch, 'initialLoading'),
    setError: makeSetter(dispatch, 'error'),
    setReloadToken: makeSetter(dispatch, 'reloadToken'),
    setVideoPath: makeSetter(dispatch, 'videoPath'),
    setVideoSelected: makeSetter(dispatch, 'videoSelected'),
    setVideoMetadata: makeSetter(dispatch, 'videoMetadata'),
    setKeyFrames: makeSetter(dispatch, 'keyFrames'),
    setScriptSegments: makeSetter(dispatch, 'scriptSegments'),
    setSaveBehavior: makeSetter(dispatch, 'saveBehavior'),
    setAutoSaveEnabled: makeSetter(dispatch, 'autoSaveEnabled'),
  };
}
