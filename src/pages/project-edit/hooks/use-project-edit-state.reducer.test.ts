/**
 * projectEditReducer 测试
 * 覆盖 update action + createInitialProjectEditState + createAutoSetters
 */
import { describe, it, expect, vi } from 'vitest';
import {
  projectEditReducer,
  createInitialProjectEditState,
} from './use-project-edit-state-reducer';
import type { ProjectEditState } from './use-project-edit-state-reducer';
import { createAutoSetters } from '@/shared/hooks/use-auto-setters';

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
  describe('update action (direct value set)', () => {
    it('replaces a field value', () => {
      const next = projectEditReducer(makeState(), {
        type: 'update',
        key: 'formName',
        updater: 'New Name',
      });
      expect(next.formName).toBe('New Name');
    });

    it('does not mutate other fields', () => {
      const state = makeState({ currentStep: 3 });
      const next = projectEditReducer(state, {
        type: 'update',
        key: 'saving',
        updater: true,
      });
      expect(next.saving).toBe(true);
      expect(next.currentStep).toBe(3);
    });
  });

  describe('update action (function updater)', () => {
    it('applies updater function to a field', () => {
      const state = makeState({ reloadToken: 5 });
      const next = projectEditReducer(state, {
        type: 'update',
        key: 'reloadToken',
        updater: (prev: unknown) => (prev as number) + 1,
      });
      expect(next.reloadToken).toBe(6);
    });

    it('updater can use previous value', () => {
      const state = makeState({ formDescription: 'hello' });
      const next = projectEditReducer(state, {
        type: 'update',
        key: 'formDescription',
        updater: (prev: unknown) => (prev as string) + ' world',
      });
      expect(next.formDescription).toBe('hello world');
    });
  });

  describe('default', () => {
    it('returns same state for unknown action', () => {
      const state = makeState();
      const next = projectEditReducer(state, {
        type: 'unknown',
      } as unknown as Parameters<typeof projectEditReducer>[1]);
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

describe('createAutoSetters', () => {
  it('creates all 16 setters', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, makeState());
    expect(Object.keys(setters)).toHaveLength(16);
    expect(setters.formName).toBeInstanceOf(Function);
    expect(setters.project).toBeInstanceOf(Function);
    expect(setters.videoPath).toBeInstanceOf(Function);
  });

  it('setter dispatches update action for direct value', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, makeState());
    setters.formName('New Name');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      key: 'formName',
      updater: 'New Name',
    });
  });

  it('setter dispatches update action for function updater', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, makeState());
    const updater = (prev: number) => prev + 1;
    setters.reloadToken(updater);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      key: 'reloadToken',
      updater,
    });
  });
});
