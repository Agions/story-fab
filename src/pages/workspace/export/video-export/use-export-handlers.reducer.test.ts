import { describe, it, expect } from 'vitest';
import {
  exportHandlersReducer,
  initialExportHandlersState,
  type ExportHandlersState,
} from './use-export-handlers-reducer';

function makeState(overrides: Partial<ExportHandlersState> = {}): ExportHandlersState {
  return { ...initialExportHandlersState({}), ...overrides };
}

describe('exportHandlersReducer', () => {
  describe('update with direct value', () => {
    it('sets exporting to true', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'exporting',
        updater: true,
      });
      expect(result.exporting).toBe(true);
    });

    it('sets progress to 75', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'progress',
        updater: 75,
      });
      expect(result.progress).toBe(75);
    });

    it('sets progressStage', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'progressStage',
        updater: 'Encoding video',
      });
      expect(result.progressStage).toBe('Encoding video');
    });

    it('sets etaSeconds to a number', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'etaSeconds',
        updater: 42,
      });
      expect(result.etaSeconds).toBe(42);
    });

    it('sets etaSeconds to null', () => {
      const result = exportHandlersReducer(makeState({ etaSeconds: 10 }), {
        type: 'update',
        key: 'etaSeconds',
        updater: null,
      });
      expect(result.etaSeconds).toBeNull();
    });

    it('sets exported to true', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'exported',
        updater: true,
      });
      expect(result.exported).toBe(true);
    });

    it('sets exportedFile', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'exportedFile',
        updater: '/tmp/output.mp4',
      });
      expect(result.exportedFile).toBe('/tmp/output.mp4');
    });

    it('sets exportError', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'exportError',
        updater: 'FFmpeg failed',
      });
      expect(result.exportError).toBe('FFmpeg failed');
    });

    it('sets exportError to null', () => {
      const result = exportHandlersReducer(makeState({ exportError: 'err' }), {
        type: 'update',
        key: 'exportError',
        updater: null,
      });
      expect(result.exportError).toBeNull();
    });

    it('sets startTime', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'startTime',
        updater: 1000,
      });
      expect(result.startTime).toBe(1000);
    });

    it('sets selectedPlatform', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'selectedPlatform',
        updater: 'youtube',
      });
      expect(result.selectedPlatform).toBe('youtube');
    });

    it('sets batchMode to true', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'batchMode',
        updater: true,
      });
      expect(result.batchMode).toBe(true);
    });

    it('sets selectedPlatforms', () => {
      const platforms = ['youtube', 'tiktok'];
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'selectedPlatforms',
        updater: platforms,
      });
      expect(result.selectedPlatforms).toEqual(platforms);
    });

    it('sets currentExportId', () => {
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'currentExportId',
        updater: 'export-123',
      });
      expect(result.currentExportId).toBe('export-123');
    });

    it('sets config', () => {
      const config = {
        format: 'webm',
        quality: 'low',
        resolution: '720p',
        fps: 60,
        includeSubtitles: false,
        burnSubtitles: false,
        includeWatermark: true,
      };
      const result = exportHandlersReducer(makeState(), {
        type: 'update',
        key: 'config',
        updater: config,
      });
      expect(result.config).toEqual(config);
    });
  });

  describe('update with function updater', () => {
    it('uses function updater to increment progress', () => {
      const result = exportHandlersReducer(makeState({ progress: 30 }), {
        type: 'update',
        key: 'progress',
        updater: (prev: number) => prev + 10,
      });
      expect(result.progress).toBe(40);
    });

    it('uses function updater to toggle exporting', () => {
      const result = exportHandlersReducer(makeState({ exporting: false }), {
        type: 'update',
        key: 'exporting',
        updater: (prev: boolean) => !prev,
      });
      expect(result.exporting).toBe(true);
    });

    it('uses function updater to append to selectedPlatforms', () => {
      const result = exportHandlersReducer(makeState({ selectedPlatforms: ['youtube'] }), {
        type: 'update',
        key: 'selectedPlatforms',
        updater: (prev: string[]) => [...prev, 'tiktok'],
      });
      expect(result.selectedPlatforms).toEqual(['youtube', 'tiktok']);
    });

    it('uses function updater to modify config', () => {
      const state = makeState();
      const result = exportHandlersReducer(state, {
        type: 'update',
        key: 'config',
        updater: (prev: typeof state.config) => ({ ...prev, fps: 60 }),
      });
      expect(result.config.fps).toBe(60);
      expect(result.config.format).toBe('mp4'); // unchanged
    });
  });

  describe('state immutability', () => {
    it('returns a new state object', () => {
      const state = makeState();
      const result = exportHandlersReducer(state, {
        type: 'update',
        key: 'exporting',
        updater: true,
      });
      expect(result).not.toBe(state);
    });

    it('does not mutate the original state', () => {
      const state = makeState();
      exportHandlersReducer(state, {
        type: 'update',
        key: 'exporting',
        updater: true,
      });
      expect(state.exporting).toBe(false);
    });
  });

  describe('unknown action type', () => {
    it('returns the same state reference', () => {
      const state = makeState();
      // @ts-expect-error testing unknown action type
      const result = exportHandlersReducer(state, { type: 'unknown' });
      expect(result).toBe(state);
    });
  });

  describe('initialExportHandlersState', () => {
    it('uses defaults when no exportSettings provided', () => {
      const state = initialExportHandlersState({});
      expect(state.exporting).toBe(false);
      expect(state.progress).toBe(0);
      expect(state.progressStage).toBe('');
      expect(state.etaSeconds).toBeNull();
      expect(state.exported).toBe(false);
      expect(state.exportedFile).toBeNull();
      expect(state.exportError).toBeNull();
      expect(state.selectedPlatform).toBeNull();
      expect(state.batchMode).toBe(false);
      expect(state.selectedPlatforms).toEqual([]);
      expect(state.currentExportId).toBeNull();
      expect(state.config.format).toBe('mp4');
      expect(state.config.quality).toBe('high');
      expect(state.config.resolution).toBe('1080p');
      expect(state.config.fps).toBe(30);
      expect(state.config.includeSubtitles).toBe(true);
      expect(state.config.burnSubtitles).toBe(true);
      expect(state.config.includeWatermark).toBe(false);
    });

    it('applies provided exportSettings', () => {
      const state = initialExportHandlersState({
        exportSettings: {
          format: 'webm',
          quality: 'low',
          fps: 60,
          includeSubtitles: false,
        },
      });
      expect(state.config.format).toBe('webm');
      expect(state.config.quality).toBe('low');
      expect(state.config.fps).toBe(60);
      expect(state.config.includeSubtitles).toBe(false);
      // defaults for unset fields
      expect(state.config.resolution).toBe('1080p');
      expect(state.config.burnSubtitles).toBe(true);
      expect(state.config.includeWatermark).toBe(false);
    });
  });
});
