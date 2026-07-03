/**
 * videoProcessingReducer 测试
 */
import { describe, it, expect } from 'vitest';
import { videoProcessingReducer, initialVideoProcessingState } from '@/hooks/use-video-processing.reducer';
import type { VideoProcessingState, CustomQualitySettings, VideoProcessingAction } from '@/hooks/use-video-processing.reducer';

const makeState = (overrides?: Partial<VideoProcessingState>): VideoProcessingState => ({
  ...initialVideoProcessingState,
  ...overrides,
});

describe('videoProcessingReducer', () => {
  describe('update action — direct value', () => {
    it('sets videoQuality', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'videoQuality', updater: 'high' });
      expect(next.videoQuality).toBe('high');
    });

    it('sets exportFormat', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'exportFormat', updater: 'webm' });
      expect(next.exportFormat).toBe('webm');
    });

    it('sets transitionType', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'transitionType', updater: 'dissolve' });
      expect(next.transitionType).toBe('dissolve');
    });

    it('sets transitionDuration', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'transitionDuration', updater: 2.5 });
      expect(next.transitionDuration).toBe(2.5);
    });

    it('sets audioProcess', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'audioProcess', updater: 'denoise' });
      expect(next.audioProcess).toBe('denoise');
    });

    it('sets audioVolume', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'audioVolume', updater: 50 });
      expect(next.audioVolume).toBe(50);
    });

    it('sets useSubtitles', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'useSubtitles', updater: false });
      expect(next.useSubtitles).toBe(false);
    });

    it('sets processingBatch', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'processingBatch', updater: true });
      expect(next.processingBatch).toBe(true);
    });

    it('sets currentBatchItem', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'currentBatchItem', updater: 3 });
      expect(next.currentBatchItem).toBe(3);
    });

    it('sets batchProgress', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'batchProgress', updater: 75 });
      expect(next.batchProgress).toBe(75);
    });

    it('sets batchItems', () => {
      const items = [{ id: '1', videoPath: '/v.mp4', segments: [], name: 'test', completed: false }];
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'batchItems', updater: items });
      expect(next.batchItems).toEqual(items);
    });

    it('sets customSettings', () => {
      const settings = { resolution: '3840x2160', bitrate: 8000, framerate: 60, useHardwareAcceleration: false };
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'customSettings', updater: settings });
      expect(next.customSettings).toEqual(settings);
    });

    it('sets activePanels', () => {
      const next = videoProcessingReducer(makeState(), { type: 'update', key: 'activePanels', updater: ['basic', 'effects'] });
      expect(next.activePanels).toEqual(['basic', 'effects']);
    });
  });

  describe('update action — function updater', () => {
    it('increments currentBatchItem', () => {
      const prev = makeState({ currentBatchItem: 2 });
      const next = videoProcessingReducer(prev, { type: 'update', key: 'currentBatchItem', updater: (p: number) => p + 1 });
      expect(next.currentBatchItem).toBe(3);
    });

    it('toggles processingBatch', () => {
      const prev = makeState({ processingBatch: true });
      const next = videoProcessingReducer(prev, { type: 'update', key: 'processingBatch', updater: (p: boolean) => !p });
      expect(next.processingBatch).toBe(false);
    });

    it('updates customSettings partially', () => {
      const prev = makeState();
      const next = videoProcessingReducer(prev, {
        type: 'update', key: 'customSettings',
        updater: (p: CustomQualitySettings) => ({ ...p, bitrate: 10000 }),
      });
      expect(next.customSettings.bitrate).toBe(10000);
      expect(next.customSettings.resolution).toBe('1920x1080');
    });
  });

  describe('default', () => {
    it('returns same state for unknown action type', () => {
      const state = makeState();
      const next = videoProcessingReducer(state, { type: 'unknown' } as unknown as VideoProcessingAction);
      expect(next).toBe(state);
    });
  });

  describe('immutability', () => {
    it('does not mutate original state', () => {
      const state = makeState();
      videoProcessingReducer(state, { type: 'update', key: 'videoQuality', updater: 'ultra' });
      expect(state.videoQuality).toBe('medium');
    });

    it('returns new object reference', () => {
      const state = makeState();
      const next = videoProcessingReducer(state, { type: 'update', key: 'videoQuality', updater: 'high' });
      expect(next).not.toBe(state);
    });
  });
});
