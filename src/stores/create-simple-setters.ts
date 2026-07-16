/**
 * create-simple-setters.ts
 *
 * 为 Zustand store 中无副作用的纯赋值 setter 自动生成实现。
 * 适用于 `setX: (x) => set({ [stateKey]: x })` 模式。
 *
 * 用法（节选自 editor-store.ts）：
 *   const simpleSetters = createSimpleSetters({
 *     setVideo: 'video',
 *     setScript: 'script',
 *     setIsPlaying: 'isPlaying',
 *     // 带 clamping / history / 多步操作的 setter 保持手写
 *   }, set);
 *
 *   state: () => ({
 *     ...initialState,
 *     ...simpleSetters,
 *     // 业务 action
 *   })
 *
 * 收益：editor-store 简单 setter 从 19 行手写降到 1 行 factory + 19 行 key 映射。
 *
 * 限制：
 *   - 工厂仅适用纯赋值 setter（setX → set({ key: x })）
 *   - 带 clamping/validation 的 setter 保持手写
 *   - 带 history 副作用的 setter 保持手写
 *   - functional update 的 setter 保持手写
 *   - 跨字段读写的 setter（如 setInPoint 读 playheadMs）保持手写
 */

import type { StoreApi } from 'zustand';

type SetState<S> = StoreApi<S>['setState'];

/**
 * 根据 action-name → state-key 映射生成对应的简单 setter。
 *
 * @param map action 名到 state 键的映射
 * @param set Zustand 的 set 函数
 * @returns 与 map 同名的 setter 映射，类型按 state 字段推导
 */
export function createSimpleSetters<S, M extends Record<string, keyof S & string>>(
  map: M,
  set: SetState<S>,
): { [A in keyof M]: (value: S[M[A]]) => void } {
  const setters: Record<string, (value: unknown) => void> = {};
  for (const actionName in map) {
    const stateKey = map[actionName];
    setters[actionName] = (value: unknown) => set({ [stateKey]: value } as Partial<S>);
  }
  return setters as { [A in keyof M]: (value: S[M[A]]) => void };
}
