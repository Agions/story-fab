import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBoundActions } from './use-bound-actions';

describe('useBoundActions', () => {
  it('returns a callable for each action creator', () => {
    const dispatch = vi.fn();
    const actionCreators = {
      SET_X: (x: number) => ({ type: 'SET_X', payload: x }),
      INCREMENT: () => ({ type: 'INC' }),
    };
    const { result } = renderHook(() => useBoundActions(dispatch, actionCreators));
    expect(typeof result.current.SET_X).toBe('function');
    expect(typeof result.current.INCREMENT).toBe('function');
  });

  it('dispatches the action returned by each creator', () => {
    const dispatch = vi.fn();
    const actionCreators = {
      SET_X: (x: number) => ({ type: 'SET_X', payload: x }),
    };
    const { result } = renderHook(() => useBoundActions(dispatch, actionCreators));

    result.current.SET_X(42);

    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_X', payload: 42 });
  });

  it('handles void-returning action creators (e.g. INCREMENT with no payload)', () => {
    const dispatch = vi.fn();
    const actionCreators = {
      INC: () => ({ type: 'INC' }),
    };
    const { result } = renderHook(() => useBoundActions(dispatch, actionCreators));

    // INC creator takes no payload; result.current.INC is typed as (payload: void) => void
    (result.current.INC as () => void)();

    expect(dispatch).toHaveBeenCalledWith({ type: 'INC' });
  });

  it('returns a stable object reference across re-renders when creators are stable', () => {
    const dispatch = vi.fn();
    const actionCreators = {
      SET_X: (x: number) => ({ type: 'SET_X', payload: x }),
    };
    const { result, rerender } = renderHook(() => useBoundActions(dispatch, actionCreators));
    const firstRef = result.current;
    rerender();
    expect(result.current).toBe(firstRef);
  });

  it('creates a new object reference when actionCreators change', () => {
    const dispatch = vi.fn();
    const creatorsA = { SET_X: (x: number) => ({ type: 'SET_X', payload: x }) };
    const creatorsB = { SET_X: (x: number) => ({ type: 'SET_X', payload: x }) };
    const { result, rerender } = renderHook(
      ({ creators }) => useBoundActions(dispatch, creators),
      { initialProps: { creators: creatorsA } },
    );
    const firstRef = result.current;
    rerender({ creators: creatorsB });
    expect(result.current).not.toBe(firstRef);
  });

  it('ignores non-function entries in actionCreators', () => {
    const dispatch = vi.fn();
    const actionCreators = {
      SET_X: (x: number) => ({ type: 'SET_X', payload: x }),
    };
    // Cast to any to inject a non-function entry and verify runtime safety
    const dirtyCreators = actionCreators as unknown as Record<string, unknown>;
    dirtyCreators.NOT_A_FUNCTION = 'oops';
    const { result } = renderHook(() =>
      useBoundActions(dispatch, dirtyCreators as typeof actionCreators),
    );
    expect(typeof result.current.SET_X).toBe('function');
    expect((result.current as Record<string, unknown>).NOT_A_FUNCTION).toBeUndefined();
  });
});
