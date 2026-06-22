import type { AIScriptDraft } from '@/core/services/ai/scriptService';
import type { ScriptSegment } from '@/core/types';
import type { VideoAnalysis } from '@/types';

export interface ProjectDetailState {
  activeStep: string;
  project: (ProjectDetailProject & { scripts?: AIScriptDraft[]; analysis?: VideoAnalysis; extractedSubtitles?: unknown }) | null;
  activeScript: AIScriptDraft | null;
  aiLoading: boolean;
  drawerVisible: boolean;
  deleteConfirmOpen: boolean;
}

export interface ProjectDetailProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt: string;
  videoPath?: string;
  videos?: Array<{ path?: string }>;
  videoUrl?: string;
}

type ProjectDetailAction =
  | { type: 'SET_ACTIVE_STEP'; step: string }
  | { type: 'SET_PROJECT'; project: ProjectDetailState['project'] }
  | { type: 'UPDATE_PROJECT'; project: NonNullable<ProjectDetailState['project']> }
  | { type: 'SET_ACTIVE_SCRIPT'; script: AIScriptDraft | null }
  | { type: 'UPDATE_ACTIVE_SCRIPT'; script: AIScriptDraft }
  | { type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS'; segments: ScriptSegment[]; activeScript: AIScriptDraft }
  | { type: 'SET_AI_LOADING'; loading: boolean }
  | { type: 'SET_DRAWER_VISIBLE'; visible: boolean }
  | { type: 'SET_DELETE_CONFIRM_OPEN'; open: boolean };

const computeFullText = (segments: ScriptSegment[]): string =>
  segments.map((s) => s.content ?? '').join('\n\n');

export const initialProjectDetailState: ProjectDetailState = {
  activeStep: 'analyze',
  project: null,
  activeScript: null,
  aiLoading: false,
  drawerVisible: false,
  deleteConfirmOpen: false,
};

export function projectDetailReducer(
  state: ProjectDetailState,
  action: ProjectDetailAction,
): ProjectDetailState {
  switch (action.type) {
    case 'SET_ACTIVE_STEP':
      return { ...state, activeStep: action.step };
    case 'SET_PROJECT':
      return { ...state, project: action.project };
    case 'UPDATE_PROJECT':
      return { ...state, project: action.project };
    case 'SET_ACTIVE_SCRIPT':
      return { ...state, activeScript: action.script };
    case 'UPDATE_ACTIVE_SCRIPT':
      return { ...state, activeScript: action.script };
    case 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS': {
      const updatedScript: AIScriptDraft = {
        ...action.activeScript,
        content: action.segments as AIScriptDraft['content'],
        fullText: computeFullText(action.segments),
        updatedAt: new Date().toISOString(),
      };
      return { ...state, activeScript: updatedScript };
    }
    case 'SET_AI_LOADING':
      return { ...state, aiLoading: action.loading };
    case 'SET_DRAWER_VISIBLE':
      return { ...state, drawerVisible: action.visible };
    case 'SET_DELETE_CONFIRM_OPEN':
      return { ...state, deleteConfirmOpen: action.open };
    default:
      return state;
  }
}
