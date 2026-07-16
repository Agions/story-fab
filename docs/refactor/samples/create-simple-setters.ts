/**
 * create-simple-setters.ts
 *
 * 为简单 setX: (x) => set({ [key]: x }) 形式的 action 自动生成实现。
 * 适用于 Zustand store 中无副作用的纯赋值 setter。
 *
 * 用法（节选自 editor-store.ts）：
 *   const SIMPLE_STATE_KEYS = ['video', 'script', 'voice', 'isPlaying', ...] as const;
 *   ...
 *   setVideo: createSetter('video', set),
 *   setIsPlaying: createSetter('isPlaying', set),
 *   setCurrentTime: createSetter('currentTime', set),
 *   ...
 *
 * 收益：editor-store 24 个 setter 从 24 行手写降到 1 行工厂调用。
 */
import type { StateCreator } from 'zustand';

type SimpleSetter<T> = (value: T) => void;

export function createSetter<K extends string, V>(
  key: K,
  set: (partial: Partial<Record<K, V>>) => void,
): SimpleSetter<V> {
  return (value: V) => set({ [key]: value } as Partial<Record<K, V>>);
}

export function createSimpleSetters<K extends string, V>(
  keys: readonly K[],
  set: (partial: Partial<Record<K, V>>) => void,
): Record<K, SimpleSetter<V>> {
  return Object.fromEntries(
    keys.map((k) => [k, createSetter(k, set)]),
  ) as Record<K, SimpleSetter<V>>;
}

export const SIMPLE_SETTER_KEYS = <K extends string>(keys: readonly K[]) => keys;

// 类型辅助
export type SetState<S> = StateCreator<S, [], [], S>['set'];
