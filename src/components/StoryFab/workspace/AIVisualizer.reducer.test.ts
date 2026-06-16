/**
 * aiVisualizerReducer 测试
 */
import { describe, it, expect } from 'vitest';
import { aiVisualizerReducer, initialAIVisualizerState } from './AIVisualizer.reducer';
import type { AIVisualizerState } from './AIVisualizer.reducer';

const makeState = (overrides?: Partial<AIVisualizerState>): AIVisualizerState => ({
  ...initialAIVisualizerState,
  ...overrides,
});

describe('aiVisualizerReducer', () => {
  describe('simple setters', () => {
    it('SET_ANALYZING', () => {
      expect(aiVisualizerReducer(makeState(), { type: 'SET_ANALYZING', analyzing: true }).analyzing).toBe(true);
    });

    it('SET_PROGRESS', () => {
      expect(aiVisualizerReducer(makeState(), { type: 'SET_PROGRESS', progress: 75 }).progress).toBe(75);
    });

    it('SET_CURRENT_TASK_KEY', () => {
      expect(aiVisualizerReducer(makeState(), { type: 'SET_CURRENT_TASK_KEY', currentTaskKey: 'scene' }).currentTaskKey).toBe('scene');
    });

    it('SET_COMPLETED_TASKS', () => {
      const tasks = ['scene', 'ocr'];
      expect(aiVisualizerReducer(makeState(), { type: 'SET_COMPLETED_TASKS', completedTasks: tasks }).completedTasks).toEqual(tasks);
    });

    it('SET_VISIBLE_TASKS', () => {
      const tasks = ['scene'];
      expect(aiVisualizerReducer(makeState(), { type: 'SET_VISIBLE_TASKS', visibleTasks: tasks }).visibleTasks).toEqual(tasks);
    });

    it('SET_CONFIG', () => {
      const config = { sceneDetection: false, objectDetection: false, emotionAnalysis: false, ocrEnabled: false, asrEnabled: false };
      expect(aiVisualizerReducer(makeState(), { type: 'SET_CONFIG', config }).config).toEqual(config);
    });
  });

  describe('TOGGLE_CONFIG', () => {
    it('toggles a config key from true to false', () => {
      const next = aiVisualizerReducer(makeState(), { type: 'TOGGLE_CONFIG', key: 'sceneDetection' });
      expect(next.config.sceneDetection).toBe(false);
    });

    it('toggles a config key from false to true', () => {
      const prev = makeState({ config: { ...initialAIVisualizerState.config, sceneDetection: false } });
      const next = aiVisualizerReducer(prev, { type: 'TOGGLE_CONFIG', key: 'sceneDetection' });
      expect(next.config.sceneDetection).toBe(true);
    });

    it('does not affect other config keys', () => {
      const next = aiVisualizerReducer(makeState(), { type: 'TOGGLE_CONFIG', key: 'ocrEnabled' });
      expect(next.config.sceneDetection).toBe(true);
      expect(next.config.objectDetection).toBe(true);
    });
  });

  describe('APPEND_COMPLETED_TASK', () => {
    it('appends task key to completedTasks', () => {
      const prev = makeState({ completedTasks: ['scene'] });
      const next = aiVisualizerReducer(prev, { type: 'APPEND_COMPLETED_TASK', taskKey: 'ocr' });
      expect(next.completedTasks).toEqual(['scene', 'ocr']);
    });

    it('appends to empty array', () => {
      const next = aiVisualizerReducer(makeState(), { type: 'APPEND_COMPLETED_TASK', taskKey: 'scene' });
      expect(next.completedTasks).toEqual(['scene']);
    });
  });

  describe('APPEND_VISIBLE_TASK', () => {
    it('appends task key to visibleTasks', () => {
      const prev = makeState({ visibleTasks: ['scene'] });
      const next = aiVisualizerReducer(prev, { type: 'APPEND_VISIBLE_TASK', taskKey: 'ocr' });
      expect(next.visibleTasks).toEqual(['scene', 'ocr']);
    });
  });

  describe('RESET_FOR_RUN', () => {
    it('resets analyzing state for new run', () => {
      const prev = makeState({
        analyzing: false,
        progress: 100,
        completedTasks: ['a', 'b'],
        visibleTasks: ['a'],
        currentTaskKey: 'done',
      });
      const next = aiVisualizerReducer(prev, { type: 'RESET_FOR_RUN' });
      expect(next.analyzing).toBe(true);
      expect(next.progress).toBe(0);
      expect(next.completedTasks).toEqual([]);
      expect(next.visibleTasks).toEqual([]);
      expect(next.currentTaskKey).toBe('');
    });

    it('preserves config on reset', () => {
      const customConfig = { ...initialAIVisualizerState.config, sceneDetection: false };
      const prev = makeState({ config: customConfig });
      const next = aiVisualizerReducer(prev, { type: 'RESET_FOR_RUN' });
      expect(next.config.sceneDetection).toBe(false);
    });
  });

  describe('INCREMENT_PROGRESS', () => {
    it('calculates progress percentage', () => {
      const next = aiVisualizerReducer(makeState(), { type: 'INCREMENT_PROGRESS', completed: 3, total: 4 });
      expect(next.progress).toBe(75);
    });

    it('rounds to nearest integer', () => {
      const next = aiVisualizerReducer(makeState(), { type: 'INCREMENT_PROGRESS', completed: 1, total: 3 });
      expect(next.progress).toBe(33); // 33.33 → 33
    });
  });

  describe('default', () => {
    it('returns same state for unknown action', () => {
      const state = makeState();
      expect(aiVisualizerReducer(state, { type: 'UNKNOWN' as any })).toBe(state);
    });
  });
});
