import { describe, it, expect, vi } from 'vitest';
import { createAutoSetters, type Setter } from './use-auto-setters';

describe('createAutoSetters', () => {
  // ── basic structure ─────────────────────────────────────────────────────────

  it('returns a setter for every key in the initial state', () => {
    const initialState = { count: 0, name: '' };
    const dispatch = vi.fn();

    const setters = createAutoSetters(dispatch, initialState);

    expect(Object.keys(setters)).toEqual(['count', 'name']);
  });

  it('each setter dispatches an update action with the correct key and value', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { count: 0 });

    setters.count(42);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      key: 'count',
      updater: 42,
    });
  });

  it('each setter accepts an updater function', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { count: 5 });

    setters.count((prev) => prev + 1);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      key: 'count',
      updater: expect.any(Function),
    });
  });

  it('type-checks: setter return type matches state value type', () => {
    // This test verifies compile-time type safety.
    // If the types are wrong, this file won't compile.
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { count: 0, label: '' });

    // Should compile without error:
    const n: Setter<number> = setters.count;
    const s: Setter<string> = setters.label;
    expect(n).toBeDefined();
    expect(s).toBeDefined();
  });

  // ── dispatch call shape ─────────────────────────────────────────────────────

  it('dispatches the correct action shape understood by a generic reducer', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { value: 0 });

    // Simulate a generic reducer receiving the dispatched action
    (setters.value as Setter<number>)(10);
    const calls = dispatch.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0]![0]).toEqual({
      type: 'update',
      key: 'value',
      updater: 10,
    });
  });

  // ── Updater<T> type usage ───────────────────────────────────────────────────

  it('accepts both raw value and updater function (Updater<T> union type)', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { x: 0 });

    // Raw value (Updater<T> = T)
    setters.x(10);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: 'update',
      key: 'x',
      updater: 10,
    });

    // Updater function (Updater<T> = (prev) => T)
    setters.x((prev) => prev + 5);
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: 'update',
      key: 'x',
      updater: expect.any(Function),
    });
  });

  // ── string keys ────────────────────────────────────────────────────────────

  it('handles string-valued state keys', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { title: '', tag: '' });

    setters.title('Hello');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      key: 'title',
      updater: 'Hello',
    });
  });

  // ── complex state objects ──────────────────────────────────────────────────

  it('handles object-valued state keys', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { config: { enabled: false } });

    const newConfig = { enabled: true };
    setters.config(newConfig);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      key: 'config',
      updater: newConfig,
    });
  });

  it('handles array-valued state keys', () => {
    const dispatch = vi.fn();
    const setters = createAutoSetters(dispatch, { items: [] as string[] });

    setters.items(['a', 'b']);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      key: 'items',
      updater: ['a', 'b'],
    });
  });
});
