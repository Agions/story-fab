import { useCallback, useMemo, useReducer } from 'react';

export interface UseReducerHookResult<S, A> {
  state: S;
  dispatch: React.Dispatch<A>;
}

/**
 * Creates a reusable reducer hook that wraps useReducer with useCallback dispatch
 * and useMemo memoization, eliminating ~20 lines of boilerplate per hook.
 */
export function createReducerHook<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
): UseReducerHookResult<S, A> {
  const [state, dispatch] = useReducer(reducer, initialState);

  const stableDispatch = useCallback((action: A) => dispatch(action), []);

  const memoizedState = useMemo(() => state, [state]);

  return { state: memoizedState, dispatch: stableDispatch };
}
