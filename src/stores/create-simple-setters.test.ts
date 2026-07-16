import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createSimpleSetters } from './create-simple-setters';

interface TestState {
  name: string;
  count: number;
  active: boolean;
}

interface TestActions {
  setName: (v: string) => void;
  setCount: (v: number) => void;
  setActive: (v: boolean) => void;
}

const createTestStore = () => {
  const setMap = {
    setName: 'name',
    setCount: 'count',
    setActive: 'active',
  } as const;
  return create<TestState & TestActions>((set) => ({
    name: 'init',
    count: 0,
    active: false,
    ...createSimpleSetters(setMap, set),
  }));
};

describe('createSimpleSetters', () => {
  it('generates a setter for every entry in the map', () => {
    const store = createTestStore();
    const setMap = { setName: 'name', setCount: 'count', setActive: 'active' } as const;
    const setters = createSimpleSetters(setMap, store.setState);
    expect(Object.keys(setters).sort()).toEqual(['setActive', 'setCount', 'setName']);
  });

  it('each setter updates its mapped state key', () => {
    const store = createTestStore();

    store.getState().setName('hello');
    store.getState().setCount(42);
    store.getState().setActive(true);

    expect(store.getState().name).toBe('hello');
    expect(store.getState().count).toBe(42);
    expect(store.getState().active).toBe(true);
  });

  it('only updates the targeted key, preserving others', () => {
    const store = createTestStore();
    store.getState().setName('first');
    store.getState().setCount(1);

    store.getState().setCount(99);

    const state = store.getState();
    expect(state.name).toBe('first');
    expect(state.count).toBe(99);
  });

  it('type inference: setter parameter type matches state field type', () => {
    const store = createTestStore();
    const { setName, setCount, setActive } = store.getState();

    // Compile-time type check. If wrong, file won't compile.
    setName('a'); // ✅ string
    setCount(1); // ✅ number
    setActive(true); // ✅ boolean

    // @ts-expect-error: number not assignable to string
    setName(123);
    // @ts-expect-error: string not assignable to number
    setCount('x');
    // @ts-expect-error: string not assignable to boolean
    setActive('true');

    expect(true).toBe(true);
  });

  it('works when action name differs from state key (e.g. setInPoint → inPointMs)', () => {
    interface S {
      playheadMs: number;
      inPointMs: number;
    }
    interface A {
      setInPoint: (v: number) => void;
    }
    const store = create<S & A>((set) => {
      const initial: S = { playheadMs: 0, inPointMs: 0 };
      return {
        ...initial,
        ...createSimpleSetters({ setInPoint: 'inPointMs' }, set),
      };
    });

    store.getState().setInPoint(500);
    expect(store.getState().inPointMs).toBe(500);
    expect(store.getState().playheadMs).toBe(0); // untouched
  });

  it('factory called with same map returns independent closures (each set is stable within)', () => {
    const store = createTestStore();
    const setMap = { setName: 'name', setCount: 'count', setActive: 'active' } as const;
    const settersA = createSimpleSetters(setMap, store.setState);
    const settersB = createSimpleSetters(setMap, store.setState);

    // Different factory invocations produce different setter instances
    expect(settersA.setName).not.toBe(settersB.setName);

    // But each invocation works correctly
    settersA.setCount(1);
    settersB.setCount(2);
    expect(store.getState().count).toBe(2);
  });
});
