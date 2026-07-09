/**
 * Commentary Pipeline Service — 单元测试
 *
 * 覆盖：
 * - runCommentaryPipeline 调用 tauri.runCommentaryPipeline
 * - onPipelineProgress / onPipelineComplete / onPipelineError 事件订阅
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCommentaryPipeline, onPipelineProgress, onPipelineComplete, onPipelineError } from './pipeline-service';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockTauri = {
  runCommentaryPipeline: vi.fn(),
};

vi.mock('@/core/tauri', () => ({
  tauri: {
    runCommentaryPipeline: (...args: unknown[]) => mockTauri.runCommentaryPipeline(...args),
  },
}));

const mockListen = vi.fn();
vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => mockListen(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('runCommentaryPipeline', () => {
  it('forces autoApprove to true before invoking', async () => {
    mockTauri.runCommentaryPipeline.mockResolvedValue({
      script: { id: 's1', segments: [], content: '', metadata: {}, createdAt: '', updatedAt: '' },
      audioFiles: [],
      totalAudioDurationSecs: 10,
    });

    const result = await runCommentaryPipeline({
      videoPath: '/v.mp4',
      subtitles: 'subs',
      style: 'humorous',
      provider: 'openai',
      apiKey: 'key',
      voice: 'voice-1',
      speed: 1.0,
      format: 'mp3',
    });

    expect(mockTauri.runCommentaryPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        videoPath: '/v.mp4',
        autoApprove: true,
      }),
    );
    expect(result.totalAudioDurationSecs).toBe(10);
  });
});

describe('pipeline event listeners', () => {
  it('onPipelineProgress wraps listen with pipeline-progress event', async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);

    const cleanup = await onPipelineProgress((_event) => {
      // callback
    });

    expect(mockListen).toHaveBeenCalledWith(
      'pipeline-progress',
      expect.any(Function),
    );
    expect(cleanup).toBe(unlisten);
  });

  it('onPipelineComplete wraps listen with pipeline-complete event', async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);

    const cleanup = await onPipelineComplete(() => {});
    expect(mockListen).toHaveBeenCalledWith('pipeline-complete', expect.any(Function));
    expect(cleanup).toBe(unlisten);
  });

  it('onPipelineError wraps listen with pipeline-error event', async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);

    const cleanup = await onPipelineError(() => {});
    expect(mockListen).toHaveBeenCalledWith('pipeline-error', expect.any(Function));
    expect(cleanup).toBe(unlisten);
  });
});
