/**
 * use-director-status 测试
 *
 * Stage 9 PR-11：Director 状态轮询 hook 覆盖
 * - 指数退避
 * - 5 次失败后停止
 * - 终态自动停止
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock the commentary service
vi.mock('@/core/services/commentary', () => ({
  getCommentaryStatus: vi.fn(),
}));

import { getCommentaryStatus } from '@/core/services/commentary';
import { useDirectorStatus } from './use-director-status';
import type { DirectorStatusResponse } from '@/types';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function makeStatus(overrides: Partial<DirectorStatusResponse> = {}): DirectorStatusResponse {
  return {
    state: 'running',
    progressPct: 0.5,
    message: 'processing',
    ...overrides,
  } as DirectorStatusResponse;
}

describe('useDirectorStatus', () => {
  beforeEach(() => {
    vi.mocked(getCommentaryStatus).mockResolvedValue(makeStatus());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('returns idle defaults when sessionId is null', () => {
    const { result } = renderHook(() => useDirectorStatus(null));
    expect(result.current.currentState).toBe('idle');
    expect(result.current.directorStatus).toBeNull();
    expect(result.current.progressPct).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isPolling).toBe(false);
    expect(getCommentaryStatus).not.toHaveBeenCalled();
  });

  it('polls immediately when sessionId is provided', async () => {
    const status = makeStatus({ state: 'running', progressPct: 0.3 });
    vi.mocked(getCommentaryStatus).mockResolvedValue(status);

    const { result } = renderHook(() => useDirectorStatus('session-1'));

    await waitFor(() => {
      expect(getCommentaryStatus).toHaveBeenCalledWith('session-1');
    });
    await waitFor(() => {
      expect(result.current.directorStatus).toEqual(status);
    });
    expect(result.current.currentState).toBe('running');
    expect(result.current.progressPct).toBe(0.3);
  });

  it('stops polling when state becomes "done"', async () => {
    vi.mocked(getCommentaryStatus).mockResolvedValue(makeStatus({ state: 'done' }));

    const { result } = renderHook(() => useDirectorStatus('session-1'));

    await waitFor(() => {
      expect(result.current.currentState).toBe('done');
    });
    // advance several intervals and confirm no more calls
    const callsAfter = vi.mocked(getCommentaryStatus).mock.calls.length;
    await act(async () => {
      await sleep(50);
    });
    expect(vi.mocked(getCommentaryStatus).mock.calls.length).toBe(callsAfter);
  });

  it('stops polling when state becomes "idle" (after first poll)', async () => {
    // First poll: running; second: idle
    vi.mocked(getCommentaryStatus)
      .mockResolvedValueOnce(makeStatus({ state: 'running' }))
      .mockResolvedValue(makeStatus({ state: 'idle' }));

    const { result } = renderHook(() => useDirectorStatus('session-1'));

    await waitFor(() => {
      expect(result.current.currentState).toBe('idle');
    });
  });

  it('records error after repeated failures', async () => {
    vi.useFakeTimers();
    vi.mocked(getCommentaryStatus).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useDirectorStatus('session-1'));

    // Step through enough time for 5 failures to land (with exponential backoff:
    // 0 + 2 + 2 + 4 + 8 ≈ 16s wall-clock, but we just advance deterministically).
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
    }

    expect(result.current.error).toBe('连续失败，已停止轮询');
    expect(vi.mocked(getCommentaryStatus).mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it('resets failure count on a successful poll', async () => {
    vi.useFakeTimers();
    vi.mocked(getCommentaryStatus)
      .mockRejectedValueOnce(new Error('blip'))
      .mockRejectedValueOnce(new Error('blip'))
      .mockResolvedValue(makeStatus({ state: 'running' }));

    const { result } = renderHook(() => useDirectorStatus('session-1'));

    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3_000);
      });
    }

    expect(result.current.directorStatus?.state).toBe('running');
    expect(result.current.error).toBeNull();
  });

  it('clears state when sessionId changes to null', async () => {
    vi.mocked(getCommentaryStatus).mockResolvedValue(makeStatus());
    const { result, rerender } = renderHook(
      ({ sid }: { sid: string | null }) => useDirectorStatus(sid),
      { initialProps: { sid: 'session-1' as string | null } },
    );

    await waitFor(() => {
      expect(result.current.directorStatus).not.toBeNull();
    });
    rerender({ sid: null });
    await waitFor(() => {
      expect(result.current.directorStatus).toBeNull();
    });
    expect(result.current.currentState).toBe('idle');
    expect(result.current.isPolling).toBe(false);
  });
});
