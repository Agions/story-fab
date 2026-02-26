import type { Timeline } from '@/core/types';
import type { EditorHistory } from './types';

export function createHistory(present: Timeline): EditorHistory {
  return {
    past: [],
    present,
    future: []
  };
}

export function pushHistory(history: EditorHistory, newPresent: Timeline): EditorHistory {
  return {
    past: [...history.past, history.present],
    present: newPresent,
    future: []
  };
}

export function undo(history: EditorHistory): { history: EditorHistory; timeline: Timeline } {
  if (history.past.length === 0) {
    return { history, timeline: history.present };
  }

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  return {
    history: {
      past: newPast,
      present: previous,
      future: [history.present, ...history.future]
    },
    timeline: previous
  };
}

export function redo(history: EditorHistory): { history: EditorHistory; timeline: Timeline } {
  if (history.future.length === 0) {
    return { history, timeline: history.present };
  }

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    history: {
      past: [...history.past, history.present],
      present: next,
      future: newFuture
    },
    timeline: next
  };
}

export function canUndo(history: EditorHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: EditorHistory): boolean {
  return history.future.length > 0;
}
