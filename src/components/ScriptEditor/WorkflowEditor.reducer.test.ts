import { describe, it, expect } from 'vitest';
import {
  workflowEditorReducer,
  initialWorkflowEditorState,
  type WorkflowEditorState,
  type WorkflowEditorAction,
} from './WorkflowEditor.reducer';

// ── Test helpers ──────────────────────────────────────────────

const baseState: WorkflowEditorState = { ...initialWorkflowEditorState };

// ── Tests ─────────────────────────────────────────────────────

describe('workflowEditorReducer', () => {
  // ── initialWorkflowEditorState ────────────────────────────────
  describe('initialWorkflowEditorState', () => {
    it('has correct default values', () => {
      expect(initialWorkflowEditorState).toEqual({
        activeTab: 'content',
        editedContent: '',
        editedTitle: '',
        aiModalVisible: false,
      });
    });
  });

  // ── SET_ACTIVE_TAB ──────────────────────────────────────────
  describe('SET_ACTIVE_TAB', () => {
    it('sets activeTab to a new value', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_ACTIVE_TAB',
        activeTab: 'segments',
      });
      expect(state.activeTab).toBe('segments');
    });

    it('sets activeTab to scenes', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_ACTIVE_TAB',
        activeTab: 'scenes',
      });
      expect(state.activeTab).toBe('scenes');
    });

    it('sets activeTab to content', () => {
      const stateWithTab = { ...baseState, activeTab: 'segments' };
      const state = workflowEditorReducer(stateWithTab, {
        type: 'SET_ACTIVE_TAB',
        activeTab: 'content',
      });
      expect(state.activeTab).toBe('content');
    });

    it('does not mutate other state fields', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_ACTIVE_TAB',
        activeTab: 'segments',
      });
      expect(state.editedContent).toBe(baseState.editedContent);
      expect(state.editedTitle).toBe(baseState.editedTitle);
      expect(state.aiModalVisible).toBe(baseState.aiModalVisible);
    });
  });

  // ── SET_EDITED_CONTENT ──────────────────────────────────────
  describe('SET_EDITED_CONTENT', () => {
    it('sets editedContent to a new value', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_EDITED_CONTENT',
        editedContent: 'Hello world',
      });
      expect(state.editedContent).toBe('Hello world');
    });

    it('handles empty string', () => {
      const stateWithContent = { ...baseState, editedContent: 'some text' };
      const state = workflowEditorReducer(stateWithContent, {
        type: 'SET_EDITED_CONTENT',
        editedContent: '',
      });
      expect(state.editedContent).toBe('');
    });

    it('handles multiline content', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      const state = workflowEditorReducer(baseState, {
        type: 'SET_EDITED_CONTENT',
        editedContent: multiline,
      });
      expect(state.editedContent).toBe(multiline);
    });

    it('does not mutate other state fields', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_EDITED_CONTENT',
        editedContent: 'new content',
      });
      expect(state.activeTab).toBe(baseState.activeTab);
      expect(state.editedTitle).toBe(baseState.editedTitle);
      expect(state.aiModalVisible).toBe(baseState.aiModalVisible);
    });
  });

  // ── SET_EDITED_TITLE ────────────────────────────────────────
  describe('SET_EDITED_TITLE', () => {
    it('sets editedTitle to a new value', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_EDITED_TITLE',
        editedTitle: 'My Title',
      });
      expect(state.editedTitle).toBe('My Title');
    });

    it('handles empty string', () => {
      const stateWithTitle = { ...baseState, editedTitle: 'old title' };
      const state = workflowEditorReducer(stateWithTitle, {
        type: 'SET_EDITED_TITLE',
        editedTitle: '',
      });
      expect(state.editedTitle).toBe('');
    });

    it('handles unicode characters', () => {
      const title = '标题 🎬 Story';
      const state = workflowEditorReducer(baseState, {
        type: 'SET_EDITED_TITLE',
        editedTitle: title,
      });
      expect(state.editedTitle).toBe(title);
    });

    it('does not mutate other state fields', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_EDITED_TITLE',
        editedTitle: 'new title',
      });
      expect(state.activeTab).toBe(baseState.activeTab);
      expect(state.editedContent).toBe(baseState.editedContent);
      expect(state.aiModalVisible).toBe(baseState.aiModalVisible);
    });
  });

  // ── SET_AI_MODAL_VISIBLE ────────────────────────────────────
  describe('SET_AI_MODAL_VISIBLE', () => {
    it('sets aiModalVisible to true', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_AI_MODAL_VISIBLE',
        aiModalVisible: true,
      });
      expect(state.aiModalVisible).toBe(true);
    });

    it('sets aiModalVisible to false', () => {
      const stateWithModal = { ...baseState, aiModalVisible: true };
      const state = workflowEditorReducer(stateWithModal, {
        type: 'SET_AI_MODAL_VISIBLE',
        aiModalVisible: false,
      });
      expect(state.aiModalVisible).toBe(false);
    });

    it('does not mutate other state fields', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SET_AI_MODAL_VISIBLE',
        aiModalVisible: true,
      });
      expect(state.activeTab).toBe(baseState.activeTab);
      expect(state.editedContent).toBe(baseState.editedContent);
      expect(state.editedTitle).toBe(baseState.editedTitle);
    });
  });

  // ── SYNC_FROM_SCRIPT ────────────────────────────────────────
  describe('SYNC_FROM_SCRIPT', () => {
    it('sets both editedContent and editedTitle', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SYNC_FROM_SCRIPT',
        content: 'Script content here',
        title: 'Script title',
      });
      expect(state.editedContent).toBe('Script content here');
      expect(state.editedTitle).toBe('Script title');
    });

    it('overwrites existing editedContent and editedTitle', () => {
      const dirtyState = {
        ...baseState,
        editedContent: 'old content',
        editedTitle: 'old title',
      };
      const state = workflowEditorReducer(dirtyState, {
        type: 'SYNC_FROM_SCRIPT',
        content: 'new content',
        title: 'new title',
      });
      expect(state.editedContent).toBe('new content');
      expect(state.editedTitle).toBe('new title');
    });

    it('handles empty content and title', () => {
      const state = workflowEditorReducer(baseState, {
        type: 'SYNC_FROM_SCRIPT',
        content: '',
        title: '',
      });
      expect(state.editedContent).toBe('');
      expect(state.editedTitle).toBe('');
    });

    it('preserves activeTab and aiModalVisible', () => {
      const stateWithExtras = {
        ...baseState,
        activeTab: 'scenes',
        aiModalVisible: true,
      };
      const state = workflowEditorReducer(stateWithExtras, {
        type: 'SYNC_FROM_SCRIPT',
        content: 'synced',
        title: 'synced title',
      });
      expect(state.activeTab).toBe('scenes');
      expect(state.aiModalVisible).toBe(true);
    });
  });

  // ── default case ────────────────────────────────────────────
  describe('default', () => {
    it('returns the same state reference for unknown actions', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as unknown as WorkflowEditorAction;
      const state = workflowEditorReducer(baseState, unknownAction);
      expect(state).toBe(baseState);
    });
  });

  // ── immutability ────────────────────────────────────────────
  describe('immutability', () => {
    it('does not mutate the original state object', () => {
      const original: WorkflowEditorState = {
        activeTab: 'content',
        editedContent: 'original content',
        editedTitle: 'original title',
        aiModalVisible: false,
      };
      const frozen = { ...original };

      workflowEditorReducer(original, { type: 'SET_ACTIVE_TAB', activeTab: 'segments' });
      workflowEditorReducer(original, { type: 'SET_EDITED_CONTENT', editedContent: 'mutated' });
      workflowEditorReducer(original, { type: 'SET_EDITED_TITLE', editedTitle: 'mutated' });
      workflowEditorReducer(original, { type: 'SET_AI_MODAL_VISIBLE', aiModalVisible: true });
      workflowEditorReducer(original, {
        type: 'SYNC_FROM_SCRIPT',
        content: 'synced',
        title: 'synced',
      });

      expect(original.activeTab).toBe(frozen.activeTab);
      expect(original.editedContent).toBe(frozen.editedContent);
      expect(original.editedTitle).toBe(frozen.editedTitle);
      expect(original.aiModalVisible).toBe(frozen.aiModalVisible);
    });

    it('returns a new object reference for every action', () => {
      const actions: WorkflowEditorAction[] = [
        { type: 'SET_ACTIVE_TAB', activeTab: 'segments' },
        { type: 'SET_EDITED_CONTENT', editedContent: 'x' },
        { type: 'SET_EDITED_TITLE', editedTitle: 'x' },
        { type: 'SET_AI_MODAL_VISIBLE', aiModalVisible: true },
        { type: 'SYNC_FROM_SCRIPT', content: 'x', title: 'x' },
      ];

      for (const action of actions) {
        const result = workflowEditorReducer(baseState, action);
        expect(result).not.toBe(baseState);
      }
    });
  });
});
