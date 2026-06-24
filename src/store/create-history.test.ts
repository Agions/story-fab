/**
 * createHistory 模块单元测试
 *
 * 验证 undo/redo 行为正确性、滑动窗口边界、未来栈清空规则
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createHistory } from './create-history';

type Snapshot = { value: number };

describe('createHistory', () => {
  let hist: ReturnType<typeof createHistory<Snapshot>>;

  beforeEach(() => {
    hist = createHistory<Snapshot>({ maxSize: 3 });
  });

  it('initial state: past and future are empty', () => {
    expect(hist.size()).toEqual({ past: 0, future: 0 });
    expect(hist.canUndo()).toBe(false);
    expect(hist.canRedo()).toBe(false);
  });

  it('save pushes to past and clears future', () => {
    hist.save({ value: 1 });
    hist.save({ value: 2 });
    expect(hist.size()).toEqual({ past: 2, future: 0 });
    expect(hist.canUndo()).toBe(true);
  });

  it('undo pops from past, pushes current to future, returns previous', () => {
    hist.save({ value: 1 });
    hist.save({ value: 2 });
    const current = { value: 3 };
    const prev = hist.undo(current);
    expect(prev).toEqual({ value: 2 });
    expect(hist.size()).toEqual({ past: 1, future: 1 });
    expect(hist.canRedo()).toBe(true);
  });

  it('undo returns undefined when past is empty', () => {
    expect(hist.undo({ value: 0 })).toBeUndefined();
    expect(hist.size()).toEqual({ past: 0, future: 0 });
  });

  it('redo pops from future, pushes current to past, returns next', () => {
    hist.save({ value: 1 });
    hist.save({ value: 2 });
    const u = hist.undo({ value: 3 });
    expect(u).toEqual({ value: 2 });
    const r = hist.redo({ value: 2 });
    expect(r).toEqual({ value: 3 });
    expect(hist.size()).toEqual({ past: 2, future: 0 });
  });

  it('redo returns undefined when future is empty', () => {
    expect(hist.redo({ value: 0 })).toBeUndefined();
  });

  it('save clears future (standard undo/redo semantics)', () => {
    hist.save({ value: 1 });
    hist.save({ value: 2 });
    hist.undo({ value: 3 });
    expect(hist.canRedo()).toBe(true);
    hist.save({ value: 4 });
    expect(hist.size()).toEqual({ past: 2, future: 0 });
    expect(hist.canRedo()).toBe(false);
  });

  it('respects maxSize sliding window (oldest entries dropped)', () => {
    hist.save({ value: 1 });
    hist.save({ value: 2 });
    hist.save({ value: 3 });
    hist.save({ value: 4 });
    expect(hist.size()).toEqual({ past: 3, future: 0 });
    // past 栈（最新在末尾）= [2, 3, 4]，value=1 被淘汰
    // undo 应先 pop 最近的 value=4
    expect(hist.undo({ value: 5 })).toEqual({ value: 4 });
    expect(hist.undo({ value: 4 })).toEqual({ value: 3 });
  });

  it('clear() resets both stacks', () => {
    hist.save({ value: 1 });
    hist.save({ value: 2 });
    hist.undo({ value: 3 });
    hist.clear();
    expect(hist.size()).toEqual({ past: 0, future: 0 });
  });
});
