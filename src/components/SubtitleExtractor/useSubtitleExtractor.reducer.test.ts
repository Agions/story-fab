import { describe, it, expect } from 'vitest';
import {
  subtitleExtractorReducer,
  initialSubtitleExtractorState,
  type SubtitleExtractorState,
  type SubtitleSegment,
} from './useSubtitleExtractor.reducer';

function makeState(overrides: Partial<SubtitleExtractorState> = {}): SubtitleExtractorState {
  return { ...initialSubtitleExtractorState, ...overrides };
}

const mockSegment: SubtitleSegment = {
  id: 'seg-1',
  startTime: 0,
  endTime: 5000,
  start: '00:00:00,000',
  end: '00:00:05,000',
  text: 'Hello world',
  quality: 'high',
};

const mockSegment2: SubtitleSegment = {
  id: 'seg-2',
  startTime: 5000,
  endTime: 10000,
  start: '00:00:05,000',
  end: '00:00:10,000',
  text: 'Goodbye world',
  quality: 'medium',
};

describe('subtitleExtractorReducer', () => {
  describe('default / unknown action', () => {
    it('returns the same state reference for an unknown action type', () => {
      const state = makeState();
      // @ts-expect-error testing unknown action
      const result = subtitleExtractorReducer(state, { type: 'UNKNOWN' });
      expect(result).toBe(state);
    });
  });

  describe('SET_FORMAT', () => {
    it('updates format to vtt', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_FORMAT',
        format: 'vtt',
      });
      expect(result.format).toBe('vtt');
    });

    it('updates format to txt', () => {
      const result = subtitleExtractorReducer(makeState({ format: 'vtt' }), {
        type: 'SET_FORMAT',
        format: 'txt',
      });
      expect(result.format).toBe('txt');
    });

    it('preserves other state fields', () => {
      const state = makeState({ translate: true, progress: 50 });
      const result = subtitleExtractorReducer(state, {
        type: 'SET_FORMAT',
        format: 'srt',
      });
      expect(result.translate).toBe(true);
      expect(result.progress).toBe(50);
    });
  });

  describe('SET_TRANSLATE', () => {
    it('sets translate to true', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_TRANSLATE',
        translate: true,
      });
      expect(result.translate).toBe(true);
    });

    it('sets translate to false', () => {
      const result = subtitleExtractorReducer(makeState({ translate: true }), {
        type: 'SET_TRANSLATE',
        translate: false,
      });
      expect(result.translate).toBe(false);
    });
  });

  describe('SET_IS_EXTRACTING', () => {
    it('sets isExtracting to true', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_IS_EXTRACTING',
        isExtracting: true,
      });
      expect(result.isExtracting).toBe(true);
    });

    it('sets isExtracting to false', () => {
      const result = subtitleExtractorReducer(makeState({ isExtracting: true }), {
        type: 'SET_IS_EXTRACTING',
        isExtracting: false,
      });
      expect(result.isExtracting).toBe(false);
    });
  });

  describe('SET_PROGRESS', () => {
    it('sets progress to a specific value', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_PROGRESS',
        progress: 42,
      });
      expect(result.progress).toBe(42);
    });

    it('sets progress to 0', () => {
      const result = subtitleExtractorReducer(makeState({ progress: 80 }), {
        type: 'SET_PROGRESS',
        progress: 0,
      });
      expect(result.progress).toBe(0);
    });

    it('sets progress to 100', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_PROGRESS',
        progress: 100,
      });
      expect(result.progress).toBe(100);
    });
  });

  describe('INCREMENT_PROGRESS', () => {
    it('increments progress by delta', () => {
      const result = subtitleExtractorReducer(makeState({ progress: 10 }), {
        type: 'INCREMENT_PROGRESS',
        delta: 5,
        cap: 100,
      });
      expect(result.progress).toBe(15);
    });

    it('caps progress at the cap value', () => {
      const result = subtitleExtractorReducer(makeState({ progress: 95 }), {
        type: 'INCREMENT_PROGRESS',
        delta: 10,
        cap: 100,
      });
      expect(result.progress).toBe(100);
    });

    it('does not exceed cap when delta is very large', () => {
      const result = subtitleExtractorReducer(makeState({ progress: 0 }), {
        type: 'INCREMENT_PROGRESS',
        delta: 999,
        cap: 50,
      });
      expect(result.progress).toBe(50);
    });

    it('works when progress is already at cap', () => {
      const result = subtitleExtractorReducer(makeState({ progress: 100 }), {
        type: 'INCREMENT_PROGRESS',
        delta: 1,
        cap: 100,
      });
      expect(result.progress).toBe(100);
    });
  });

  describe('SET_EXTRACTED_SUBTITLES', () => {
    it('replaces extracted subtitles', () => {
      const subtitles = [mockSegment, mockSegment2];
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_EXTRACTED_SUBTITLES',
        subtitles,
      });
      expect(result.extractedSubtitles).toEqual(subtitles);
    });

    it('sets subtitles to empty array', () => {
      const result = subtitleExtractorReducer(
        makeState({ extractedSubtitles: [mockSegment] }),
        { type: 'SET_EXTRACTED_SUBTITLES', subtitles: [] },
      );
      expect(result.extractedSubtitles).toEqual([]);
    });
  });

  describe('UPDATE_SUBTITLE_TEXT', () => {
    it('updates text of the matching subtitle', () => {
      const state = makeState({ extractedSubtitles: [mockSegment, mockSegment2] });
      const result = subtitleExtractorReducer(state, {
        type: 'UPDATE_SUBTITLE_TEXT',
        id: 'seg-1',
        text: 'Updated text',
      });
      expect(result.extractedSubtitles[0].text).toBe('Updated text');
      expect(result.extractedSubtitles[1].text).toBe('Goodbye world');
    });

    it('does not modify other subtitle properties', () => {
      const state = makeState({ extractedSubtitles: [mockSegment] });
      const result = subtitleExtractorReducer(state, {
        type: 'UPDATE_SUBTITLE_TEXT',
        id: 'seg-1',
        text: 'New',
      });
      expect(result.extractedSubtitles[0].startTime).toBe(0);
      expect(result.extractedSubtitles[0].endTime).toBe(5000);
      expect(result.extractedSubtitles[0].quality).toBe('high');
    });

    it('leaves subtitles unchanged if no id matches', () => {
      const state = makeState({ extractedSubtitles: [mockSegment] });
      const result = subtitleExtractorReducer(state, {
        type: 'UPDATE_SUBTITLE_TEXT',
        id: 'non-existent',
        text: 'New',
      });
      expect(result.extractedSubtitles[0].text).toBe('Hello world');
    });
  });

  describe('SET_EDITING_ID', () => {
    it('sets editingId to a string', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_EDITING_ID',
        editingId: 'seg-1',
      });
      expect(result.editingId).toBe('seg-1');
    });

    it('sets editingId to null', () => {
      const result = subtitleExtractorReducer(makeState({ editingId: 'seg-1' }), {
        type: 'SET_EDITING_ID',
        editingId: null,
      });
      expect(result.editingId).toBeNull();
    });
  });

  describe('SET_EDITING_TEXT', () => {
    it('sets editingText', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_EDITING_TEXT',
        editingText: 'some text',
      });
      expect(result.editingText).toBe('some text');
    });

    it('sets editingText to empty string', () => {
      const result = subtitleExtractorReducer(makeState({ editingText: 'old' }), {
        type: 'SET_EDITING_TEXT',
        editingText: '',
      });
      expect(result.editingText).toBe('');
    });
  });

  describe('SET_ACTIVE_SUB_ID', () => {
    it('sets activeSubId to a string', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_ACTIVE_SUB_ID',
        activeSubId: 'seg-2',
      });
      expect(result.activeSubId).toBe('seg-2');
    });

    it('sets activeSubId to null', () => {
      const result = subtitleExtractorReducer(makeState({ activeSubId: 'seg-2' }), {
        type: 'SET_ACTIVE_SUB_ID',
        activeSubId: null,
      });
      expect(result.activeSubId).toBeNull();
    });
  });

  describe('SET_VIDEO_DURATION', () => {
    it('sets videoDuration', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'SET_VIDEO_DURATION',
        videoDuration: 120000,
      });
      expect(result.videoDuration).toBe(120000);
    });

    it('sets videoDuration to 0', () => {
      const result = subtitleExtractorReducer(makeState({ videoDuration: 60000 }), {
        type: 'SET_VIDEO_DURATION',
        videoDuration: 0,
      });
      expect(result.videoDuration).toBe(0);
    });
  });

  describe('START_EDIT', () => {
    it('sets editingId and editingText from the subtitle', () => {
      const result = subtitleExtractorReducer(makeState(), {
        type: 'START_EDIT',
        sub: mockSegment,
      });
      expect(result.editingId).toBe('seg-1');
      expect(result.editingText).toBe('Hello world');
    });

    it('overwrites previous editing state', () => {
      const state = makeState({ editingId: 'old-id', editingText: 'old text' });
      const result = subtitleExtractorReducer(state, {
        type: 'START_EDIT',
        sub: mockSegment2,
      });
      expect(result.editingId).toBe('seg-2');
      expect(result.editingText).toBe('Goodbye world');
    });
  });

  describe('CANCEL_EDIT', () => {
    it('clears editingId and editingText', () => {
      const state = makeState({ editingId: 'seg-1', editingText: 'editing...' });
      const result = subtitleExtractorReducer(state, { type: 'CANCEL_EDIT' });
      expect(result.editingId).toBeNull();
      expect(result.editingText).toBe('');
    });

    it('is a no-op when already not editing', () => {
      const state = makeState();
      const result = subtitleExtractorReducer(state, { type: 'CANCEL_EDIT' });
      expect(result.editingId).toBeNull();
      expect(result.editingText).toBe('');
    });
  });

  describe('RESET_FOR_EXTRACT', () => {
    it('resets extraction-related state', () => {
      const state = makeState({
        isExtracting: false,
        progress: 80,
        extractedSubtitles: [mockSegment],
        activeSubId: 'seg-1',
      });
      const result = subtitleExtractorReducer(state, { type: 'RESET_FOR_EXTRACT' });
      expect(result.isExtracting).toBe(true);
      expect(result.progress).toBe(0);
      expect(result.extractedSubtitles).toEqual([]);
      expect(result.activeSubId).toBeNull();
    });

    it('preserves unrelated fields like format, translate, editing state', () => {
      const state = makeState({
        format: 'vtt',
        translate: true,
        editingId: 'seg-1',
        editingText: 'editing',
        videoDuration: 60000,
      });
      const result = subtitleExtractorReducer(state, { type: 'RESET_FOR_EXTRACT' });
      expect(result.format).toBe('vtt');
      expect(result.translate).toBe(true);
      expect(result.editingId).toBe('seg-1');
      expect(result.editingText).toBe('editing');
      expect(result.videoDuration).toBe(60000);
    });
  });
});
