import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { ScriptSegment } from '@/types';
import type { VideoAnalysis } from '@/types';
import type { DetailProjectWithAIScripts } from '@/types';
import { createReducer } from '@/shared/hooks/create-reducer';

export interface ProjectDetailState {
  activeStep: string;
  project: (DetailProjectWithAIScripts & { analysis?: VideoAnalysis; extractedSubtitles?: unknown }) | null;
  activeScript: AIScriptDraft | null;
  aiLoading: boolean;
  drawerVisible: boolean;
  deleteConfirmOpen: boolean;
}

export type ProjectDetailAction =
  | { type: 'SET_ACTIVE_STEP'; payload: string }
  | { type: 'SET_PROJECT'; payload: ProjectDetailState['project'] }
  | { type: 'UPDATE_PROJECT'; payload: NonNullable<ProjectDetailState['project']> }
  | { type: 'SET_ACTIVE_SCRIPT'; payload: AIScriptDraft | null }
  | { type: 'UPDATE_ACTIVE_SCRIPT'; payload: AIScriptDraft }
  | {
      type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS';
      payload: { segments: ScriptSegment[]; activeScript: AIScriptDraft };
    }
  | { type: 'SET_AI_LOADING'; payload: boolean }
  | { type: 'SET_DRAWER_VISIBLE'; payload: boolean }
  | { type: 'SET_DELETE_CONFIRM_OPEN'; payload: boolean };

const computeFullScriptText = (segments: ScriptSegment[]): string =>
  segments.map((s) => s.content ?? '').join('\n\n');

export const initialProjectDetailState: ProjectDetailState = {
  activeStep: 'analyze',
  project: null,
  activeScript: null,
  aiLoading: false,
  drawerVisible: false,
  deleteConfirmOpen: false,
};

const handlers = {
  SET_ACTIVE_STEP: (s: ProjectDetailState, v: string) => ({ ...s, activeStep: v }),
  SET_PROJECT: (s: ProjectDetailState, v: ProjectDetailState['project']) => ({ ...s, project: v }),
  UPDATE_PROJECT: (s: ProjectDetailState, v: NonNullable<ProjectDetailState['project']>) => ({
    ...s,
    project: v,
  }),
  SET_ACTIVE_SCRIPT: (s: ProjectDetailState, v: AIScriptDraft | null) => ({ ...s, activeScript: v }),
  UPDATE_ACTIVE_SCRIPT: (s: ProjectDetailState, v: AIScriptDraft) => ({ ...s, activeScript: v }),
  UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS: (
    s: ProjectDetailState,
    p: { segments: ScriptSegment[]; activeScript: AIScriptDraft },
  ) => {
    const updatedScript: AIScriptDraft = {
      ...p.activeScript,
      content: p.segments as AIScriptDraft['content'],
      fullText: computeFullScriptText(p.segments),
      updatedAt: new Date().toISOString(),
    };
    return { ...s, activeScript: updatedScript };
  },
  SET_AI_LOADING: (s: ProjectDetailState, v: boolean) => ({ ...s, aiLoading: v }),
  SET_DRAWER_VISIBLE: (s: ProjectDetailState, v: boolean) => ({ ...s, drawerVisible: v }),
  SET_DELETE_CONFIRM_OPEN: (s: ProjectDetailState, v: boolean) => ({ ...s, deleteConfirmOpen: v }),
};

export const [projectDetailReducer] = createReducer<ProjectDetailState, typeof handlers>(
  'PROJECT_DETAIL',
  handlers,
  initialProjectDetailState,
);
