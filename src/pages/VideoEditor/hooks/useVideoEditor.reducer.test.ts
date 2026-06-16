import { describe, it, expect } from 'vitest';
import {
  videoEditorReducer,
  initialVideoEditorState,
  type VideoEditorState,
} from './useVideoEditor.reducer';

function makeState(overrides: Partial<VideoEditorState> = {}): VideoEditorState {
  return { ...initialVideoEditorState, ...overrides };
}

describe('videoEditorReducer', () => {
  describe('update with direct value', () => {
    it('sets videoSrc', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'videoSrc',
        updater: '/path/to/video.mp4',
      });
      expect(result.videoSrc).toBe('/path/to/video.mp4');
    });

    it('sets loading to true', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'loading',
        updater: true,
      });
      expect(result.loading).toBe(true);
    });

    it('sets analyzing to true', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'analyzing',
        updater: true,
      });
      expect(result.analyzing).toBe(true);
    });

    it('sets currentTime', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'currentTime',
        updater: 12.5,
      });
      expect(result.currentTime).toBe(12.5);
    });

    it('sets duration', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'duration',
        updater: 120,
      });
      expect(result.duration).toBe(120);
    });

    it('sets isPlaying to true', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'isPlaying',
        updater: true,
      });
      expect(result.isPlaying).toBe(true);
    });

    it('sets segments', () => {
      const segments = [
        { id: '1', start: 0, end: 5, label: 'intro' },
        { id: '2', start: 5, end: 10, label: 'body' },
      ] as any[];
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'segments',
        updater: segments,
      });
      expect(result.segments).toEqual(segments);
    });

    it('sets keyframes', () => {
      const keyframes = ['kf1.png', 'kf2.png'];
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'keyframes',
        updater: keyframes,
      });
      expect(result.keyframes).toEqual(keyframes);
    });

    it('sets selectedSegmentIndex', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'selectedSegmentIndex',
        updater: 2,
      });
      expect(result.selectedSegmentIndex).toBe(2);
    });

    it('sets editHistory', () => {
      const history = [
        [{ id: '1', start: 0, end: 5 }],
        [{ id: '1', start: 0, end: 5 }, { id: '2', start: 5, end: 10 }],
      ] as any[][];
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'editHistory',
        updater: history,
      });
      expect(result.editHistory).toEqual(history);
    });

    it('sets historyIndex', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'historyIndex',
        updater: 1,
      });
      expect(result.historyIndex).toBe(1);
    });

    it('sets outputFormat', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'outputFormat',
        updater: 'webm',
      });
      expect(result.outputFormat).toBe('webm');
    });

    it('sets videoQuality', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'videoQuality',
        updater: 'high',
      });
      expect(result.videoQuality).toBe('high');
    });

    it('sets isSaving to true', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'isSaving',
        updater: true,
      });
      expect(result.isSaving).toBe(true);
    });

    it('sets isExporting to true', () => {
      const result = videoEditorReducer(makeState(), {
        type: 'update',
        key: 'isExporting',
        updater: true,
      });
      expect(result.isExporting).toBe(true);
    });
  });

  describe('update with function updater', () => {
    it('uses function updater to toggle isPlaying', () => {
      const result = videoEditorReducer(makeState({ isPlaying: true }), {
        type: 'update',
        key: 'isPlaying',
        updater: (prev: boolean) => !prev,
      });
      expect(result.isPlaying).toBe(false);
    });

    it('uses function updater to increment currentTime', () => {
      const result = videoEditorReducer(makeState({ currentTime: 5 }), {
        type: 'update',
        key: 'currentTime',
        updater: (prev: number) => prev + 1,
      });
      expect(result.currentTime).toBe(6);
    });

    it('uses function updater to add a segment', () => {
      const segment = { id: '3', start: 10, end: 15 };
      const result = videoEditorReducer(
        makeState({ segments: [{ id: '1', start: 0, end: 5 }] as any[] }),
        {
          type: 'update',
          key: 'segments',
          updater: (prev: any[]) => [...prev, segment],
        },
      );
      expect(result.segments).toHaveLength(2);
      expect(result.segments[1]).toBe(segment);
    });

    it('uses function updater to decrement historyIndex', () => {
      const result = videoEditorReducer(makeState({ historyIndex: 2 }), {
        type: 'update',
        key: 'historyIndex',
        updater: (prev: number) => prev - 1,
      });
      expect(result.historyIndex).toBe(1);
    });

    it('uses function updater to update keyframes', () => {
      const result = videoEditorReducer(makeState({ keyframes: ['a.png'] }), {
        type: 'update',
        key: 'keyframes',
        updater: (prev: string[]) => [...prev, 'b.png'],
      });
      expect(result.keyframes).toEqual(['a.png', 'b.png']);
    });
  });

  describe('state immutability', () => {
    it('returns a new state object', () => {
      const state = makeState();
      const result = videoEditorReducer(state, {
        type: 'update',
        key: 'loading',
        updater: true,
      });
      expect(result).not.toBe(state);
    });

    it('does not mutate the original state', () => {
      const state = makeState();
      videoEditorReducer(state, {
        type: 'update',
        key: 'loading',
        updater: true,
      });
      expect(state.loading).toBe(false);
    });
  });

  describe('unknown action type', () => {
    it('returns the same state reference', () => {
      const state = makeState();
      // @ts-expect-error testing unknown action type
      const result = videoEditorReducer(state, { type: 'unknown' });
      expect(result).toBe(state);
    });
  });

  describe('initialVideoEditorState', () => {
    it('has correct default values', () => {
      expect(initialVideoEditorState.videoSrc).toBe('');
      expect(initialVideoEditorState.loading).toBe(false);
      expect(initialVideoEditorState.analyzing).toBe(false);
      expect(initialVideoEditorState.currentTime).toBe(0);
      expect(initialVideoEditorState.duration).toBe(0);
      expect(initialVideoEditorState.isPlaying).toBe(false);
      expect(initialVideoEditorState.segments).toEqual([]);
      expect(initialVideoEditorState.keyframes).toEqual([]);
      expect(initialVideoEditorState.selectedSegmentIndex).toBe(-1);
      expect(initialVideoEditorState.editHistory).toEqual([]);
      expect(initialVideoEditorState.historyIndex).toBe(-1);
      expect(initialVideoEditorState.outputFormat).toBe('mp4');
      expect(initialVideoEditorState.videoQuality).toBe('medium');
      expect(initialVideoEditorState.isSaving).toBe(false);
      expect(initialVideoEditorState.isExporting).toBe(false);
    });
  });
});
