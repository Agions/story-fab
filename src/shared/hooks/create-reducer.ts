/**
 * 通用 Reducer 工厂 —— 解决 17 份同源 reducer 样板爆炸 (P1)。
 *
 * 历史：每个模块手寫 interface State / interface Action / switch/reducer，
 * 17 × 3 份 同源样板 ≈ 500 LoC。
 *
 * 改造后：业务层只写 (shape, handler map, base state)；
 *        抽象自动推导 reducer / actionTypes 常量；
 *        默认 default 分支 -> 返回 state 不变。
 *
 * 支持两种 action 形状（向下兼容）：
 *   ① payload 包装：{ type: 'SET_X'; payload: T }  —— 新代码推荐
 *   ② flat 字段：  { type: 'SET_X'; x: T }        —— 既有代码兼容
 *
 * 调用方：dispatch({ type: 'SET_IS_PLAYING', payload: true })
 *    或：dispatch({ type: 'SET_IS_PLAYING', isPlaying: true })
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- 工厂本身就是 any 类型，业务层经 handlers 收敛给严格类型 */

/** 单个 handler 签名：state + 业务 payload（any 由业务 map 收敛） */
type Handler<S> = (state: S, payload: any) => S;

/**
 * 业务 handler map。
 * 键 = action.type 字符串；值 = (state, payload) => nextState。
 *
 * 对「flat 字段」风格：payload 是 action 自身（含 type 外所有字段）。
 * 对「payload 包装」风格：payload 是 action.payload。
 * 两种风格由调用方在 handler 内自行解构，工厂不强制。
 */
export type HandlerMap<S> = {
  [actionType: string]: Handler<S>;
};

export type CreateReducerResult<S, HM extends HandlerMap<S>> = [
  reducer: (state: S, action: { type: keyof HM & string; payload: any }) => S,
  initialState: S,
  actionTypes: { [K in keyof HM]: K },
];

/**
 * 通用 reducer 工厂
 * @param _module 模块前缀（仅预留，便于未来添加命名空间能力）
 * @param handlers actionType -> (state, payload) => nextState
 * @param initialState 初始状态
 * @returns [reducer, initialState, actionType 常量对象]
 */
export function createReducer<S, HM extends HandlerMap<S>>(
  _module: string,
  handlers: HM,
  initialState: S,
): CreateReducerResult<S, HM> {
  const actionTypes = Object.keys(handlers).reduce(
    (acc, key) => {
      (acc as Record<string, string>)[key] = key;
      return acc;
    },
    {} as { [K in keyof HM]: K },
  );

  const reducer = (
    state: S,
    action: { type: keyof HM & string; payload: any },
  ): S => {
    const handler = handlers[action.type];
    if (!handler) return state;
    return handler(state, action.payload);
  };

  return [reducer, initialState, actionTypes];
}

/* eslint-enable @typescript-eslint/no-explicit-any */
