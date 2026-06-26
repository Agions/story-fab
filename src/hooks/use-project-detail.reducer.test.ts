import { describe, it, expect } from 'vitest';
import {
  projectDetailReducer,
  initialProjectDetailState,
  type ProjectDetailState,
  type ProjectDetailProject,
} from './use-project-detail.reducer';
import type { AIScriptDraft } from '@/core/services/ai/script-service';
import type { ScriptSegment } from '@/types';

// ─── helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<ProjectDetailState> = {}): ProjectDetailState {
  return { ...initialProjectDetailState, ...overrides };
}

const mockProject: ProjectDetailProject & { scripts?: AIScriptDraft[] } = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
  videoPath: '/videos/test.mp4',
};

const mockScript: AIScriptDraft = {
  id: 'script-1',
  projectId: 'proj-1',
  content: [
    { id: 'seg-1', startTime: 0, endTime: 5, content: 'Hello world' },
    { id: 'seg-2', startTime: 5, endTime: 10, content: 'Goodbye world' },
  ] as unknown as AIScriptDraft['content'],
  fullText: 'Hello world\n\nGoodbye world',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
  modelUsed: 'gpt-4',
};

const mockSegments: ScriptSegment[] = [
  { id: 'seg-a', startTime: 0, endTime: 3, content: 'First segment' },
  { id: 'seg-b', startTime: 3, endTime: 7, content: 'Second segment' },
  { id: 'seg-c', startTime: 7, endTime: 10 },  // no content
];

// ─── tests ─────────────────────────────────────────────────────────────────────

