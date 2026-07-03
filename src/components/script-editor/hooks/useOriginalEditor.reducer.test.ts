import { describe, it, expect } from 'vitest';
import type { ScriptSegment } from '@/types';
import {
  originalEditorReducer,
  initialOriginalEditorState,
  type OriginalEditorState,
  type OriginalEditorAction,
} from '@/hooks/use-script-editor.reducer';

const makeSegment = (overrides: Partial<ScriptSegment> = {}): ScriptSegment => ({
  id: 'seg-default',
  startTime: 0,
  endTime: 10,
  ...overrides,
});

// ---------- helpers ----------
const makeState = (
  overrides: Partial<OriginalEditorState> = {},
): OriginalEditorState => ({
  ...initialOriginalEditorState([]),
  ...overrides,
});

const update = (
  key: keyof OriginalEditorState,
  updater: unknown,
): OriginalEditorAction => ({ type: 'update', key, updater });

// ---------- initialOriginalEditorState ----------
describe('initialOriginalEditorState', () => {
  it('uses provided segments', () => {
    const segments = [makeSegment({ content: 'hi' })];
    const state = initialOriginalEditorState(segments);
    expect(state.segments).toBe(segments);
  });

  it('returns expected defaults', () => {
    const state = initialOriginalEditorState([]);
    expect(state.editingIndex).toBeNull();
    expect(state.formValues).toEqual({ start: 0, end: 30, type: 'narration', content: '' });
    expect(state.formError).toBe('');
    expect(state.previewVisible).toBe(false);
    expect(state.previewSrc).toBe('');
    expect(state.previewLoading).toBe(false);
    expect(state.aiModalVisible).toBe(false);
    expect(state.exportMenuOpen).toBe(false);
    expect(state.deleteConfirmOpen).toBe(false);
    expect(state.deleteTargetIndex).toBeNull();
    expect(state.totalDuration).toBe(0);
  });
});

// ---------- originalEditorReducer ----------
describe('originalEditorReducer', () => {
  it('returns the same state reference for unknown action types', () => {
    const state = makeState();
    const result = originalEditorReducer(
      state,
      { type: 'unknown' } as unknown as OriginalEditorAction,
    );
    expect(result).toBe(state);
  });

  // ---- each state key with a direct value ----
  describe('direct value updater', () => {
    const cases: [keyof OriginalEditorState, unknown][] = [
      ['segments', [makeSegment({ startTime: 0, endTime: 5, type: 'dialogue', content: 'x' })]],
      ['editingIndex', 3],
      ['formValues', { start: 1, end: 2, type: 'scene', content: 'abc' }],
      ['formError', 'bad input'],
      ['previewVisible', true],
      ['previewSrc', 'blob://url'],
      ['previewLoading', true],
      ['aiModalVisible', true],
      ['exportMenuOpen', true],
      ['deleteConfirmOpen', true],
      ['deleteTargetIndex', 7],
      ['totalDuration', 120],
    ];

    it.each(cases)('sets %s to the provided value', (key, value) => {
      const state = makeState();
      const result = originalEditorReducer(state, update(key, value));
      expect(result[key]).toEqual(value);
    });
  });

  // ---- function updater ----
  describe('function updater', () => {
    it('invokes the updater with the current value', () => {
      const state = makeState({ editingIndex: 2 });
      const result = originalEditorReducer(
        state,
        update('editingIndex', (prev: number | null) => (prev ?? 0) + 1),
      );
      expect(result.editingIndex).toBe(3);
    });

    it('applies updater to segments (array)', () => {
      const segs = [makeSegment({ content: 'a' })];
      const state = makeState({ segments: segs });
      const result = originalEditorReducer(
        state,
        update('segments', (prev: ScriptSegment[]) => [
          ...prev,
          makeSegment({ startTime: 10, endTime: 20, type: 'dialogue', content: 'b' }),
        ]),
      );
      expect(result.segments).toHaveLength(2);
    });

    it('toggles previewVisible via function updater', () => {
      const state = makeState({ previewVisible: false });
      const result = originalEditorReducer(
        state,
        update('previewVisible', (prev: boolean) => !prev),
      );
      expect(result.previewVisible).toBe(true);
    });

    it('accumulates totalDuration', () => {
      const state = makeState({ totalDuration: 60 });
      const result = originalEditorReducer(
        state,
        update('totalDuration', (prev: number) => prev + 30),
      );
      expect(result.totalDuration).toBe(90);
    });

    it('clears formError with a function updater returning empty string', () => {
      const state = makeState({ formError: 'error!' });
      const result = originalEditorReducer(
        state,
        update('formError', () => ''),
      );
      expect(result.formError).toBe('');
    });
  });

  // ---- immutability ----
  describe('immutability', () => {
    it('does not mutate the original state', () => {
      const state = makeState({ editingIndex: 1, previewVisible: false });
      originalEditorReducer(state, update('editingIndex', 5));
      originalEditorReducer(state, update('previewVisible', true));
      expect(state.editingIndex).toBe(1);
      expect(state.previewVisible).toBe(false);
    });

    it('returns a new object reference', () => {
      const state = makeState({ totalDuration: 42 });
      const result = originalEditorReducer(state, update('totalDuration', 42));
      expect(result).not.toBe(state);
      expect(result).toEqual(state); // same values but different reference
    });

    it('preserves untouched keys', () => {
      const state = makeState({ segments: [makeSegment({ content: 'a' })], totalDuration: 99 });
      const result = originalEditorReducer(state, update('segments', [makeSegment({ content: 'b' })]));
      expect(result.totalDuration).toBe(99);
    });
  });
});
