import { describe, it, expect } from 'vitest';
import {
  videoEditorPageReducer,
  initialVideoEditorPageState,
  type VideoEditorPageState,
  type VideoEditorPageAction,
} from './use-video-editor-page.reducer';
import type { Updater } from '@/shared/hooks/useAutoSetters';
import type { ScriptSegment } from '@/types';

// ── helpers ──────────────────────────────────────────────────
const sampleSegment: ScriptSegment = {
  id: 'seg-1',
  startTime: 0,
  endTime: 5,
  text: 'Hello world',
  speaker: 'narrator',
} as unknown as ScriptSegment;

const sampleSegment2: ScriptSegment = {
  id: 'seg-2',
  startTime: 5,
  endTime: 10,
  text: 'Goodbye',
  speaker: 'narrator',
} as unknown as ScriptSegment;

/** Fully-populated state for mutation checks */
const populatedState: VideoEditorPageState = {
  currentTime: 3.5,
  duration: 60,
  isPlaying: true,
  processing: true,
  processProgress: 42,
  selectedSegment: sampleSegment,
  editedSegments: [sampleSegment],
  exportSettings: {
    videoQuality: 'high',
    exportFormat: 'webm',
    transitionType: 'dissolve',
    transitionDuration: 2,
    audioVolume: 80,
    useSubtitles: false,
  },
  settingsTab: 'advanced',
  showSettingsModal: true,
  showPreviewModal: true,
  previewSegment: sampleSegment,
  previewLoading: true,
  previewUrl: 'https://example.com/preview.mp4',
  isDragging: true,
  dragType: 'end',
  dragSegmentId: 'seg-1',
};

// helper: build an 'update' action for a given key
function upd<K extends keyof VideoEditorPageState>(
  key: K,
  updater: Updater<VideoEditorPageState[K]>,
): VideoEditorPageAction {
  return { type: 'update', key, updater: updater as Updater<unknown> };
}

