import { describe, it, expect } from 'vitest';
import {
  segmentRowReducer,
  initialSegmentRowState,
  scriptEditorReducer,
  initialScriptEditorState,
  SegmentRowState,
  ScriptEditorState,
} from './commentary-script-editor-reducer';

// ─── SegmentRow reducer ────────────────────────────────────────────

describe('segmentRowReducer', () => {
  it('has correct initial state', () => {
    expect(initialSegmentRowState).toEqual({ editing: false, text: '' });
  });

  describe('SET_EDITING', () => {
    it('sets editing to true', () => {
      const result = segmentRowReducer(initialSegmentRowState, {
        type:'SET_EDITING', payload: true,
      });
      expect(result).toEqual({ editing: true, text: '' });
    });

    it('sets editing to false', () => {
      const state: SegmentRowState = { editing: true, text: 'hello' };
      const result = segmentRowReducer(state, {
        type:'SET_EDITING', payload: false,
      });
      expect(result).toEqual({ editing: false, text: 'hello' });
    });

    it('preserves text when toggling editing', () => {
      const state: SegmentRowState = { editing: false, text: 'preserved' };
      const result = segmentRowReducer(state, { type:'SET_EDITING', payload: true });
      expect(result.text).toBe('preserved');
    });
  });

  describe('SET_TEXT', () => {
    it('updates text', () => {
      const result = segmentRowReducer(initialSegmentRowState, {
        type:'SET_TEXT', payload: 'new text',
      });
      expect(result).toEqual({ editing: false, text: 'new text' });
    });

    it('preserves editing flag', () => {
      const state: SegmentRowState = { editing: true, text: 'old' };
      const result = segmentRowReducer(state, { type:'SET_TEXT', payload: 'new' });
      expect(result.editing).toBe(true);
      expect(result.text).toBe('new');
    });

    it('handles empty text', () => {
      const state: SegmentRowState = { editing: true, text: 'something' };
      const result = segmentRowReducer(state, { type:'SET_TEXT', payload: '' });
      expect(result.text).toBe('');
    });
  });

  describe('START_EDIT', () => {
    it('enters editing mode and sets initial text', () => {
      const result = segmentRowReducer(initialSegmentRowState, {
        type:'START_EDIT', payload: 'segment text',
      });
      expect(result).toEqual({ editing: true, text: 'segment text' });
    });

    it('overwrites existing text with initialText', () => {
      const state: SegmentRowState = { editing: false, text: 'old text' };
      const result = segmentRowReducer(state, {
        type:'START_EDIT', payload: 'fresh',
      });
      expect(result).toEqual({ editing: true, text: 'fresh' });
    });

    it('handles empty initialText', () => {
      const result = segmentRowReducer(initialSegmentRowState, {
        type:'START_EDIT', payload: '',
      });
      expect(result).toEqual({ editing: true, text: '' });
    });
  });

  describe('COMMIT_EDIT', () => {
    it('exits editing mode', () => {
      const state: SegmentRowState = { editing: true, text: 'edited text' };
      const result = segmentRowReducer(state, { type:'COMMIT_EDIT', payload: undefined });
      expect(result.editing).toBe(false);
    });

    it('preserves text after commit', () => {
      const state: SegmentRowState = { editing: true, text: 'committed' };
      const result = segmentRowReducer(state, { type:'COMMIT_EDIT', payload: undefined });
      expect(result.text).toBe('committed');
    });

    it('works when already not editing (no-op on editing flag)', () => {
      const state: SegmentRowState = { editing: false, text: 'idle' };
      const result = segmentRowReducer(state, { type:'COMMIT_EDIT', payload: undefined });
      expect(result).toEqual({ editing: false, text: 'idle' });
    });
  });

  describe('default / unknown action', () => {
    it('returns current state unchanged', () => {
      const state: SegmentRowState = { editing: true, text: 'unchanged' };
      // @ts-expect-error testing unknown action
      const result = segmentRowReducer(state, { type: 'UNKNOWN' });
      expect(result).toBe(state); // same reference
    });
  });
});

// ─── ScriptEditor reducer ──────────────────────────────────────────

describe('scriptEditorReducer', () => {
  it('has correct initial state', () => {
    expect(initialScriptEditorState).toEqual({ copied: false });
  });

  describe('SET_COPIED', () => {
    it('sets copied to true', () => {
      const result = scriptEditorReducer(initialScriptEditorState, {
        type:'SET_COPIED', payload: true,
      });
      expect(result).toEqual({ copied: true });
    });

    it('sets copied to false', () => {
      const state: ScriptEditorState = { copied: true };
      const result = scriptEditorReducer(state, {
        type:'SET_COPIED', payload: false,
      });
      expect(result).toEqual({ copied: false });
    });
  });

  describe('MARK_COPIED', () => {
    it('sets copied to true', () => {
      const result = scriptEditorReducer(initialScriptEditorState, {
        type:'MARK_COPIED', payload: undefined});
      expect(result).toEqual({ copied: true });
    });

    it('keeps copied true if already true', () => {
      const state: ScriptEditorState = { copied: true };
      const result = scriptEditorReducer(state, { type:'MARK_COPIED', payload: undefined });
      expect(result.copied).toBe(true);
    });
  });

  describe('RESET_COPIED', () => {
    it('sets copied to false', () => {
      const state: ScriptEditorState = { copied: true };
      const result = scriptEditorReducer(state, { type:'RESET_COPIED', payload: undefined });
      expect(result).toEqual({ copied: false });
    });

    it('keeps copied false if already false', () => {
      const result = scriptEditorReducer(initialScriptEditorState, {
        type:'RESET_COPIED', payload: undefined});
      expect(result.copied).toBe(false);
    });
  });

  describe('default / unknown action', () => {
    it('returns current state unchanged', () => {
      const state: ScriptEditorState = { copied: true };
      // @ts-expect-error testing unknown action
      const result = scriptEditorReducer(state, { type: 'UNKNOWN' });
      expect(result).toBe(state); // same reference
    });
  });
});
