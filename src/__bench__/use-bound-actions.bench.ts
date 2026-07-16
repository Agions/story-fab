/**
 * useBoundActions dispatch 性能基准
 *
 * Stage 8 PR-5.1。
 * 比较 useBoundActions (Stage 8 PR-1.1) vs 原始 useCallback 模式的 dispatch 开销。
 */
import { bench, describe } from 'vitest';

// Simulate the two patterns in isolation (no React runtime)
type Action = { type: string; payload: unknown };

// Function names avoid `use*` prefix to prevent React Hooks lint rule from flagging
function buildManualCallbackPattern() {
  const actionCreators = {
    SET_X: (x: number) => ({ type: 'SET_X' as const, payload: x }),
    SET_Y: (y: string) => ({ type: 'SET_Y' as const, payload: y }),
  };
  return (action: Action) => {
    const creator = actionCreators[action.type as keyof typeof actionCreators];
    return creator ? creator(action.payload as never) : null;
  };
}

function buildBoundActionsPattern() {
  // Simulates the useBoundActions internal logic
  const dispatch = (action: Action) => action;
  const actionCreators = {
    SET_X: (x: number) => ({ type: 'SET_X' as const, payload: x }),
    SET_Y: (y: string) => ({ type: 'SET_Y' as const, payload: y }),
  };
  const setters: Record<string, (p: unknown) => void> = {};
  for (const key in actionCreators) {
    const creator = actionCreators[key as keyof typeof actionCreators];
    setters[key] = (p) => dispatch(creator(p as never));
  }
  return (type: string, payload: unknown) => setters[type](payload);
}

describe('useBoundActions vs manual useCallback pattern', () => {
  const manualPattern = buildManualCallbackPattern();
  const boundActionsPattern = buildBoundActionsPattern();

  bench('manual useCallback pattern: 1000 dispatches', () => {
    for (let i = 0; i < 1000; i++) {
      manualPattern({ type: 'SET_X', payload: i });
    }
  });

  bench('useBoundActions pattern: 1000 dispatches', () => {
    for (let i = 0; i < 1000; i++) {
      boundActionsPattern('SET_X', i);
    }
  });
});
