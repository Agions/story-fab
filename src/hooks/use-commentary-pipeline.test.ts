/**
 * use-commentary-pipeline 测试
 *
 * Stage 9 PR-12：评论流水线 hook 覆盖
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/core/services/commentary/pipeline-service', () => ({
  runCommentaryPipeline: vi.fn(),
  onPipelineProgress: vi.fn(),
  onPipelineComplete: vi.fn(),
  onPipelineError: vi.fn(),
}));

import {
  runCommentaryPipeline,
  onPipelineProgress,
  onPipelineComplete,
  onPipelineError,
} from '@/core/services/commentary/pipeline-service';
import { useCommentaryPipeline } from './use-commentary-pipeline';
import type {
  CommentaryPipelineInput,
  CommentaryPipelineOutput,
  PipelineProgressEvent,
  PipelineErrorEvent,
} from '@/types';

const mockInput: CommentaryPipelineInput = { videoPath: '/tmp/v.mp3' };
const mockOutput: CommentaryPipelineOutput = {
  videoPath: '/tmp/v.mp3',
  sessionId: 'sess-1',
  durationSecs: 60,
} as unknown as CommentaryPipelineOutput;

const mockProgress: PipelineProgressEvent = {
  stage: 'analysis',
  progressPct: 0.5,
  message: 'analysing',
} as PipelineProgressEvent;

const mockErrEvent: PipelineErrorEvent = {
  stage: 'analysis',
  error: 'oops',
} as PipelineErrorEvent;

describe('useCommentaryPipeline', () => {
  beforeEach(() => {
    vi.mocked(runCommentaryPipeline).mockResolvedValue(mockOutput);
    vi.mocked(onPipelineProgress).mockResolvedValue(vi.fn());
    vi.mocked(onPipelineComplete).mockResolvedValue(vi.fn());
    vi.mocked(onPipelineError).mockResolvedValue(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with idle defaults', () => {
    const { result } = renderHook(() => useCommentaryPipeline());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('runs the pipeline and returns output', async () => {
    const { result } = renderHook(() => useCommentaryPipeline());
    let out: CommentaryPipelineOutput | null = null;
    await act(async () => {
      out = await result.current.run(mockInput);
    });
    expect(runCommentaryPipeline).toHaveBeenCalledWith(mockInput);
    expect(out).toEqual(mockOutput);
    expect(result.current.isRunning).toBe(false);
  });

  it('clears stale progress and error before each run', async () => {
    const { result } = renderHook(() => useCommentaryPipeline());
    // First run triggers a progress event
    vi.mocked(onPipelineProgress).mockImplementation(async (cb) => {
      cb(mockProgress);
      return vi.fn();
    });
    await act(async () => {
      await result.current.run(mockInput);
    });
    expect(result.current.progress).toEqual(mockProgress);

    // Second run should clear progress first
    vi.mocked(onPipelineProgress).mockResolvedValue(vi.fn());
    await act(async () => {
      await result.current.run(mockInput);
    });
    expect(result.current.progress).toBeNull();
  });

  it('captures pipeline error event', async () => {
    vi.mocked(onPipelineError).mockImplementation(async (cb) => {
      cb(mockErrEvent);
      return vi.fn();
    });
    const { result } = renderHook(() => useCommentaryPipeline());
    await act(async () => {
      await result.current.run(mockInput);
    });
    expect(result.current.error).toEqual(mockErrEvent);
  });

  it('converts thrown error into PipelineErrorEvent with stage=invoke', async () => {
    vi.mocked(runCommentaryPipeline).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useCommentaryPipeline());
    await act(async () => {
      await result.current.run(mockInput);
    });
    expect(result.current.error).toEqual({ stage: 'invoke', error: 'boom' });
    expect(result.current.isRunning).toBe(false);
  });

  it('refuses to re-enter when already running', async () => {
    // Slow pipeline
    let resolveRun!: (v: CommentaryPipelineOutput) => void;
    vi.mocked(runCommentaryPipeline).mockImplementation(
      () => new Promise<CommentaryPipelineOutput>((r) => { resolveRun = r; }),
    );
    const { result } = renderHook(() => useCommentaryPipeline());

    let first: Promise<CommentaryPipelineOutput | null>;
    act(() => {
      first = result.current.run(mockInput);
    });
    expect(result.current.isRunning).toBe(true);

    // Second call while running
    let secondOut: CommentaryPipelineOutput | null = mockOutput;
    await act(async () => {
      secondOut = await result.current.run(mockInput);
    });
    expect(secondOut).toBeNull();
    expect(runCommentaryPipeline).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRun(mockOutput);
      await first;
    });
  });

  it('cleans up listeners on unmount', async () => {
    const unlistenA = vi.fn();
    const unlistenB = vi.fn();
    const unlistenC = vi.fn();
    vi.mocked(onPipelineProgress).mockResolvedValue(unlistenA);
    vi.mocked(onPipelineComplete).mockResolvedValue(unlistenB);
    vi.mocked(onPipelineError).mockResolvedValue(unlistenC);

    const { result, unmount } = renderHook(() => useCommentaryPipeline());
    await act(async () => {
      await result.current.run(mockInput);
    });
    unmount();
    expect(unlistenA).toHaveBeenCalled();
    expect(unlistenB).toHaveBeenCalled();
    expect(unlistenC).toHaveBeenCalled();
  });

  it('clears listeners between consecutive runs', async () => {
    const unlisten1 = vi.fn();
    const unlisten2 = vi.fn();
    vi.mocked(onPipelineProgress)
      .mockResolvedValueOnce(unlisten1)
      .mockResolvedValueOnce(unlisten2);

    const { result } = renderHook(() => useCommentaryPipeline());
    await act(async () => {
      await result.current.run(mockInput);
    });
    await act(async () => {
      await result.current.run(mockInput);
    });
    expect(unlisten1).toHaveBeenCalled();
  });

  it('captures complete-event duration (logging only, no state mutation)', async () => {
    vi.mocked(onPipelineComplete).mockImplementation(async (cb) => {
      cb({ totalDurationMs: 1234 } as never);
      return vi.fn();
    });
    const { result } = renderHook(() => useCommentaryPipeline());
    await act(async () => {
      await result.current.run(mockInput);
    });
    // complete event is logged but does not set state directly
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
