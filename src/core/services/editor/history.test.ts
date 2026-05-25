import { describe, it, expect } from 'vitest';
import type { Timeline } from '../../../core/types/timeline';
import {
  createHistory,
  pushHistory,
  undo,
  redo,
  canUndo,
  canRedo,
} from './history';

const createMockTimeline = (id: string): Timeline => ({
  id,
  tracks: [],
  duration: 0,
  markers: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  videoTracks: [],
  audioTracks: [],
  textTracks: [],
  effectTracks: [],
});

describe('createHistory', () => {
  it('should create history with empty past and future, and the given present', () => {
    const present = createMockTimeline('timeline-1');
    const history = createHistory(present);

    expect(history.past).toEqual([]);
    expect(history.present).toBe(present);
    expect(history.future).toEqual([]);
  });
});

describe('pushHistory', () => {
  it('should add current present to past and set new present', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    const history = createHistory(timeline1);

    const newHistory = pushHistory(history, timeline2);

    expect(newHistory.past).toEqual([timeline1]);
    expect(newHistory.present).toBe(timeline2);
    expect(newHistory.future).toEqual([]);
  });

  it('should clear future when pushing new history', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    const timeline3 = createMockTimeline('timeline-3');

    // history: past=[timeline1], present=timeline2, future=[]
    let history = pushHistory(createHistory(timeline1), timeline2);
    // Undo to go back
    history = undo(history).history;
    // Now: past=[], present=timeline1, future=[timeline2]

    // Push new timeline3, should clear future
    const newHistory = pushHistory(history, timeline3);

    expect(newHistory.past).toEqual([timeline1]);
    expect(newHistory.present).toBe(timeline3);
    expect(newHistory.future).toEqual([]);
  });
});

describe('undo', () => {
  it('should return same state when past is empty', () => {
    const timeline = createMockTimeline('timeline-1');
    const history = createHistory(timeline);

    const result = undo(history);

    expect(result.history).toBe(history);
    expect(result.timeline).toBe(timeline);
  });

  it('should move present to future and restore previous state', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    const history = pushHistory(createHistory(timeline1), timeline2);

    const result = undo(history);

    expect(result.history.past).toEqual([]);
    expect(result.history.present).toBe(timeline1);
    expect(result.history.future).toEqual([timeline2]);
    expect(result.timeline).toBe(timeline1);
  });

  it('should handle multiple undo operations', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    const timeline3 = createMockTimeline('timeline-3');

    let history = createHistory(timeline1);
    history = pushHistory(history, timeline2);
    history = pushHistory(history, timeline3);

    // Now: past=[t1, t2], present=t3, future=[]
    const result1 = undo(history);
    expect(result1.history.present).toBe(timeline2);
    expect(result1.history.future).toEqual([timeline3]);

    const result2 = undo(result1.history);
    expect(result2.history.present).toBe(timeline1);
    expect(result2.history.future).toEqual([timeline2, timeline3]);
  });
});

describe('redo', () => {
  it('should return same state when future is empty', () => {
    const timeline = createMockTimeline('timeline-1');
    const history = createHistory(timeline);

    const result = redo(history);

    expect(result.history).toBe(history);
    expect(result.timeline).toBe(timeline);
  });

  it('should move present to past and restore next state', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    let history = pushHistory(createHistory(timeline1), timeline2);

    // Undo first
    history = undo(history).history;
    // Now: past=[], present=t1, future=[t2]

    const result = redo(history);

    expect(result.history.past).toEqual([timeline1]);
    expect(result.history.present).toBe(timeline2);
    expect(result.history.future).toEqual([]);
    expect(result.timeline).toBe(timeline2);
  });

  it('should handle multiple redo operations', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    const timeline3 = createMockTimeline('timeline-3');

    let history = createHistory(timeline1);
    history = pushHistory(history, timeline2);
    history = pushHistory(history, timeline3);
    // Undo twice to get back to start with future stack
    history = undo(history).history;
    history = undo(history).history;
    // Now: past=[], present=t1, future=[t2, t3]

    const result1 = redo(history);
    expect(result1.history.present).toBe(timeline2);
    expect(result1.history.past).toEqual([timeline1]);

    const result2 = redo(result1.history);
    expect(result2.history.present).toBe(timeline3);
    expect(result2.history.past).toEqual([timeline1, timeline2]);
  });
});

describe('canUndo', () => {
  it('should return false when past is empty', () => {
    const history = createHistory(createMockTimeline('timeline-1'));
    expect(canUndo(history)).toBe(false);
  });

  it('should return true when past has entries', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    const history = pushHistory(createHistory(timeline1), timeline2);
    expect(canUndo(history)).toBe(true);
  });

  it('should return false after undo exhausts past', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    let history = pushHistory(createHistory(timeline1), timeline2);
    history = undo(history).history;
    expect(canUndo(history)).toBe(false);
  });
});

describe('canRedo', () => {
  it('should return false when future is empty', () => {
    const history = createHistory(createMockTimeline('timeline-1'));
    expect(canRedo(history)).toBe(false);
  });

  it('should return true when future has entries', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    let history = pushHistory(createHistory(timeline1), timeline2);
    history = undo(history).history;
    // Now past=[] present=t1 future=[t2]
    expect(canRedo(history)).toBe(true);
  });

  it('should return false after redo exhausts future', () => {
    const timeline1 = createMockTimeline('timeline-1');
    const timeline2 = createMockTimeline('timeline-2');
    let history = pushHistory(createHistory(timeline1), timeline2);
    history = undo(history).history;
    history = redo(history).history;
    // Back to original state
    expect(canRedo(history)).toBe(false);
  });
});
