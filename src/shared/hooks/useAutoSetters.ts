/**
 * Creates auto-generated setters for every key in a reducer state.
 *
 * The underlying reducer must handle actions of shape:
 *   { type: 'update'; key: K; updater: Updater<unknown> }
 *
 * Usage:
 *   const setters = createAutoSetters(dispatch, initialState);
 *   setters.someKey(newValue);           // set directly
 *   setters.someKey(prev => prev + 1);   // set via updater function
 *
 * Note: This is a factory function called inside a component hook.
 * It creates lightweight setter closures bound to the stable dispatch.
 */
export type Updater<T> = T | ((prev: T) => T);

export type Setter<T> = (updater: Updater<T>) => void;

export function createAutoSetters<State extends object, Key extends keyof State = keyof State>(
  dispatch: React.Dispatch<{ type: 'update'; key: Key; updater: Updater<unknown> }>,
  initialState: State,
): { [K in keyof State]: Setter<State[K]> } {
  const setters: Record<Key, Setter<unknown>> = {} as Record<Key, Setter<unknown>>;
  for (const key of Object.keys(initialState) as Key[]) {
    setters[key] = (updater: Updater<unknown>) =>
      dispatch({ type: 'update', key, updater });
  }
  return setters as { [K in keyof State]: Setter<State[K]> };
}
