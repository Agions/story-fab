import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createReducerHook } from './use-reducer-hook';

type State = { count: number; name: string };
type Action = { type: 'INC' } | { type: 'SET_NAME'; name: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INC': return { ...state, count: state.count + 1 };
    case 'SET_NAME': return { ...state, name: action.name };
    default: return state;
  }
};

const initial: State = { count: 0, name: '' };

describe('createReducerHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => createReducerHook(reducer, initial));
    expect(result.current.state).toEqual(initial);
  });

  it('dispatches actions and updates state', () => {
    const { result } = renderHook(() => createReducerHook(reducer, initial));
    act(() => result.current.dispatch({ type: 'INC' }));
    expect(result.current.state.count).toBe(1);
  });

  it('memoizes state reference across renders', () => {
    const { result, rerender } = renderHook(() => createReducerHook(reducer, initial));
    const firstRef = result.current.state;
    rerender();
    expect(result.current.state).toBe(firstRef);
  });

  it('dispatch reference is stable', () => {
    const { result, rerender } = renderHook(() => createReducerHook(reducer, initial));
    const firstDispatch = result.current.dispatch;
    rerender();
    expect(result.current.dispatch).toBe(firstDispatch);
  });
});
