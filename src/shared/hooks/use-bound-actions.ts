/**
 * use-bound-actions.ts
 *
 * 消除 reducer-hook 中的 10+ useCallback 包装 + 巨型 useMemo 聚合模板。
 *
 * 用法：
 *   const { state, dispatch } = useReducerHookFactory(reducer, initialState);
 *   const actions = useBoundActions(dispatch, {
 *     SET_X: (x: number) => ({ type: 'SET_X', payload: x }),
 *     INCREMENT: () => ({ type: 'INC' }),
 *   });
 *   actions.SET_X(42);  // 代替手写 useCallback(dispatch({ type: 'SET_X', payload: 42 }), [dispatch])
 *
 * 收益：
 *   - 消除 N 个 useCallback 包装（N 通常 5-15）
 *   - 消除巨型 useMemo 聚合对象
 *   - 消费方代码 60-100 行 → 10-20 行
 *
 * 设计权衡：
 *   - 返回的 actions 对象用 useMemo 稳定，依赖为 actionCreators + dispatch
 *   - actionCreators 建议在 module-level 声明以保持稳定引用
 *   - 复杂 action（非 SET 模式）仍可走 dispatch 直调，useBoundActions 不阻挡
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- 泛型 helper 内部需要 any 接收任意 action shape，由消费方收敛 */

import { useMemo } from 'react';

type ActionCreator<P> = (payload: P) => any;

type BoundActions<A extends Record<string, ActionCreator<any>>> = {
  [K in keyof A]: (payload: Parameters<A[K]>[0]) => void;
};

/**
 * 将一组 action creator 绑定到 dispatch，返回稳定引用的 actions 对象。
 *
 * @param dispatch useReducer 的稳定 dispatch 函数
 * @param actionCreators 模块级或稳定引用的 action creator 映射
 * @returns 与 actionCreators 同名 key 的 actions 对象
 */
export function useBoundActions<A extends Record<string, ActionCreator<any>>>(
  dispatch: React.Dispatch<any>,
  actionCreators: A,
): BoundActions<A> {
  return useMemo(() => {
    const bound: Record<string, (payload: any) => void> = {};
    for (const key in actionCreators) {
      const creator = actionCreators[key];
      if (typeof creator === 'function') {
        bound[key] = (payload: any) => dispatch(creator(payload));
      }
    }
    return bound as BoundActions<A>;
  }, [dispatch, actionCreators]);
}
