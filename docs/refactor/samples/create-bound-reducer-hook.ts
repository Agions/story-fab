/**
 * create-bound-reducer-hook.ts
 *
 * 通用 reducer hook 工厂 — 消解 useReducer + N 个 useCallback + useMemo 模板。
 *
 * 用法：
 *   const useFoo = createBoundReducerHook(reducer, initialState, ['SET_X', 'SET_Y', ...]);
 *   const { state, actions } = useFoo();
 *   actions.SET_X(value);
 *
 * 收益：5 个 consumer hook 各从 89~110 行降到 30 行，共减 ~350 行。
 */
import { useCallback, useMemo, useReducer } from 'react';

type ActionMap<S> = Record<string, (state: S, payload: any) => S>;

export interface BoundReducerHook<S, A extends ActionMap<S>> {
  state: S;
  actions: { [K in keyof A]: (payload: Parameters<A[K]>[1]) => void };
}

export function createBoundReducerHook<S, A extends ActionMap<S>>(
  reducer: (state: S, action: { type: keyof A; payload: any }) => S,
  initialState: S,
  actionKeys: ReadonlyArray<keyof A>,
) {
  return function useBoundReducer(): BoundReducerHook<S, A> {
    const [state, baseDispatch] = useReducer(reducer, initialState);

    const dispatch = useCallback(
      (type: keyof A, payload: any) => baseDispatch({ type, payload }),
      [],
    );

    const actions = useMemo(() => {
      const out: Record<string, (payload: any) => void> = {};
      for (const k of actionKeys) {
        out[k as string] = (payload: any) => dispatch(k, payload);
      }
      return out as { [K in keyof A]: (payload: Parameters<A[K]>[1]) => void };
    }, [actionKeys, dispatch]);

    return useMemo(() => ({ state, actions }), [state, actions]);
  };
}
