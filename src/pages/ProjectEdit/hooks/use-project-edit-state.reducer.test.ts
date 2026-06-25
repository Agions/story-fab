/**
 * projectEditReducer 测试
 * 覆盖 set/update 两种 action + createInitialProjectEditState + createProjectEditSetters
 */
import { describe, it, expect, vi } from 'vitest';
import {
  projectEditReducer,
  createInitialProjectEditState,
  createProjectEditSetters,
} from './use-project-edit-state.reducer';
import type { ProjectEditState } from './use-project-edit-state.reducer';

const makeState = (overrides?: Partial<ProjectEditState>): ProjectEditState => ({
  formName: 'Test Project',
  formDescription: 'desc',
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
  saveBehavior: 'stay',
  autoSaveEnabled: true,
  ...overrides,
});

describe('projectEditReducer', () => {
  describe('set action', () => {
    it('replaces a field value', () => {
      const next = projectEditReducer(makeState(), { type: 'set', key: 'formName', value: 'New Name' });
      expect(next.formName).toBe('New Name');
    });

    it('does not mutate other fields', () => {
      const state = makeState({ currentStep: 3 });
      const next = projectEditReducer(state, { type: 'set', key: 'saving', value: true });
      expect(next.saving).toBe(true);
      expect(next.currentStep).toBe(3);
    });
  });

  describe('update action', () => {
    it('applies updater function to a field', () => {
      const state = makeState({ reloadToken: 5 });
      const next = projectEditReducer(state, {
        type: 'update',
        key: 'reloadToken',
        updater: (prev) => (prev as number) + 1,
      });
      expect(next.reloadToken).toBe(6);
    });

    it('updater can use previous value', () => {
      const state = makeState({ formDescription: 'hello' });
      const next = projectEditReducer(state, {
        type: 'update',
        key: 'formDescription',
        updater: (prev) => (prev as string) + ' world',
      });
      expect(next.formDescription).toBe('hello world');
    });
  });

  describe('default', () => {
    it('returns same state for unknown action', () => {
      const state = makeState();
      const next = projectEditReducer(state, { type: 'unknown' } as unknown as Parameters<typeof projectEditReducer>[1]);
      expect(next).toBe(state);
    });
  });
});

describe('createInitialProjectEditState', () => {
  it('creates state with given project name', () => {
    const state = createInitialProjectEditState('My Project', () => 'detail', () => true);
    expect(state.formName).toBe('My Project');
    expect(state.isNewProject).toBe(true);
    expect(state.saveBehavior).toBe('detail');
    expect(state.autoSaveEnabled).toBe(true);
  });

  it('returns fresh object each call', () => {
    const a = createInitialProjectEditState('A', () => 'stay', () => false);
    const b = createInitialProjectEditState('B', () => 'stay', () => false);
    expect(a).not.toBe(b);
  });
});

describe('createProjectEditSetters', () => {
  it('creates all 16 setters', () => {
    const dispatch = vi.fn();
    const setters = createProjectEditSetters(dispatch);
    expect(Object.keys(setters)).toHaveLength(16);
    expect(setters.setFormName).toBeInstanceOf(Function);
    expect(setters.setProject).toBeInstanceOf(Function);
    expect(setters.setVideoPath).toBeInstanceOf(Function);
  });

  it('setter dispatches set action for direct values', () => {
    const dispatch = vi.fn();
    const setters = createProjectEditSetters(dispatch);
    setters.setFormName('New Name');
    expect(dispatch).toHaveBeenCalledWith({ type: 'set', key: 'formName', value: 'New Name' });
  });

  it('setter dispatches update action for function updater', () => {
    const dispatch = vi.fn();
    const setters = createProjectEditSetters(dispatch);
    const updater = (prev: number) => prev + 1;
    setters.setReloadToken(updater);
    expect(dispatch).toHaveBeenCalledWith({ type: 'update', key: 'reloadToken', updater });
  });
});