describe('projectDetailReducer', () => {
  // ── default / unknown action ────────────────────────────────────────────────
  describe('default / unknown action', () => {
    it('returns the same state reference for an unknown action type', () => {
      const state = makeState();
      // @ts-expect-error testing unknown action
      const result = projectDetailReducer(state, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(state);
    });
  });

  // ── initialProjectDetailState ───────────────────────────────────────────────
  describe('initialProjectDetailState', () => {
    it('has correct default values', () => {
      expect(initialProjectDetailState.activeStep).toBe('analyze');
      expect(initialProjectDetailState.project).toBeNull();
      expect(initialProjectDetailState.activeScript).toBeNull();
      expect(initialProjectDetailState.aiLoading).toBe(false);
      expect(initialProjectDetailState.drawerVisible).toBe(false);
      expect(initialProjectDetailState.deleteConfirmOpen).toBe(false);
    });
  });

  // ── SET_ACTIVE_STEP ────────────────────────────────────────────────────────
  describe('SET_ACTIVE_STEP', () => {
    it('updates activeStep', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'SET_ACTIVE_STEP',
        step: 'edit',
      });
      expect(result.activeStep).toBe('edit');
    });

    it('overwrites a previous activeStep', () => {
      const result = projectDetailReducer(makeState({ activeStep: 'review' }), {
        type: 'SET_ACTIVE_STEP',
        step: 'publish',
      });
      expect(result.activeStep).toBe('publish');
    });

    it('preserves other state fields', () => {
      const state = makeState({ aiLoading: true, drawerVisible: true });
      const result = projectDetailReducer(state, {
        type: 'SET_ACTIVE_STEP',
        step: 'export',
      });
      expect(result.aiLoading).toBe(true);
      expect(result.drawerVisible).toBe(true);
    });
  });

  // ── SET_PROJECT ────────────────────────────────────────────────────────────
  describe('SET_PROJECT', () => {
    it('sets project from null', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'SET_PROJECT',
        project: mockProject,
      });
      expect(result.project).toBe(mockProject);
    });

    it('replaces an existing project', () => {
      const newProject = { ...mockProject, id: 'proj-2', name: 'New Project', updatedAt: '2025-07-01T00:00:00Z' };
      const result = projectDetailReducer(makeState({ project: mockProject }), {
        type: 'SET_PROJECT',
        project: newProject,
      });
      expect(result.project!.id).toBe('proj-2');
      expect(result.project!.name).toBe('New Project');
    });

    it('sets project to null', () => {
      const result = projectDetailReducer(makeState({ project: mockProject }), {
        type: 'SET_PROJECT',
        project: null,
      });
      expect(result.project).toBeNull();
    });

    it('preserves other state fields', () => {
      const state = makeState({ activeStep: 'edit', aiLoading: true });
      const result = projectDetailReducer(state, {
        type: 'SET_PROJECT',
        project: mockProject,
      });
      expect(result.activeStep).toBe('edit');
      expect(result.aiLoading).toBe(true);
    });
  });

  // ── UPDATE_PROJECT ─────────────────────────────────────────────────────────
  describe('UPDATE_PROJECT', () => {
    it('sets the project (same as SET_PROJECT for non-null)', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'UPDATE_PROJECT',
        project: mockProject,
      });
      expect(result.project).toBe(mockProject);
    });

    it('replaces an existing project', () => {
      const updated = { ...mockProject, name: 'Updated Name', updatedAt: '2025-08-01T00:00:00Z' };
      const result = projectDetailReducer(makeState({ project: mockProject }), {
        type: 'UPDATE_PROJECT',
        project: updated,
      });
      expect(result.project!.name).toBe('Updated Name');
    });
  });

  // ── SET_ACTIVE_SCRIPT ──────────────────────────────────────────────────────
  describe('SET_ACTIVE_SCRIPT', () => {
    it('sets activeScript from null', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'SET_ACTIVE_SCRIPT',
        script: mockScript,
      });
      expect(result.activeScript).toBe(mockScript);
    });

    it('sets activeScript to null', () => {
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'SET_ACTIVE_SCRIPT',
        script: null,
      });
      expect(result.activeScript).toBeNull();
    });

    it('replaces an existing script', () => {
      const newScript = { ...mockScript, id: 'script-2' };
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'SET_ACTIVE_SCRIPT',
        script: newScript,
      });
      expect(result.activeScript!.id).toBe('script-2');
    });

    it('preserves other state fields', () => {
      const state = makeState({ activeStep: 'review', deleteConfirmOpen: true });
      const result = projectDetailReducer(state, {
        type: 'SET_ACTIVE_SCRIPT',
        script: mockScript,
      });
      expect(result.activeStep).toBe('review');
      expect(result.deleteConfirmOpen).toBe(true);
    });
  });

  // ── UPDATE_ACTIVE_SCRIPT ───────────────────────────────────────────────────
  describe('UPDATE_ACTIVE_SCRIPT', () => {
    it('replaces activeScript', () => {
      const updated = { ...mockScript, fullText: 'Updated text' };
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'UPDATE_ACTIVE_SCRIPT',
        script: updated,
      });
      expect(result.activeScript!.fullText).toBe('Updated text');
    });

    it('sets activeScript from null', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'UPDATE_ACTIVE_SCRIPT',
        script: mockScript,
      });
      expect(result.activeScript).toBe(mockScript);
    });
  });

  // ── UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS ─────────────────────────────────────
  describe('UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS', () => {
    it('updates content and fullText from segments', () => {
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS',
        segments: mockSegments,
        activeScript: mockScript,
      });
      expect(result.activeScript!.content).toBe(mockSegments);
      // fullText should be segments joined by \n\n (empty content treated as '')
      expect(result.activeScript!.fullText).toBe('First segment\n\nSecond segment\n\n');
    });

    it('updates updatedAt to a recent ISO timestamp', () => {
      const before = Date.now();
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS',
        segments: mockSegments,
        activeScript: mockScript,
      });
      const after = Date.now();
      const ts = new Date(result.activeScript!.updatedAt).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it('preserves other activeScript properties (id, projectId, modelUsed)', () => {
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS',
        segments: mockSegments,
        activeScript: mockScript,
      });
      expect(result.activeScript!.id).toBe('script-1');
      expect(result.activeScript!.projectId).toBe('proj-1');
      expect(result.activeScript!.modelUsed).toBe('gpt-4');
    });

    it('handles empty segments array', () => {
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS',
        segments: [],
        activeScript: mockScript,
      });
      expect(result.activeScript!.content).toEqual([]);
      expect(result.activeScript!.fullText).toBe('');
    });

    it('handles segments with undefined content', () => {
      const segs: ScriptSegment[] = [
        { id: 's1', startTime: 0, endTime: 5 },
        { id: 's2', startTime: 5, endTime: 10, content: 'Only one' },
      ];
      const result = projectDetailReducer(makeState({ activeScript: mockScript }), {
        type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS',
        segments: segs,
        activeScript: mockScript,
      });
      expect(result.activeScript!.fullText).toBe('\n\nOnly one');
    });

    it('preserves other top-level state fields', () => {
      const state = makeState({ activeStep: 'export', aiLoading: true });
      const result = projectDetailReducer(state, {
        type: 'UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS',
        segments: mockSegments,
        activeScript: mockScript,
      });
      expect(result.activeStep).toBe('export');
      expect(result.aiLoading).toBe(true);
    });
  });

  // ── SET_AI_LOADING ─────────────────────────────────────────────────────────
  describe('SET_AI_LOADING', () => {
    it('sets aiLoading to true', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'SET_AI_LOADING',
        loading: true,
      });
      expect(result.aiLoading).toBe(true);
    });

    it('sets aiLoading to false', () => {
      const result = projectDetailReducer(makeState({ aiLoading: true }), {
        type: 'SET_AI_LOADING',
        loading: false,
      });
      expect(result.aiLoading).toBe(false);
    });

    it('preserves other state fields', () => {
      const state = makeState({ activeStep: 'review', drawerVisible: true });
      const result = projectDetailReducer(state, {
        type: 'SET_AI_LOADING',
        loading: true,
      });
      expect(result.activeStep).toBe('review');
      expect(result.drawerVisible).toBe(true);
    });
  });

  // ── SET_DRAWER_VISIBLE ─────────────────────────────────────────────────────
  describe('SET_DRAWER_VISIBLE', () => {
    it('sets drawerVisible to true', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'SET_DRAWER_VISIBLE',
        visible: true,
      });
      expect(result.drawerVisible).toBe(true);
    });

    it('sets drawerVisible to false', () => {
      const result = projectDetailReducer(makeState({ drawerVisible: true }), {
        type: 'SET_DRAWER_VISIBLE',
        visible: false,
      });
      expect(result.drawerVisible).toBe(false);
    });

    it('preserves other state fields', () => {
      const state = makeState({ aiLoading: true, deleteConfirmOpen: true });
      const result = projectDetailReducer(state, {
        type: 'SET_DRAWER_VISIBLE',
        visible: true,
      });
      expect(result.aiLoading).toBe(true);
      expect(result.deleteConfirmOpen).toBe(true);
    });
  });

  // ── SET_DELETE_CONFIRM_OPEN ────────────────────────────────────────────────
  describe('SET_DELETE_CONFIRM_OPEN', () => {
    it('sets deleteConfirmOpen to true', () => {
      const result = projectDetailReducer(makeState(), {
        type: 'SET_DELETE_CONFIRM_OPEN',
        open: true,
      });
      expect(result.deleteConfirmOpen).toBe(true);
    });

    it('sets deleteConfirmOpen to false', () => {
      const result = projectDetailReducer(makeState({ deleteConfirmOpen: true }), {
        type: 'SET_DELETE_CONFIRM_OPEN',
        open: false,
      });
      expect(result.deleteConfirmOpen).toBe(false);
    });

    it('preserves other state fields', () => {
      const state = makeState({ activeStep: 'publish', drawerVisible: true });
      const result = projectDetailReducer(state, {
        type: 'SET_DELETE_CONFIRM_OPEN',
        open: true,
      });
      expect(result.activeStep).toBe('publish');
      expect(result.drawerVisible).toBe(true);
    });
  });

  // ── immutability ───────────────────────────────────────────────────────────
  describe('immutability', () => {
    it('does not mutate the original state object', () => {
      const state = makeState({ activeStep: 'analyze' });
      projectDetailReducer(state, { type: 'SET_ACTIVE_STEP', step: 'edit' });
      expect(state.activeStep).toBe('analyze');
    });

    it('returns a new object reference (spread)', () => {
      const state = makeState();
      const result = projectDetailReducer(state, { type: 'SET_AI_LOADING', loading: true });
      expect(result).not.toBe(state);
    });
  });
});
