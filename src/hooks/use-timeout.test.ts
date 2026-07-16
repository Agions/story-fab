/**
 * use-timeout 测试
 *
 * Stage 9 PR-9：统一 setTimeout 管理 hook 覆盖
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeout } from './use-timeout';

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns set/clear/delay methods', () => {
    const { result } = renderHook(() => useTimeout());
    expect(typeof result.current.set).toBe('function');
    expect(typeof result.current.clear).toBe('function');
    expect(typeof result.current.delay).toBe('function');
  });

  it('set() invokes callback after specified delay', () => {
    const { result } = renderHook(() => useTimeout());
    const cb = vi.fn();

    act(() => {
      result.current.set(cb, 1000);
    });

    expect(cb).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('set() returns a timeout id', () => {
    const { result } = renderHook(() => useTimeout());
    let id: ReturnType<typeof setTimeout> | null = null;

    act(() => {
      id = result.current.set(() => {}, 1000);
    });

    expect(id).not.toBeNull();
  });

  it('clear() cancels pending callback', () => {
    const { result } = renderHook(() => useTimeout());
    const cb = vi.fn();
    let id: ReturnType<typeof setTimeout> | null = null;

    act(() => {
      id = result.current.set(cb, 1000);
      result.current.clear(id!);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(cb).not.toHaveBeenCalled();
  });

  it('delay() returns a Promise that resolves after ms', async () => {
    const { result } = renderHook(() => useTimeout());
    let resolved = false;

    act(() => {
      result.current.delay(1000).then(() => {
        resolved = true;
      });
    });

    expect(resolved).toBe(false);
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(resolved).toBe(true);
  });

  it('clears all timeouts on unmount', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { result, unmount } = renderHook(() => useTimeout());

    act(() => {
      result.current.set(cb1, 1000);
      result.current.set(cb2, 2000);
    });

    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it('handles multiple timeouts independently', () => {
    const { result } = renderHook(() => useTimeout());
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    act(() => {
      result.current.set(cb1, 1000);
      result.current.set(cb2, 3000);
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
