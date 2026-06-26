import { describe, it, expect } from 'vitest';
import {
  clipRipplingReducer,
  initialClipRipplingState,
  type ClipRipplingState,
  type ClipRipplingAction,
} from './clip-rippling.reducer';
import type { SocialPlatform, AspectRatio } from './clip-rippling-config';
import type { RepurposingClip, PipelineStage } from '../../../core/services/pipeline/clip-pipeline/pipeline';

// ── Test helpers ──────────────────────────────────────────────

const baseState: ClipRipplingState = { ...initialClipRipplingState };

function makeClip(overrides: Partial<RepurposingClip> = {}): RepurposingClip {
  return {
    clip: { id: 'clip-1' } as unknown as RepurposingClip['clip'],
    score: {} as unknown as RepurposingClip['score'],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe('clipRipplingReducer', () => {
  // ── SET_PLATFORM ────────────────────────────────────────────
  describe('SET_PLATFORM', () => {
    it('sets the platform to a new value', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_PLATFORM',
        platform: 'tiktok',
      });
      expect(state.platform).toBe('tiktok');
    });

    it('does not mutate other state fields', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_PLATFORM',
        platform: 'youtube_shorts',
      });
      expect(state.selectedFormats).toBe(baseState.selectedFormats);
      expect(state.targetCount).toBe(baseState.targetCount);
      expect(state.running).toBe(baseState.running);
    });

    it('supports all platform values', () => {
      const platforms: SocialPlatform[] = [
        'douyin',
        'xiaohongshu',
        'bilibili',
        'youtube_shorts',
        'tiktok',
      ];
      for (const platform of platforms) {
        const state = clipRipplingReducer(baseState, {
          type: 'SET_PLATFORM',
          platform,
        });
        expect(state.platform).toBe(platform);
      }
    });
  });

  // ── SET_SELECTED_FORMATS ────────────────────────────────────
  describe('SET_SELECTED_FORMATS', () => {
    it('replaces the selected formats array', () => {
      const formats: AspectRatio[] = ['16:9', '1:1'];
      const state = clipRipplingReducer(baseState, {
        type: 'SET_SELECTED_FORMATS',
        selectedFormats: formats,
      });
      expect(state.selectedFormats).toEqual(formats);
    });

    it('handles empty array', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_SELECTED_FORMATS',
        selectedFormats: [],
      });
      expect(state.selectedFormats).toEqual([]);
    });
  });

  // ── TOGGLE_SELECTED_FORMAT ──────────────────────────────────
  describe('TOGGLE_SELECTED_FORMAT', () => {
    it('adds a format that is not currently selected', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'TOGGLE_SELECTED_FORMAT',
        format: '16:9',
      });
      expect(state.selectedFormats).toContain('16:9');
      // original formats should still be there
      expect(state.selectedFormats).toContain('9:16');
      expect(state.selectedFormats).toContain('1:1');
    });

    it('removes a format that is currently selected', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'TOGGLE_SELECTED_FORMAT',
        format: '9:16',
      });
      expect(state.selectedFormats).not.toContain('9:16');
      expect(state.selectedFormats).toContain('1:1');
    });

    it('toggling twice returns to original state', () => {
      const once = clipRipplingReducer(baseState, {
        type: 'TOGGLE_SELECTED_FORMAT',
        format: '16:9',
      });
      const twice = clipRipplingReducer(once, {
        type: 'TOGGLE_SELECTED_FORMAT',
        format: '16:9',
      });
      expect(twice.selectedFormats).toEqual(baseState.selectedFormats);
    });
  });

  // ── SET_TARGET_COUNT ────────────────────────────────────────
  describe('SET_TARGET_COUNT', () => {
    it('sets target count', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_TARGET_COUNT',
        targetCount: 10,
      });
      expect(state.targetCount).toBe(10);
    });

    it('allows zero target count', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_TARGET_COUNT',
        targetCount: 0,
      });
      expect(state.targetCount).toBe(0);
    });
  });

  // ── SET_RUNNING ─────────────────────────────────────────────
  describe('SET_RUNNING', () => {
    it('sets running to true', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_RUNNING',
        running: true,
      });
      expect(state.running).toBe(true);
    });

    it('sets running to false', () => {
      const runningState = { ...baseState, running: true };
      const state = clipRipplingReducer(runningState, {
        type: 'SET_RUNNING',
        running: false,
      });
      expect(state.running).toBe(false);
    });
  });

  // ── SET_PROGRESS ────────────────────────────────────────────
  describe('SET_PROGRESS', () => {
    it('sets progress value', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_PROGRESS',
        progress: 42,
      });
      expect(state.progress).toBe(42);
    });

    it('handles progress of 0', () => {
      const stateWithProgress = { ...baseState, progress: 50 };
      const state = clipRipplingReducer(stateWithProgress, {
        type: 'SET_PROGRESS',
        progress: 0,
      });
      expect(state.progress).toBe(0);
    });

    it('handles progress of 100', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_PROGRESS',
        progress: 100,
      });
      expect(state.progress).toBe(100);
    });
  });

  // ── SET_STAGE ───────────────────────────────────────────────
  describe('SET_STAGE', () => {
    it('sets a pipeline stage', () => {
      const stages: PipelineStage[] = [
        'analyzing',
        'scoring',
        'generating_seo',
        'exporting',
      ];
      for (const stage of stages) {
        const state = clipRipplingReducer(baseState, {
          type: 'SET_STAGE',
          stage,
        });
        expect(state.stage).toBe(stage);
      }
    });

    it('sets stage to empty string', () => {
      const stateWithStage = { ...baseState, stage: 'scoring' as PipelineStage | '' };
      const state = clipRipplingReducer(stateWithStage, {
        type: 'SET_STAGE',
        stage: '',
      });
      expect(state.stage).toBe('');
    });
  });

  // ── SET_RESULTS ─────────────────────────────────────────────
  describe('SET_RESULTS', () => {
    it('replaces results array', () => {
      const clips = [makeClip(), makeClip({ clip: { id: 'clip-2' } as RepurposingClip['clip'] })];
      const state = clipRipplingReducer(baseState, {
        type: 'SET_RESULTS',
        results: clips,
      });
      expect(state.results).toHaveLength(2);
      expect(state.results).toBe(clips);
    });

    it('handles empty results', () => {
      const stateWithResults = { ...baseState, results: [makeClip()] };
      const state = clipRipplingReducer(stateWithResults, {
        type: 'SET_RESULTS',
        results: [],
      });
      expect(state.results).toEqual([]);
    });
  });

  // ── SET_SELECTED_CLIPS ──────────────────────────────────────
  describe('SET_SELECTED_CLIPS', () => {
    it('replaces selected clips set', () => {
      const clips = new Set(['a', 'b', 'c']);
      const state = clipRipplingReducer(baseState, {
        type: 'SET_SELECTED_CLIPS',
        selectedClips: clips,
      });
      expect(state.selectedClips).toBe(clips);
      expect(state.selectedClips.size).toBe(3);
    });

    it('handles empty set', () => {
      const stateWithClips = {
        ...baseState,
        selectedClips: new Set(['x']),
      };
      const state = clipRipplingReducer(stateWithClips, {
        type: 'SET_SELECTED_CLIPS',
        selectedClips: new Set(),
      });
      expect(state.selectedClips.size).toBe(0);
    });
  });

  // ── TOGGLE_CLIP ─────────────────────────────────────────────
  describe('TOGGLE_CLIP', () => {
    it('adds an id that is not in the set', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'TOGGLE_CLIP',
        id: 'clip-42',
      });
      expect(state.selectedClips.has('clip-42')).toBe(true);
    });

    it('removes an id that is already in the set', () => {
      const stateWithClip = {
        ...baseState,
        selectedClips: new Set(['clip-42']),
      };
      const state = clipRipplingReducer(stateWithClip, {
        type: 'TOGGLE_CLIP',
        id: 'clip-42',
      });
      expect(state.selectedClips.has('clip-42')).toBe(false);
    });

    it('does not affect other ids in the set', () => {
      const stateWithClips = {
        ...baseState,
        selectedClips: new Set(['clip-1', 'clip-2']),
      };
      const state = clipRipplingReducer(stateWithClips, {
        type: 'TOGGLE_CLIP',
        id: 'clip-1',
      });
      expect(state.selectedClips.has('clip-1')).toBe(false);
      expect(state.selectedClips.has('clip-2')).toBe(true);
    });

    it('toggling the same id twice returns to original state', () => {
      const once = clipRipplingReducer(baseState, {
        type: 'TOGGLE_CLIP',
        id: 'clip-new',
      });
      const twice = clipRipplingReducer(once, {
        type: 'TOGGLE_CLIP',
        id: 'clip-new',
      });
      expect(twice.selectedClips.size).toBe(0);
    });
  });

  // ── SET_EXPORTING ───────────────────────────────────────────
  describe('SET_EXPORTING', () => {
    it('sets exporting to true', () => {
      const state = clipRipplingReducer(baseState, {
        type: 'SET_EXPORTING',
        exporting: true,
      });
      expect(state.exporting).toBe(true);
    });

    it('sets exporting to false', () => {
      const stateExporting = { ...baseState, exporting: true };
      const state = clipRipplingReducer(stateExporting, {
        type: 'SET_EXPORTING',
        exporting: false,
      });
      expect(state.exporting).toBe(false);
    });
  });

  // ── SET_EXPORTED_PATHS ──────────────────────────────────────
  describe('SET_EXPORTED_PATHS', () => {
    it('replaces exported paths', () => {
      const paths = ['/tmp/out1.mp4', '/tmp/out2.mp4'];
      const state = clipRipplingReducer(baseState, {
        type: 'SET_EXPORTED_PATHS',
        exportedPaths: paths,
      });
      expect(state.exportedPaths).toEqual(paths);
    });

    it('handles empty paths', () => {
      const stateWithPaths = {
        ...baseState,
        exportedPaths: ['/tmp/a.mp4'],
      };
      const state = clipRipplingReducer(stateWithPaths, {
        type: 'SET_EXPORTED_PATHS',
        exportedPaths: [],
      });
      expect(state.exportedPaths).toEqual([]);
    });
  });

  // ── RESET_RUN ───────────────────────────────────────────────
  describe('RESET_RUN', () => {
    it('resets running, progress, results, and exportedPaths', () => {
      const dirtyState: ClipRipplingState = {
        ...baseState,
        running: false,
        progress: 85,
        results: [makeClip()],
        exportedPaths: ['/tmp/export.mp4'],
        selectedClips: new Set(['clip-1']),
      };
      const state = clipRipplingReducer(dirtyState, { type: 'RESET_RUN' });

      expect(state.running).toBe(true);
      expect(state.progress).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.exportedPaths).toEqual([]);
    });

    it('preserves platform, selectedFormats, targetCount, stage, selectedClips, and exporting', () => {
      const dirtyState: ClipRipplingState = {
        platform: 'tiktok',
        selectedFormats: ['16:9'],
        targetCount: 3,
        running: false,
        progress: 50,
        stage: 'scoring',
        results: [makeClip()],
        selectedClips: new Set(['clip-1']),
        exporting: true,
        exportedPaths: ['/tmp/a.mp4'],
      };
      const state = clipRipplingReducer(dirtyState, { type: 'RESET_RUN' });

      expect(state.platform).toBe('tiktok');
      expect(state.selectedFormats).toEqual(['16:9']);
      expect(state.targetCount).toBe(3);
      expect(state.stage).toBe('scoring');
      expect(state.selectedClips).toEqual(dirtyState.selectedClips);
      expect(state.exporting).toBe(true);
    });

    it('sets running to true even if it was already true', () => {
      const state = clipRipplingReducer(baseState, { type: 'RESET_RUN' });
      expect(state.running).toBe(true);
    });
  });

  // ── default case ────────────────────────────────────────────
  describe('default', () => {
    it('returns the same state reference for unknown actions', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as unknown as ClipRipplingAction;
      const state = clipRipplingReducer(baseState, unknownAction);
      expect(state).toBe(baseState);
    });
  });

  // ── immutability ────────────────────────────────────────────
  describe('immutability', () => {
    it('does not mutate the original state object', () => {
      const original: ClipRipplingState = {
        platform: 'douyin',
        selectedFormats: ['9:16', '1:1'],
        targetCount: 5,
        running: false,
        progress: 0,
        stage: '',
        results: [],
        selectedClips: new Set(),
        exporting: false,
        exportedPaths: [],
      };
      const frozen = { ...original };

      clipRipplingReducer(original, { type: 'SET_PLATFORM', platform: 'tiktok' });
      clipRipplingReducer(original, { type: 'SET_TARGET_COUNT', targetCount: 99 });
      clipRipplingReducer(original, { type: 'SET_PROGRESS', progress: 50 });
      clipRipplingReducer(original, { type: 'TOGGLE_CLIP', id: 'new' });
      clipRipplingReducer(original, { type: 'TOGGLE_SELECTED_FORMAT', format: '16:9' });

      expect(original.platform).toBe(frozen.platform);
      expect(original.targetCount).toBe(frozen.targetCount);
      expect(original.progress).toBe(frozen.progress);
      expect(original.selectedClips.size).toBe(0);
      expect(original.selectedFormats).toEqual(frozen.selectedFormats);
    });
  });
});
