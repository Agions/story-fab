import { describe, it, expect } from 'vitest';
import {
  scriptDetailReducer,
  initialScriptDetailState,
  type ScriptDetailState,
  type ScriptDetailProject,
} from './use-script-detail.reducer';
import type { Script, ScriptSegment } from '@/core/services/ai/script-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeState = (overrides: Partial<ScriptDetailState> = {}): ScriptDetailState => ({
  ...initialScriptDetailState,
  ...overrides,
});

const makeProject = (overrides: Partial<ScriptDetailProject> = {}): ScriptDetailProject => ({
  id: 'proj-1',
  name: 'Test Project',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const makeScript = (overrides: Partial<Script> = {}): Script => ({
  id: 'script-1',
  title: 'Test Script',
  ...overrides,
} as Script);

const makeSegment = (overrides: Partial<ScriptSegment> = {}): ScriptSegment => ({
  id: 'seg-1',
  text: 'Hello world',
  ...overrides,
} as ScriptSegment);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scriptDetailReducer', () => {
  // ---- initial state ----
  describe('initialScriptDetailState', () => {
    it('has the expected default values', () => {
      expect(initialScriptDetailState).toEqual({
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
      });
    });
  });

  // ---- default case ----
  describe('default', () => {
    it('returns the same state reference for an unknown action', () => {
      const state = makeState();
      // @ts-expect-error – deliberate unknown action
      const next = scriptDetailReducer(state, { type: 'UNKNOWN' });
      expect(next).toBe(state);
    });
  });

  // ---- SET_LOADING ----
  describe('SET_LOADING', () => {
    it('sets loading to true', () => {
      const next = scriptDetailReducer(makeState({ loading: false }), {
        type: 'SET_LOADING',
        loading: true,
      });
      expect(next.loading).toBe(true);
    });

    it('sets loading to false', () => {
      const next = scriptDetailReducer(makeState({ loading: true }), {
        type: 'SET_LOADING',
        loading: false,
      });
      expect(next.loading).toBe(false);
    });

    it('preserves other state fields', () => {
      const state = makeState({ loading: false, reloadToken: 5 });
      const next = scriptDetailReducer(state, { type: 'SET_LOADING', loading: true });
      expect(next.reloadToken).toBe(5);
    });
  });

  // ---- SET_PROJECT ----
  describe('SET_PROJECT', () => {
    it('sets a project', () => {
      const project = makeProject();
      const next = scriptDetailReducer(makeState(), { type: 'SET_PROJECT', project });
      expect(next.project).toBe(project);
    });

    it('sets project to null', () => {
      const state = makeState({ project: makeProject() });
      const next = scriptDetailReducer(state, { type: 'SET_PROJECT', project: null });
      expect(next.project).toBeNull();
    });
  });

  // ---- SET_SCRIPT ----
  describe('SET_SCRIPT', () => {
    it('sets a script', () => {
      const script = makeScript();
      const next = scriptDetailReducer(makeState(), { type: 'SET_SCRIPT', script });
      expect(next.script).toBe(script);
    });

    it('sets script to null', () => {
      const state = makeState({ script: makeScript() });
      const next = scriptDetailReducer(state, { type: 'SET_SCRIPT', script: null });
      expect(next.script).toBeNull();
    });
  });

  // ---- SET_SEGMENTS ----
  describe('SET_SEGMENTS', () => {
    it('sets segments', () => {
      const segments = [makeSegment({ id: 'a' }), makeSegment({ id: 'b' })];
      const next = scriptDetailReducer(makeState(), { type: 'SET_SEGMENTS', segments });
      expect(next.segments).toBe(segments);
      expect(next.segments).toHaveLength(2);
    });

    it('replaces existing segments', () => {
      const state = makeState({ segments: [makeSegment({ id: 'old' })] });
      const segments = [makeSegment({ id: 'new' })];
      const next = scriptDetailReducer(state, { type: 'SET_SEGMENTS', segments });
      expect(next.segments).toEqual(segments);
    });
  });

  // ---- SET_LOAD_ERROR ----
  describe('SET_LOAD_ERROR', () => {
    it('sets an error message', () => {
      const next = scriptDetailReducer(makeState(), {
        type: 'SET_LOAD_ERROR',
        loadError: 'Network failure',
      });
      expect(next.loadError).toBe('Network failure');
    });

    it('clears an error message with empty string', () => {
      const state = makeState({ loadError: 'Previous error' });
      const next = scriptDetailReducer(state, { type: 'SET_LOAD_ERROR', loadError: '' });
      expect(next.loadError).toBe('');
    });
  });

  // ---- INCREMENT_RELOAD_TOKEN ----
  describe('INCREMENT_RELOAD_TOKEN', () => {
    it('increments reloadToken from 0', () => {
      const next = scriptDetailReducer(makeState({ reloadToken: 0 }), {
        type: 'INCREMENT_RELOAD_TOKEN',
      });
      expect(next.reloadToken).toBe(1);
    });

    it('increments reloadToken from a positive value', () => {
      const next = scriptDetailReducer(makeState({ reloadToken: 7 }), {
        type: 'INCREMENT_RELOAD_TOKEN',
      });
      expect(next.reloadToken).toBe(8);
    });

    it('preserves all other state fields', () => {
      const state = makeState({ reloadToken: 3, loading: true, isSaving: true });
      const next = scriptDetailReducer(state, { type: 'INCREMENT_RELOAD_TOKEN' });
      expect(next.loading).toBe(true);
      expect(next.isSaving).toBe(true);
    });
  });

  // ---- SET_IS_SAVING ----
  describe('SET_IS_SAVING', () => {
    it('sets isSaving to true', () => {
      const next = scriptDetailReducer(makeState({ isSaving: false }), {
        type: 'SET_IS_SAVING',
        isSaving: true,
      });
      expect(next.isSaving).toBe(true);
    });

    it('sets isSaving to false', () => {
      const next = scriptDetailReducer(makeState({ isSaving: true }), {
        type: 'SET_IS_SAVING',
        isSaving: false,
      });
      expect(next.isSaving).toBe(false);
    });
  });

  // ---- SET_IS_EXPORTING ----
  describe('SET_IS_EXPORTING', () => {
    it('sets isExporting to true', () => {
      const next = scriptDetailReducer(makeState({ isExporting: false }), {
        type: 'SET_IS_EXPORTING',
        isExporting: true,
      });
      expect(next.isExporting).toBe(true);
    });

    it('sets isExporting to false', () => {
      const next = scriptDetailReducer(makeState({ isExporting: true }), {
        type: 'SET_IS_EXPORTING',
        isExporting: false,
      });
      expect(next.isExporting).toBe(false);
    });
  });

  // ---- SET_IS_DELETING ----
  describe('SET_IS_DELETING', () => {
    it('sets isDeleting to true', () => {
      const next = scriptDetailReducer(makeState({ isDeleting: false }), {
        type: 'SET_IS_DELETING',
        isDeleting: true,
      });
      expect(next.isDeleting).toBe(true);
    });

    it('sets isDeleting to false', () => {
      const next = scriptDetailReducer(makeState({ isDeleting: true }), {
        type: 'SET_IS_DELETING',
        isDeleting: false,
      });
      expect(next.isDeleting).toBe(false);
    });
  });

  // ---- SET_DELETE_CONFIRM_OPEN ----
  describe('SET_DELETE_CONFIRM_OPEN', () => {
    it('opens delete confirm dialog', () => {
      const next = scriptDetailReducer(makeState({ deleteConfirmOpen: false }), {
        type: 'SET_DELETE_CONFIRM_OPEN',
        open: true,
      });
      expect(next.deleteConfirmOpen).toBe(true);
    });

    it('closes delete confirm dialog', () => {
      const next = scriptDetailReducer(makeState({ deleteConfirmOpen: true }), {
        type: 'SET_DELETE_CONFIRM_OPEN',
        open: false,
      });
      expect(next.deleteConfirmOpen).toBe(false);
    });
  });

  // ---- RESET_FOR_LOAD ----
  describe('RESET_FOR_LOAD', () => {
    it('resets data fields and sets loading to true', () => {
      const state = makeState({
        loading: false,
        project: makeProject(),
        script: makeScript(),
        segments: [makeSegment()],
        loadError: 'some error',
      });

      const next = scriptDetailReducer(state, { type: 'RESET_FOR_LOAD' });

      expect(next.project).toBeNull();
      expect(next.script).toBeNull();
      expect(next.segments).toEqual([]);
      expect(next.loadError).toBe('');
      expect(next.loading).toBe(true);
    });

    it('preserves non-reset fields (e.g. isSaving, reloadToken)', () => {
      const state = makeState({
        reloadToken: 4,
        isSaving: true,
        isExporting: true,
        isDeleting: true,
        deleteConfirmOpen: true,
      });

      const next = scriptDetailReducer(state, { type: 'RESET_FOR_LOAD' });

      expect(next.reloadToken).toBe(4);
      expect(next.isSaving).toBe(true);
      expect(next.isExporting).toBe(true);
      expect(next.isDeleting).toBe(true);
      expect(next.deleteConfirmOpen).toBe(true);
    });
  });

  // ---- RESET_FOR_RELOAD ----
  describe('RESET_FOR_RELOAD', () => {
    it('resets data fields and sets loading to true', () => {
      const state = makeState({
        loading: false,
        project: makeProject(),
        script: makeScript(),
        segments: [makeSegment()],
        loadError: 'network error',
      });

      const next = scriptDetailReducer(state, { type: 'RESET_FOR_RELOAD' });

      expect(next.project).toBeNull();
      expect(next.script).toBeNull();
      expect(next.segments).toEqual([]);
      expect(next.loadError).toBe('');
      expect(next.loading).toBe(true);
    });

    it('preserves non-reset fields (e.g. isSaving, reloadToken)', () => {
      const state = makeState({
        reloadToken: 2,
        isSaving: false,
        isExporting: true,
      });

      const next = scriptDetailReducer(state, { type: 'RESET_FOR_RELOAD' });

      expect(next.reloadToken).toBe(2);
      expect(next.isSaving).toBe(false);
      expect(next.isExporting).toBe(true);
    });

    it('produces the same result as RESET_FOR_LOAD (identical reset shape)', () => {
      const state = makeState({
        project: makeProject(),
        script: makeScript(),
        segments: [makeSegment()],
        loadError: 'err',
        loading: false,
      });

      const load = scriptDetailReducer(state, { type: 'RESET_FOR_LOAD' });
      const reload = scriptDetailReducer(state, { type: 'RESET_FOR_RELOAD' });

      // Same shape (but not same reference)
      expect(load).toEqual(reload);
    });
  });
});
