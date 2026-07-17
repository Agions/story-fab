/**
 * use-commentary-session 测试
 *
 * Stage 9 PR-12：session 生命周期 hook 覆盖
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@/core/services/commentary', () => ({
  createCommentarySession: vi.fn(),
  destroyCommentarySession: vi.fn(),
  getCommentaryStatus: vi.fn(),
}));

import {
  createCommentarySession,
  destroyCommentarySession,
  getCommentaryStatus,
} from '@/core/services/commentary';
import { useCommentarySession } from './use-commentary-session';
import type { DirectorStatusResponse } from '@/types';

const idleStatus: DirectorStatusResponse = {
  state: 'idle',
  progressPct: 0,
  message: '',
} as DirectorStatusResponse;

describe('useCommentarySession', () => {
  beforeEach(() => {
    vi.mocked(createCommentarySession).mockResolvedValue('sess-abc');
    vi.mocked(destroyCommentarySession).mockResolvedValue();
    vi.mocked(getCommentaryStatus).mockResolvedValue(idleStatus);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with null sessionId and idle defaults', () => {
    const { result } = renderHook(() =>
      useCommentarySession('/tmp/v.mp3', 'conversational', false),
    );
    expect(result.current.sessionId).toBeNull();
    expect(result.current.currentState).toBe('idle');
    expect(result.current.progressPct).toBe(0);
    expect(result.current.isReady).toBe(false);
  });

  it('creates a session on mount when videoPath is set', async () => {
    renderHook(() => useCommentarySession('/tmp/v.mp3', 'conversational', false));
    await waitFor(() => {
      expect(createCommentarySession).toHaveBeenCalledWith('/tmp/v.mp3', 'conversational');
    });
  });

  it('does not create session when videoPath is empty', () => {
    renderHook(() => useCommentarySession('', 'conversational', false));
    expect(createCommentarySession).not.toHaveBeenCalled();
  });

  it('does not create session when disabled=true', () => {
    renderHook(() => useCommentarySession('/tmp/v.mp3', 'conversational', true));
    expect(createCommentarySession).not.toHaveBeenCalled();
  });

  it('exposes isReady=true when state is idle and session exists', async () => {
    const { result } = renderHook(() =>
      useCommentarySession('/tmp/v.mp3', 'conversational', false),
    );
    await waitFor(() => {
      expect(result.current.sessionId).toBe('sess-abc');
    });
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });

  it('destroys session on unmount', async () => {
    const { unmount } = renderHook(() =>
      useCommentarySession('/tmp/v.mp3', 'conversational', false),
    );
    await waitFor(() => {
      expect(createCommentarySession).toHaveBeenCalled();
    });
    unmount();
    expect(destroyCommentarySession).toHaveBeenCalledWith('sess-abc');
  });

  it('resetSession destroys and clears state', async () => {
    const { result } = renderHook(() =>
      useCommentarySession('/tmp/v.mp3', 'conversational', false),
    );
    await waitFor(() => {
      expect(result.current.sessionId).toBe('sess-abc');
    });
    act(() => result.current.resetSession());
    expect(destroyCommentarySession).toHaveBeenCalledWith('sess-abc');
    expect(result.current.sessionId).toBeNull();
  });

  it('startAnalysis is a no-op (placeholder)', async () => {
    const { result } = renderHook(() =>
      useCommentarySession('/tmp/v.mp3', 'conversational', false),
    );
    await expect(result.current.startAnalysis()).resolves.toBeUndefined();
  });

  it('exposes selectedStyle on the return value', () => {
    const { result } = renderHook(() =>
      useCommentarySession('/tmp/v.mp3', 'humorous', false),
    );
    expect(result.current.selectedStyle).toBe('humorous');
  });
});
