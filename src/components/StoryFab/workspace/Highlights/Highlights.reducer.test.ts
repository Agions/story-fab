/**
 * highlightsReducer 测试
 */
import { describe, it, expect } from 'vitest';
import { highlightsReducer, initialHighlightsState } from './Highlights.reducer';
import type { HighlightsState, Highlight } from './Highlights.reducer';

const makeState = (overrides?: Partial<HighlightsState>): HighlightsState => ({
  ...initialHighlightsState,
  ...overrides,
});

const mockHighlights: Highlight[] = [
  { startTime: 10, endTime: 20, score: 0.9, reason: 'High motion' },
  { startTime: 30, endTime: 45, score: 0.7, reason: 'Emotional scene' },
];

describe('highlightsReducer', () => {
  describe('SET_HIGHLIGHTS', () => {
    it('sets highlights array', () => {
      const next = highlightsReducer(makeState(), { type: 'SET_HIGHLIGHTS', highlights: mockHighlights });
      expect(next.highlights).toEqual(mockHighlights);
    });

    it('sets empty highlights array', () => {
      const prev = makeState({ highlights: mockHighlights });
      const next = highlightsReducer(prev, { type: 'SET_HIGHLIGHTS', highlights: [] });
      expect(next.highlights).toEqual([]);
    });

    it('preserves other state fields', () => {
      const prev = makeState({ loading: true, error: 'old error' });
      const next = highlightsReducer(prev, { type: 'SET_HIGHLIGHTS', highlights: mockHighlights });
      expect(next.loading).toBe(true);
      expect(next.error).toBe('old error');
    });
  });

  describe('SET_DETECTED', () => {
    it('sets detected to true', () => {
      const next = highlightsReducer(makeState(), { type: 'SET_DETECTED', detected: true });
      expect(next.detected).toBe(true);
    });

    it('sets detected to false', () => {
      const prev = makeState({ detected: true });
      const next = highlightsReducer(prev, { type: 'SET_DETECTED', detected: false });
      expect(next.detected).toBe(false);
    });
  });

  describe('SET_LOADING', () => {
    it('sets loading to true', () => {
      const next = highlightsReducer(makeState(), { type: 'SET_LOADING', loading: true });
      expect(next.loading).toBe(true);
    });

    it('sets loading to false', () => {
      const prev = makeState({ loading: true });
      const next = highlightsReducer(prev, { type: 'SET_LOADING', loading: false });
      expect(next.loading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('sets error message', () => {
      const next = highlightsReducer(makeState(), { type: 'SET_ERROR', error: 'Network error' });
      expect(next.error).toBe('Network error');
    });

    it('clears error to null', () => {
      const prev = makeState({ error: 'Some error' });
      const next = highlightsReducer(prev, { type: 'SET_ERROR', error: null });
      expect(next.error).toBeNull();
    });
  });

  describe('SET_THRESHOLD', () => {
    it('sets threshold value', () => {
      const next = highlightsReducer(makeState(), { type: 'SET_THRESHOLD', threshold: 2.5 });
      expect(next.threshold).toBe(2.5);
    });

    it('preserves other state fields', () => {
      const prev = makeState({ topN: 5, loading: true });
      const next = highlightsReducer(prev, { type: 'SET_THRESHOLD', threshold: 3.0 });
      expect(next.topN).toBe(5);
      expect(next.loading).toBe(true);
    });
  });

  describe('SET_TOPN', () => {
    it('sets topN value', () => {
      const next = highlightsReducer(makeState(), { type: 'SET_TOPN', topN: 5 });
      expect(next.topN).toBe(5);
    });

    it('preserves other state fields', () => {
      const prev = makeState({ threshold: 2.0 });
      const next = highlightsReducer(prev, { type: 'SET_TOPN', topN: 20 });
      expect(next.threshold).toBe(2.0);
    });
  });

  describe('START_DETECT', () => {
    it('sets loading to true', () => {
      const next = highlightsReducer(makeState(), { type: 'START_DETECT' });
      expect(next.loading).toBe(true);
    });

    it('clears error to null', () => {
      const prev = makeState({ error: 'Previous error' });
      const next = highlightsReducer(prev, { type: 'START_DETECT' });
      expect(next.error).toBeNull();
    });

    it('preserves other state fields', () => {
      const prev = makeState({ highlights: mockHighlights, detected: true, threshold: 2.0, topN: 20 });
      const next = highlightsReducer(prev, { type: 'START_DETECT' });
      expect(next.highlights).toEqual(mockHighlights);
      expect(next.detected).toBe(true);
      expect(next.threshold).toBe(2.0);
      expect(next.topN).toBe(20);
    });
  });

  describe('DETECT_SUCCESS', () => {
    it('sets highlights from action', () => {
      const next = highlightsReducer(makeState(), { type: 'DETECT_SUCCESS', highlights: mockHighlights });
      expect(next.highlights).toEqual(mockHighlights);
    });

    it('sets detected to true', () => {
      const prev = makeState({ detected: false });
      const next = highlightsReducer(prev, { type: 'DETECT_SUCCESS', highlights: mockHighlights });
      expect(next.detected).toBe(true);
    });

    it('sets loading to false', () => {
      const prev = makeState({ loading: true });
      const next = highlightsReducer(prev, { type: 'DETECT_SUCCESS', highlights: mockHighlights });
      expect(next.loading).toBe(false);
    });

    it('preserves threshold and topN', () => {
      const prev = makeState({ threshold: 2.5, topN: 15 });
      const next = highlightsReducer(prev, { type: 'DETECT_SUCCESS', highlights: mockHighlights });
      expect(next.threshold).toBe(2.5);
      expect(next.topN).toBe(15);
    });
  });

  describe('DETECT_FAILURE', () => {
    it('sets error message', () => {
      const next = highlightsReducer(makeState(), { type: 'DETECT_FAILURE', error: 'API timeout' });
      expect(next.error).toBe('API timeout');
    });

    it('sets loading to false', () => {
      const prev = makeState({ loading: true });
      const next = highlightsReducer(prev, { type: 'DETECT_FAILURE', error: 'API timeout' });
      expect(next.loading).toBe(false);
    });

    it('preserves other state fields', () => {
      const prev = makeState({ highlights: mockHighlights, detected: true, threshold: 2.0, topN: 5 });
      const next = highlightsReducer(prev, { type: 'DETECT_FAILURE', error: 'fail' });
      expect(next.highlights).toEqual(mockHighlights);
      expect(next.detected).toBe(true);
      expect(next.threshold).toBe(2.0);
      expect(next.topN).toBe(5);
    });
  });

  describe('FINISH_DETECT', () => {
    it('sets loading to false', () => {
      const prev = makeState({ loading: true });
      const next = highlightsReducer(prev, { type: 'FINISH_DETECT' });
      expect(next.loading).toBe(false);
    });

    it('preserves all other state fields', () => {
      const prev = makeState({
        highlights: mockHighlights,
        detected: true,
        error: 'some error',
        threshold: 2.5,
        topN: 15,
      });
      const next = highlightsReducer(prev, { type: 'FINISH_DETECT' });
      expect(next.highlights).toEqual(mockHighlights);
      expect(next.detected).toBe(true);
      expect(next.error).toBe('some error');
      expect(next.threshold).toBe(2.5);
      expect(next.topN).toBe(15);
    });
  });

  describe('default', () => {
    it('returns same state for unknown action', () => {
      const state = makeState();
      expect(highlightsReducer(state, { type: 'UNKNOWN' } as unknown as Parameters<typeof highlightsReducer>[1])).toBe(state);
    });
  });
});
