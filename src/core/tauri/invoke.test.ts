import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TauriBridgeError, TauriCommand, DEFAULT_TIMEOUT_MS } from './invoke';

// Mock @tauri-apps/api/core to avoid actual Tauri calls
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke as tauriInvoke } from '@tauri-apps/api/core';

describe('TauriBridgeError', () => {
  describe('fromInvoke', () => {
    it('classifies timeout errors', () => {
      const err = TauriBridgeError.fromInvoke(
        TauriCommand.CHECK_FFMPEG,
        new Error('Operation timed out after 30000ms'),
      );
      expect(err.kind).toBe('timeout');
      expect(err.retryable).toBe(true);
    });

    it('classifies deserialize errors', () => {
      const err = TauriBridgeError.fromInvoke(
        TauriCommand.ANALYZE_VIDEO,
        new Error('failed to deserialize: invalid type'),
      );
      expect(err.kind).toBe('deserialize');
      expect(err.retryable).toBe(false);
    });

    it('classifies aborted errors', () => {
      const err = TauriBridgeError.fromInvoke(
        TauriCommand.EXPORT_VIDEO,
        new Error('Request was aborted'),
      );
      expect(err.kind).toBe('aborted');
      expect(err.retryable).toBe(true);
    });

    it('classifies ipc-error by default', () => {
      const err = TauriBridgeError.fromInvoke(
        TauriCommand.TRANSCRIBE_AUDIO,
        new Error('FFmpeg failed: invalid data found'),
      );
      expect(err.kind).toBe('ipc-error');
      expect(err.retryable).toBe(false);
    });

    it('marks ipc-error with "busy"/"temporary" as retryable', () => {
      const err = TauriBridgeError.fromInvoke(
        TauriCommand.EXPORT_VIDEO,
        new Error('Resource busy, try again later'),
      );
      expect(err.kind).toBe('ipc-error');
      expect(err.retryable).toBe(true);
    });

    it('handles non-Error throws (e.g. string)', () => {
      const err = TauriBridgeError.fromInvoke(TauriCommand.CHECK_FFMPEG, 'oops');
      expect(err.kind).toBe('unknown');
      expect(err.retryable).toBe(false);
      expect(err.cause).toBe('oops');
    });

    it('preserves explicit kind from third arg', () => {
      const err = TauriBridgeError.fromInvoke(
        TauriCommand.CHECK_FFMPEG,
        new Error('whatever'),
        'deserialize',
      );
      expect(err.kind).toBe('deserialize');
    });

    it('returns existing TauriBridgeError as-is', () => {
      const original = new TauriBridgeError('orig', TauriCommand.CHECK_FFMPEG, 'timeout');
      const result = TauriBridgeError.fromInvoke(TauriCommand.ANALYZE_VIDEO, original);
      expect(result).toBe(original);
    });
  });

  describe('constructor', () => {
    it('stores all fields', () => {
      const cause = new Error('root');
      const err = new TauriBridgeError(
        'test message',
        TauriCommand.EXPORT_VIDEO,
        'ipc-error',
        cause,
        true,
      );
      expect(err.message).toBe('test message');
      expect(err.command).toBe(TauriCommand.EXPORT_VIDEO);
      expect(err.kind).toBe('ipc-error');
      expect(err.cause).toBe(cause);
      expect(err.retryable).toBe(true);
      expect(err.name).toBe('TauriBridgeError');
    });

    it('defaults kind to unknown and retryable to false', () => {
      const err = new TauriBridgeError('m', TauriCommand.CHECK_FFMPEG);
      expect(err.kind).toBe('unknown');
      expect(err.retryable).toBe(false);
    });
  });
});

describe('DEFAULT_TIMEOUT_MS', () => {
  it('is 30 seconds', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });
});

describe('invoke with timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(tauriInvoke).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects with TauriBridgeError(kind=timeout) when call exceeds timeoutMs', async () => {
    // Simulate a slow Tauri call
    vi.mocked(tauriInvoke).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 10_000)),
    );

    const { invoke } = await import('./invoke');
    const promise = invoke(TauriCommand.CHECK_FFMPEG, {}, { timeoutMs: 1000 });

    // Attach catch handler immediately to prevent unhandled rejection
    const caught = promise.catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(1000);
    const err = (await caught) as TauriBridgeError;

    expect(err).toBeInstanceOf(TauriBridgeError);
    expect(err.kind).toBe('timeout');
    expect(err.retryable).toBe(true);
  });

  it('does not apply timeout when timeoutMs=0', async () => {
    vi.mocked(tauriInvoke).mockResolvedValue({ installed: true });

    const { invoke } = await import('./invoke');
    const result = await invoke(TauriCommand.CHECK_FFMPEG, {}, { timeoutMs: 0 });
    expect(result).toEqual({ installed: true });
  });

  it('aborted signal throws TauriBridgeError(kind=aborted) without invoking', async () => {
    vi.mocked(tauriInvoke).mockClear();

    const { invoke } = await import('./invoke');
    const controller = new AbortController();
    controller.abort();

    await expect(
      invoke(TauriCommand.CHECK_FFMPEG, {}, { signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'aborted' });

    expect(tauriInvoke).not.toHaveBeenCalled();
  });
});
