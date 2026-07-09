import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { DetailProjectWithAIScripts } from '@/types';
import type { ScriptSegment } from '@/types';
import { createReducer } from '@/shared/hooks/create-reducer';

export interface ScriptDetailState {
  loading: boolean;
  project: DetailProjectWithAIScripts | null;
  script: AIScriptDraft | null;
  segments: ScriptSegment[];
  loadError: string;
  reloadToken: number;
  isSaving: boolean;
  isExporting: boolean;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
}

export type ScriptDetailAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROJECT'; payload: ScriptDetailState['project'] }
  | { type: 'SET_SCRIPT'; payload: AIScriptDraft | null }
  | { type: 'SET_SEGMENTS'; payload: ScriptSegment[] }
  | { type: 'SET_LOAD_ERROR'; payload: string }
  | { type: 'INCREMENT_RELOAD_TOKEN'; payload: undefined }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'SET_IS_EXPORTING'; payload: boolean }
  | { type: 'SET_IS_DELETING'; payload: boolean }
  | { type: 'SET_DELETE_CONFIRM_OPEN'; payload: boolean }
  | { type: 'RESET'; payload: undefined };

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

const handlers = {
  SET_LOADING: (s: ScriptDetailState, v: boolean) => ({ ...s, loading: v }),
  SET_PROJECT: (s: ScriptDetailState, v: ScriptDetailState['project']) => ({ ...s, project: v }),
  SET_SCRIPT: (s: ScriptDetailState, v: AIScriptDraft | null) => ({ ...s, script: v }),
  SET_SEGMENTS: (s: ScriptDetailState, v: ScriptSegment[]) => ({ ...s, segments: v }),
  SET_LOAD_ERROR: (s: ScriptDetailState, v: string) => ({ ...s, loadError: v }),
  INCREMENT_RELOAD_TOKEN: (s: ScriptDetailState) => ({ ...s, reloadToken: s.reloadToken + 1 }),
  SET_IS_SAVING: (s: ScriptDetailState, v: boolean) => ({ ...s, isSaving: v }),
  SET_IS_EXPORTING: (s: ScriptDetailState, v: boolean) => ({ ...s, isExporting: v }),
  SET_IS_DELETING: (s: ScriptDetailState, v: boolean) => ({ ...s, isDeleting: v }),
  SET_DELETE_CONFIRM_OPEN: (s: ScriptDetailState, v: boolean) => ({ ...s, deleteConfirmOpen: v }),
  RESET: (s: ScriptDetailState) => ({
    ...s,
    project: null,
    script: null,
    segments: [],
    loadError: '',
    loading: true,
  }),
};

export const [scriptDetailReducer] = createReducer<ScriptDetailState, typeof handlers>(
  'SCRIPT_DETAIL',
  handlers,
  initialScriptDetailState,
);
