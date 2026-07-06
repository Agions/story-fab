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
 * 调用方：dispatch({ type: 'SET_VIDEO_PATH', payload: '...' })
 *
 * 本工具面向「纯 setter」类 reducer；业务上仍有个别跨 action 需特化处理
 * （如 RESET 返回 baseState、UPDATE_ACTIVE_SCRIPT_FROM_SEGMENTS 含副作用），
 * 由各 reducer 自行编写 action 类型副分支 + reducer 内部预检查。
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- 工厂本身就是 any 类型，业务层经 handlers 收敛给严格类型 */

export type HandlerMap<S, Keys extends string = string> = {
  [K in Keys]: (state: S, payload: any) => S;
};

export type CreateReducerResult<
  S,
  HM extends HandlerMap<S, keyof HM & string>,
> = [
  reducer: (state: S, action: { type: keyof HM; payload: any }) => S,
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
export function createReducer<
  S,
  HM extends HandlerMap<S, keyof HM & string>,
>(
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

  const reducer = (state: S, action: { type: keyof HM; payload: any }): S => {
    const handler = handlers[action.type];
    if (!handler) return state;
    return handler(state, action.payload);
  };

  return [reducer, initialState, actionTypes];
}

/* eslint-enable @typescript-eslint/no-explicit-any */