// ── tests ────────────────────────────────────────────────────
describe('videoEditorPageReducer', () => {
  // ── initial state ──────────────────────────────────────────
  it('exports the expected initial state', () => {
    expect(initialVideoEditorPageState).toEqual({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      processing: false,
      processProgress: 0,
      selectedSegment: null,
      editedSegments: [],
      exportSettings: {
        videoQuality: 'medium',
        exportFormat: 'mp4',
        transitionType: 'fade',
        transitionDuration: 1,
        audioVolume: 100,
        useSubtitles: true,
      },
      settingsTab: 'general',
      showSettingsModal: false,
      showPreviewModal: false,
      previewSegment: null,
      previewLoading: false,
      previewUrl: '',
      isDragging: false,
      dragType: null,
      dragSegmentId: null,
    });
  });

  // ── default / unknown action ───────────────────────────────
  describe('default case', () => {
    it('returns same state reference for unknown action type', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        // @ts-expect-error — intentional unknown action for runtime safety
        { type: 'UNKNOWN', key: 'currentTime', updater: 1 },
      );
      expect(next).toBe(initialVideoEditorPageState);
    });
  });

  // ── currentTime ────────────────────────────────────────────
  describe('currentTime', () => {
    it('sets a direct value', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('currentTime', 12.5),
      );
      expect(next.currentTime).toBe(12.5);
    });

    it('applies an updater function', () => {
      const next = videoEditorPageReducer(populatedState, upd('currentTime', (prev) => prev + 1));
      expect(next.currentTime).toBe(4.5);
    });

    it('does not mutate other fields', () => {
      const next = videoEditorPageReducer(populatedState, upd('currentTime', 0));
      expect(next.duration).toBe(populatedState.duration);
      expect(next.isPlaying).toBe(populatedState.isPlaying);
    });
  });

  // ── duration ───────────────────────────────────────────────
  describe('duration', () => {
    it('sets a direct value', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('duration', 120),
      );
      expect(next.duration).toBe(120);
    });

    it('applies an updater function', () => {
      const next = videoEditorPageReducer(populatedState, upd('duration', (d) => d * 2));
      expect(next.duration).toBe(120);
    });
  });

  // ── isPlaying ──────────────────────────────────────────────
  describe('isPlaying', () => {
    it('toggles from false to true', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('isPlaying', true),
      );
      expect(next.isPlaying).toBe(true);
    });

    it('toggles from true to false', () => {
      const next = videoEditorPageReducer(populatedState, upd('isPlaying', false));
      expect(next.isPlaying).toBe(false);
    });
  });

  // ── processing ─────────────────────────────────────────────
  describe('processing', () => {
    it('sets to true', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('processing', true),
      );
      expect(next.processing).toBe(true);
    });

    it('sets to false', () => {
      const next = videoEditorPageReducer(populatedState, upd('processing', false));
      expect(next.processing).toBe(false);
    });
  });

  // ── processProgress ────────────────────────────────────────
  describe('processProgress', () => {
    it('sets a direct value', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('processProgress', 75),
      );
      expect(next.processProgress).toBe(75);
    });

    it('applies an updater function (increment)', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('processProgress', (p) => p + 10),
      );
      expect(next.processProgress).toBe(52);
    });
  });

  // ── selectedSegment ────────────────────────────────────────
  describe('selectedSegment', () => {
    it('sets to a segment', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('selectedSegment', sampleSegment),
      );
      expect(next.selectedSegment).toBe(sampleSegment);
    });

    it('sets to null', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('selectedSegment', null),
      );
      expect(next.selectedSegment).toBeNull();
    });
  });

  // ── editedSegments ─────────────────────────────────────────
  describe('editedSegments', () => {
    it('replaces the array', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('editedSegments', [sampleSegment, sampleSegment2]),
      );
      expect(next.editedSegments).toEqual([sampleSegment, sampleSegment2]);
    });

    it('appends via updater function', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('editedSegments', (prev) => [...prev, sampleSegment2]),
      );
      expect(next.editedSegments).toHaveLength(2);
      expect(next.editedSegments[1]).toBe(sampleSegment2);
    });
  });

  // ── exportSettings ─────────────────────────────────────────
  describe('exportSettings', () => {
    it('replaces the entire object', () => {
      const newSettings = {
        ...populatedState.exportSettings,
        videoQuality: 'low',
        exportFormat: 'gif',
      };
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('exportSettings', newSettings),
      );
      expect(next.exportSettings).toEqual(newSettings);
    });

    it('patches via updater function', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('exportSettings', (prev) => ({ ...prev, audioVolume: 50 })),
      );
      expect(next.exportSettings.audioVolume).toBe(50);
      expect(next.exportSettings.videoQuality).toBe('high'); // unchanged
    });
  });

  // ── settingsTab ────────────────────────────────────────────
  describe('settingsTab', () => {
    it('sets to a new value', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('settingsTab', 'advanced'),
      );
      expect(next.settingsTab).toBe('advanced');
    });
  });

  // ── showSettingsModal ──────────────────────────────────────
  describe('showSettingsModal', () => {
    it('sets to true', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('showSettingsModal', true),
      );
      expect(next.showSettingsModal).toBe(true);
    });

    it('sets to false', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('showSettingsModal', false),
      );
      expect(next.showSettingsModal).toBe(false);
    });
  });

  // ── showPreviewModal ──────────────────────────────────────
  describe('showPreviewModal', () => {
    it('sets to true', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('showPreviewModal', true),
      );
      expect(next.showPreviewModal).toBe(true);
    });

    it('sets to false', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('showPreviewModal', false),
      );
      expect(next.showPreviewModal).toBe(false);
    });
  });

  // ── previewSegment ─────────────────────────────────────────
  describe('previewSegment', () => {
    it('sets to a segment', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('previewSegment', sampleSegment),
      );
      expect(next.previewSegment).toBe(sampleSegment);
    });

    it('sets to null', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('previewSegment', null),
      );
      expect(next.previewSegment).toBeNull();
    });
  });

  // ── previewLoading ─────────────────────────────────────────
  describe('previewLoading', () => {
    it('sets to true', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('previewLoading', true),
      );
      expect(next.previewLoading).toBe(true);
    });

    it('sets to false', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('previewLoading', false),
      );
      expect(next.previewLoading).toBe(false);
    });
  });

  // ── previewUrl ─────────────────────────────────────────────
  describe('previewUrl', () => {
    it('sets a URL string', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('previewUrl', 'https://cdn.example.com/v.mp4'),
      );
      expect(next.previewUrl).toBe('https://cdn.example.com/v.mp4');
    });

    it('clears to empty string', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('previewUrl', ''),
      );
      expect(next.previewUrl).toBe('');
    });
  });

  // ── isDragging ─────────────────────────────────────────────
  describe('isDragging', () => {
    it('sets to true', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('isDragging', true),
      );
      expect(next.isDragging).toBe(true);
    });

    it('sets to false', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('isDragging', false),
      );
      expect(next.isDragging).toBe(false);
    });
  });

  // ── dragType ───────────────────────────────────────────────
  describe('dragType', () => {
    it.each(['move', 'start', 'end'] as const)('sets to %s', (val) => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('dragType', val),
      );
      expect(next.dragType).toBe(val);
    });

    it('sets to null', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('dragType', null),
      );
      expect(next.dragType).toBeNull();
    });
  });

  // ── dragSegmentId ──────────────────────────────────────────
  describe('dragSegmentId', () => {
    it('sets to a string', () => {
      const next = videoEditorPageReducer(
        initialVideoEditorPageState,
        upd('dragSegmentId', 'seg-42'),
      );
      expect(next.dragSegmentId).toBe('seg-42');
    });

    it('sets to null', () => {
      const next = videoEditorPageReducer(
        populatedState,
        upd('dragSegmentId', null),
      );
      expect(next.dragSegmentId).toBeNull();
    });
  });

  // ── immutability ───────────────────────────────────────────
  it('never mutates the input state object', () => {
    const snapshot = { ...populatedState, exportSettings: { ...populatedState.exportSettings } };
    const keys: (keyof VideoEditorPageState)[] = [
      'currentTime', 'duration', 'isPlaying', 'processing', 'processProgress',
      'selectedSegment', 'editedSegments', 'exportSettings', 'settingsTab',
      'showSettingsModal', 'showPreviewModal', 'previewSegment', 'previewLoading',
      'previewUrl', 'isDragging', 'dragType', 'dragSegmentId',
    ];
    for (const key of keys) {
      videoEditorPageReducer(populatedState, { type: 'update', key, updater: 'mutated' as unknown as Updater<unknown> });
    }
    expect(populatedState).toEqual(snapshot);
  });

  // ── 'update' action returns a new object ───────────────────
  it('returns a new state object (not the same reference)', () => {
    const next = videoEditorPageReducer(
      initialVideoEditorPageState,
      upd('currentTime', 1),
    );
    expect(next).not.toBe(initialVideoEditorPageState);
    expect(next.currentTime).toBe(1);
    // all other fields are preserved
    expect(next.duration).toBe(initialVideoEditorPageState.duration);
  });

  // ── updater function receives correct prev ─────────────────
  describe('updater function semantics', () => {
    it('receives the current value of the key as prev', () => {
      let receivedPrev: unknown;
      videoEditorPageReducer(populatedState, upd('processProgress', (prev) => {
        receivedPrev = prev;
        return prev;
      }));
      expect(receivedPrev).toBe(42);
    });

    it('chains multiple updates correctly', () => {
      let state = initialVideoEditorPageState;
      state = videoEditorPageReducer(state, upd('processProgress', 25));
      state = videoEditorPageReducer(state, upd('processProgress', (p) => p + 25));
      expect(state.processProgress).toBe(50);
    });
  });
});
