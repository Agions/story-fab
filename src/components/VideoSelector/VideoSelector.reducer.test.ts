import { describe, it, expect } from 'vitest';
import {
  videoSelectorReducer,
  initialVideoSelectorState,
  type VideoSelectorState,
  type VideoSelectorAction,
} from './VideoSelector.reducer';
import type { VideoMetadata } from '@/core/video';

const sampleMetadata: VideoMetadata = {
  duration: 12.5,
  width: 1920,
  height: 1080,
  fps: 30,
  codec: 'h264',
  bitrate: 5_000_000,
};

const populatedState: VideoSelectorState = {
  videoPath: '/videos/test.mp4',
  videoSrc: 'asset://localhost/test.mp4',
  metadata: sampleMetadata,
  isAnalyzing: true,
  isDragging: true,
};

describe('videoSelectorReducer', () => {
  // ── Initial state ──────────────────────────────────────────
  it('exports the expected initial state', () => {
    expect(initialVideoSelectorState).toEqual({
      videoPath: null,
      videoSrc: null,
      metadata: null,
      isAnalyzing: false,
      isDragging: false,
    });
  });

  // ── SET_VIDEO_PATH ─────────────────────────────────────────
  describe('SET_VIDEO_PATH', () => {
    it('sets videoPath to a string value', () => {
      const next = videoSelectorReducer(initialVideoSelectorState, {
        type: 'SET_VIDEO_PATH',
        videoPath: '/videos/new.mp4',
      });
      expect(next.videoPath).toBe('/videos/new.mp4');
    });

    it('sets videoPath to null', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_VIDEO_PATH',
        videoPath: null,
      });
      expect(next.videoPath).toBeNull();
    });

    it('does not mutate other fields', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_VIDEO_PATH',
        videoPath: '/other.mp4',
      });
      expect(next.videoSrc).toBe(populatedState.videoSrc);
      expect(next.metadata).toBe(populatedState.metadata);
      expect(next.isAnalyzing).toBe(populatedState.isAnalyzing);
      expect(next.isDragging).toBe(populatedState.isDragging);
    });
  });

  // ── SET_VIDEO_SRC ──────────────────────────────────────────
  describe('SET_VIDEO_SRC', () => {
    it('sets videoSrc to a string value', () => {
      const next = videoSelectorReducer(initialVideoSelectorState, {
        type: 'SET_VIDEO_SRC',
        videoSrc: 'blob:http://localhost/abc',
      });
      expect(next.videoSrc).toBe('blob:http://localhost/abc');
    });

    it('sets videoSrc to null', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_VIDEO_SRC',
        videoSrc: null,
      });
      expect(next.videoSrc).toBeNull();
    });

    it('does not mutate other fields', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_VIDEO_SRC',
        videoSrc: 'blob:x',
      });
      expect(next.videoPath).toBe(populatedState.videoPath);
      expect(next.metadata).toBe(populatedState.metadata);
    });
  });

  // ── SET_METADATA ───────────────────────────────────────────
  describe('SET_METADATA', () => {
    it('sets metadata to a VideoMetadata object', () => {
      const next = videoSelectorReducer(initialVideoSelectorState, {
        type: 'SET_METADATA',
        metadata: sampleMetadata,
      });
      expect(next.metadata).toEqual(sampleMetadata);
    });

    it('sets metadata to null', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_METADATA',
        metadata: null,
      });
      expect(next.metadata).toBeNull();
    });

    it('does not mutate other fields', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_METADATA',
        metadata: { ...sampleMetadata, duration: 99 },
      });
      expect(next.videoPath).toBe(populatedState.videoPath);
      expect(next.videoSrc).toBe(populatedState.videoSrc);
    });
  });

  // ── SET_IS_ANALYZING ───────────────────────────────────────
  describe('SET_IS_ANALYZING', () => {
    it('sets isAnalyzing to true', () => {
      const next = videoSelectorReducer(initialVideoSelectorState, {
        type: 'SET_IS_ANALYZING',
        isAnalyzing: true,
      });
      expect(next.isAnalyzing).toBe(true);
    });

    it('sets isAnalyzing to false', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_IS_ANALYZING',
        isAnalyzing: false,
      });
      expect(next.isAnalyzing).toBe(false);
    });

    it('does not mutate other fields', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_IS_ANALYZING',
        isAnalyzing: false,
      });
      expect(next.videoPath).toBe(populatedState.videoPath);
      expect(next.isDragging).toBe(populatedState.isDragging);
    });
  });

  // ── SET_IS_DRAGGING ────────────────────────────────────────
  describe('SET_IS_DRAGGING', () => {
    it('sets isDragging to true', () => {
      const next = videoSelectorReducer(initialVideoSelectorState, {
        type: 'SET_IS_DRAGGING',
        isDragging: true,
      });
      expect(next.isDragging).toBe(true);
    });

    it('sets isDragging to false', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_IS_DRAGGING',
        isDragging: false,
      });
      expect(next.isDragging).toBe(false);
    });

    it('does not mutate other fields', () => {
      const next = videoSelectorReducer(populatedState, {
        type: 'SET_IS_DRAGGING',
        isDragging: false,
      });
      expect(next.videoPath).toBe(populatedState.videoPath);
      expect(next.isAnalyzing).toBe(populatedState.isAnalyzing);
    });
  });

  // ── RESET ──────────────────────────────────────────────────
  describe('RESET', () => {
    it('returns to initialVideoSelectorState', () => {
      const next = videoSelectorReducer(populatedState, { type: 'RESET' });
      expect(next).toEqual(initialVideoSelectorState);
    });

    it('is a no-op when state is already initial', () => {
      const next = videoSelectorReducer(initialVideoSelectorState, {
        type: 'RESET',
      });
      expect(next).toEqual(initialVideoSelectorState);
    });

    it('returns the initialVideoSelectorState constant (same reference)', () => {
      const next = videoSelectorReducer(populatedState, { type: 'RESET' });
      expect(next).toBe(initialVideoSelectorState);
      expect(next).toEqual(initialVideoSelectorState);
    });
  });

  // ── default / unknown action ───────────────────────────────
  describe('default case', () => {
    it('returns the same state reference for an unknown action', () => {
      const next = videoSelectorReducer(
        initialVideoSelectorState,
        // @ts-expect-error — intentional unknown action for runtime safety
        { type: 'UNKNOWN_ACTION' },
      );
      expect(next).toBe(initialVideoSelectorState);
    });
  });

  // ── immutability ───────────────────────────────────────────
  it('never mutates the input state object', () => {
    const snapshot = { ...initialVideoSelectorState };
    const actions: VideoSelectorAction[] = [
      { type: 'SET_VIDEO_PATH', videoPath: '/x.mp4' },
      { type: 'SET_VIDEO_SRC', videoSrc: 'blob:x' },
      { type: 'SET_METADATA', metadata: sampleMetadata },
      { type: 'SET_IS_ANALYZING', isAnalyzing: true },
      { type: 'SET_IS_DRAGGING', isDragging: true },
      { type: 'RESET' },
    ];
    for (const action of actions) {
      videoSelectorReducer(initialVideoSelectorState, action);
    }
    expect(initialVideoSelectorState).toEqual(snapshot);
  });
});
