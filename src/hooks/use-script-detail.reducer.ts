import type { Script, ScriptSegment } from '@/core/services/ai/script-service';
import type { DetailProject } from '@/types';

export interface ScriptDetailState {
  loading: boolean;
  project: DetailProject | null;
  script: Script | null;
  segments: ScriptSegment[];
  loadError: string;
  reloadToken: number;
  isSaving: boolean;
  isExporting: boolean;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
}


type ScriptDetailAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_PROJECT'; project: ScriptDetailState['project'] }
  | { type: 'SET_SCRIPT'; script: Script | null }
  | { type: 'SET_SEGMENTS'; segments: ScriptSegment[] }
  | { type: 'SET_LOAD_ERROR'; loadError: string }
  | { type: 'INCREMENT_RELOAD_TOKEN' }
  | { type: 'SET_IS_SAVING'; isSaving: boolean }
  | { type: 'SET_IS_EXPORTING'; isExporting: boolean }
  | { type: 'SET_IS_DELETING'; isDeleting: boolean }
  | { type: 'SET_DELETE_CONFIRM_OPEN'; open: boolean }
  | { type: 'RESET_FOR_LOAD' }
  | { type: 'RESET_FOR_RELOAD' };

export const initialScriptDetailState: ScriptDetailState = {
  loading: true,
  project: null,
  script: null,
  segments: [],
  loadError: '',
  reloadToken: 0,
  isSaving: false,
  isExporting: false,
  isDeleting: false,
  deleteConfirmOpen: false,
};

export function scriptDetailReducer(
  state: ScriptDetailState,
  action: ScriptDetailAction,
): ScriptDetailState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_PROJECT':
      return { ...state, project: action.project };
    case 'SET_SCRIPT':
      return { ...state, script: action.script };
    case 'SET_SEGMENTS':
      return { ...state, segments: action.segments };
    case 'SET_LOAD_ERROR':
      return { ...state, loadError: action.loadError };
    case 'INCREMENT_RELOAD_TOKEN':
      return { ...state, reloadToken: state.reloadToken + 1 };
    case 'SET_IS_SAVING':
      return { ...state, isSaving: action.isSaving };
    case 'SET_IS_EXPORTING':
      return { ...state, isExporting: action.isExporting };
    case 'SET_IS_DELETING':
      return { ...state, isDeleting: action.isDeleting };
    case 'SET_DELETE_CONFIRM_OPEN':
      return { ...state, deleteConfirmOpen: action.open };
    case 'RESET_FOR_LOAD':
      return { ...state, project: null, script: null, segments: [], loadError: '', loading: true };
    case 'RESET_FOR_RELOAD':
      return { ...state, project: null, script: null, segments: [], loadError: '', loading: true };
    default:
      return state;
  }
}
