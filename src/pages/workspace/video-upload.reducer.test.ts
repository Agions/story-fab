import { describe, it, expect } from 'vitest';
import {
  videoUploadReducer,
  initialVideoUploadState,
  type VideoUploadState,
} from './video-upload.reducer';

function makeState(overrides: Partial<VideoUploadState> = {}): VideoUploadState {
  return { ...initialVideoUploadState, ...overrides };
}

describe('videoUploadReducer', () => {
  describe('SET_UPLOADING', () => {
    it('sets uploading to true', () => {
      const result = videoUploadReducer(makeState(), { type: 'SET_UPLOADING', uploading: true });
      expect(result.uploading).toBe(true);
    });

    it('sets uploading to false', () => {
      const result = videoUploadReducer(makeState({ uploading: true }), {
        type: 'SET_UPLOADING',
        uploading: false,
      });
      expect(result.uploading).toBe(false);
    });
  });

  describe('SET_UPLOAD_PROGRESS', () => {
    it('sets upload progress', () => {
      const result = videoUploadReducer(makeState(), {
        type: 'SET_UPLOAD_PROGRESS',
        uploadProgress: 50,
      });
      expect(result.uploadProgress).toBe(50);
    });

    it('sets progress to 0', () => {
      const result = videoUploadReducer(makeState({ uploadProgress: 80 }), {
        type: 'SET_UPLOAD_PROGRESS',
        uploadProgress: 0,
      });
      expect(result.uploadProgress).toBe(0);
    });

    it('sets progress to 100', () => {
      const result = videoUploadReducer(makeState(), {
        type: 'SET_UPLOAD_PROGRESS',
        uploadProgress: 100,
      });
      expect(result.uploadProgress).toBe(100);
    });
  });

  describe('SET_DRAG_ACTIVE', () => {
    it('sets dragActive to true', () => {
      const result = videoUploadReducer(makeState(), {
        type: 'SET_DRAG_ACTIVE',
        dragActive: true,
      });
      expect(result.dragActive).toBe(true);
    });

    it('sets dragActive to false', () => {
      const result = videoUploadReducer(makeState({ dragActive: true }), {
        type: 'SET_DRAG_ACTIVE',
        dragActive: false,
      });
      expect(result.dragActive).toBe(false);
    });
  });

  describe('SET_UPLOAD_STATUS', () => {
    it.each(['idle', 'uploading', 'paused', 'completed'] as const)(
      'sets uploadStatus to %s',
      (status) => {
        const result = videoUploadReducer(makeState(), {
          type: 'SET_UPLOAD_STATUS',
          uploadStatus: status,
        });
        expect(result.uploadStatus).toBe(status);
      },
    );
  });

  describe('SET_CURRENT_FILE', () => {
    it('sets currentFile to a file', () => {
      const file = new File(['data'], 'video.mp4', { type: 'video/mp4' });
      const result = videoUploadReducer(makeState(), {
        type: 'SET_CURRENT_FILE',
        currentFile: file,
      });
      expect(result.currentFile).toBe(file);
    });

    it('sets currentFile to null', () => {
      const file = new File(['data'], 'video.mp4', { type: 'video/mp4' });
      const result = videoUploadReducer(makeState({ currentFile: file }), {
        type: 'SET_CURRENT_FILE',
        currentFile: null,
      });
      expect(result.currentFile).toBeNull();
    });
  });

  describe('START_UPLOAD', () => {
    it('sets uploading, progress, status, and currentFile', () => {
      const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      const prev = makeState({ uploading: false, uploadProgress: 42, uploadStatus: 'idle' });
      const result = videoUploadReducer(prev, { type: 'START_UPLOAD', file });

      expect(result.uploading).toBe(true);
      expect(result.uploadProgress).toBe(0);
      expect(result.uploadStatus).toBe('uploading');
      expect(result.currentFile).toBe(file);
    });

    it('preserves dragActive from previous state', () => {
      const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      const prev = makeState({ dragActive: true });
      const result = videoUploadReducer(prev, { type: 'START_UPLOAD', file });
      expect(result.dragActive).toBe(true);
    });
  });

  describe('TOGGLE_PAUSE', () => {
    it('toggles from uploading to paused', () => {
      const result = videoUploadReducer(makeState({ uploadStatus: 'uploading' }), {
        type: 'TOGGLE_PAUSE',
      });
      expect(result.uploadStatus).toBe('paused');
    });

    it('toggles from paused to uploading', () => {
      const result = videoUploadReducer(makeState({ uploadStatus: 'paused' }), {
        type: 'TOGGLE_PAUSE',
      });
      expect(result.uploadStatus).toBe('uploading');
    });

    it('toggles from idle to uploading', () => {
      const result = videoUploadReducer(makeState({ uploadStatus: 'idle' }), {
        type: 'TOGGLE_PAUSE',
      });
      expect(result.uploadStatus).toBe('uploading');
    });

    it('toggles from completed to uploading', () => {
      const result = videoUploadReducer(makeState({ uploadStatus: 'completed' }), {
        type: 'TOGGLE_PAUSE',
      });
      expect(result.uploadStatus).toBe('uploading');
    });
  });

  describe('COMPLETE_UPLOAD', () => {
    it('sets progress to 100 and status to completed', () => {
      const prev = makeState({ uploadProgress: 75, uploadStatus: 'uploading' });
      const result = videoUploadReducer(prev, { type: 'COMPLETE_UPLOAD' });
      expect(result.uploadProgress).toBe(100);
      expect(result.uploadStatus).toBe('completed');
    });

    it('preserves uploading and currentFile', () => {
      const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      const prev = makeState({ uploading: true, currentFile: file });
      const result = videoUploadReducer(prev, { type: 'COMPLETE_UPLOAD' });
      expect(result.uploading).toBe(true);
      expect(result.currentFile).toBe(file);
    });
  });

  describe('RESET', () => {
    it('resets all upload-related fields to initial values', () => {
      const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      const prev = makeState({
        uploading: true,
        uploadProgress: 80,
        uploadStatus: 'uploading',
        currentFile: file,
      });
      const result = videoUploadReducer(prev, { type: 'RESET' });

      expect(result.uploading).toBe(false);
      expect(result.uploadProgress).toBe(0);
      expect(result.uploadStatus).toBe('idle');
      expect(result.currentFile).toBeNull();
    });

    it('preserves dragActive', () => {
      const prev = makeState({ dragActive: true });
      const result = videoUploadReducer(prev, { type: 'RESET' });
      expect(result.dragActive).toBe(true);
    });
  });

  describe('unknown action', () => {
    it('returns the same state reference', () => {
      const state = makeState();
      // @ts-expect-error testing unknown action
      const result = videoUploadReducer(state, { type: 'UNKNOWN' });
      expect(result).toBe(state);
    });
  });
});
