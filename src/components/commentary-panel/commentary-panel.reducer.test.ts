import { describe, it, expect } from 'vitest';
import {
  commentaryPanelReducer,
  initialCommentaryPanelState,
  type CommentaryPanelState,
  type CommentaryTab,
} from './commentary-panel.reducer';

function makeState(overrides: Partial<CommentaryPanelState> = {}): CommentaryPanelState {
  return { ...initialCommentaryPanelState, ...overrides };
}

describe('commentaryPanelReducer', () => {
  describe('SET_ACTIVE_TAB', () => {
    it.each<CommentaryTab>(['script', 'style', 'voice', 'timeline'])(
      'sets activeTab to %s',
      (tab) => {
        const result = commentaryPanelReducer(makeState(), {
          type:'SET_ACTIVE_TAB', payload: tab,
        });
        expect(result.activeTab).toBe(tab);
      },
    );

    it('preserves other state fields', () => {
      const prev = makeState({ apiKey: 'test-key', planConfirmOpen: true });
      const result = commentaryPanelReducer(prev, {
        type:'SET_ACTIVE_TAB', payload: 'voice',
      });
      expect(result.apiKey).toBe('test-key');
      expect(result.planConfirmOpen).toBe(true);
    });
  });

  describe('SET_PLAN_CONFIRM_OPEN', () => {
    it('sets planConfirmOpen to true', () => {
      const result = commentaryPanelReducer(makeState(), {
        type:'SET_PLAN_CONFIRM_OPEN', payload: true,
      });
      expect(result.planConfirmOpen).toBe(true);
    });

    it('sets planConfirmOpen to false', () => {
      const result = commentaryPanelReducer(makeState({ planConfirmOpen: true }), {
        type:'SET_PLAN_CONFIRM_OPEN', payload: false,
      });
      expect(result.planConfirmOpen).toBe(false);
    });

    it('preserves other state fields', () => {
      const prev = makeState({ activeTab: 'timeline', apiKey: 'key-123' });
      const result = commentaryPanelReducer(prev, {
        type:'SET_PLAN_CONFIRM_OPEN', payload: true,
      });
      expect(result.activeTab).toBe('timeline');
      expect(result.apiKey).toBe('key-123');
    });
  });

  describe('SET_API_KEY', () => {
    it('sets apiKey to a non-empty string', () => {
      const result = commentaryPanelReducer(makeState(), {
        type:'SET_API_KEY', payload: 'sk-abc123',
      });
      expect(result.apiKey).toBe('sk-abc123');
    });

    it('sets apiKey to an empty string', () => {
      const result = commentaryPanelReducer(makeState({ apiKey: 'old-key' }), {
        type:'SET_API_KEY', payload: '',
      });
      expect(result.apiKey).toBe('');
    });

    it('preserves other state fields', () => {
      const prev = makeState({ activeTab: 'style', selectedStyle: 'suspense' });
      const result = commentaryPanelReducer(prev, {
        type:'SET_API_KEY', payload: 'new-key',
      });
      expect(result.activeTab).toBe('style');
      expect(result.selectedStyle).toBe('suspense');
    });
  });

  describe('SET_SELECTED_STYLE', () => {
    it.each(['humorous', 'serious', 'conversational', 'suspense', 'warm'] as const)(
      'sets selectedStyle to %s',
      (style) => {
        const result = commentaryPanelReducer(makeState(), {
          type:'SET_SELECTED_STYLE', payload: style,
        });
        expect(result.selectedStyle).toBe(style);
      },
    );

    it('preserves other state fields', () => {
      const prev = makeState({ activeTab: 'voice', apiKey: 'some-key' });
      const result = commentaryPanelReducer(prev, {
        type:'SET_SELECTED_STYLE', payload: 'warm',
      });
      expect(result.activeTab).toBe('voice');
      expect(result.apiKey).toBe('some-key');
    });
  });

  describe('default / unknown action', () => {
    it('returns the same state reference', () => {
      const state = makeState();
      // @ts-expect-error testing unknown action
      const result = commentaryPanelReducer(state, { type: 'UNKNOWN' });
      expect(result).toBe(state);
    });
  });

  describe('initialCommentaryPanelState', () => {
    it('has expected defaults', () => {
      expect(initialCommentaryPanelState).toEqual({
        activeTab: 'script',
        planConfirmOpen: false,
        apiKey: '',
        selectedStyle: 'conversational',
      });
    });
  });
});
