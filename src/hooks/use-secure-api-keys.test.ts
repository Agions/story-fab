/**
 * use-secure-api-keys 测试
 *
 * Stage 9 PR-10：Tauri Store 加密 API key hook 覆盖
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the api-key-service module
vi.mock('@/core/services/auth/api-key-service', () => ({
  getAllApiKeys: vi.fn(),
  setApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
  getApiKey: vi.fn(),
}));

import { getAllApiKeys, setApiKey, deleteApiKey } from '@/core/services/auth/api-key-service';
import { useSecureApiKeys, type ApiKeyConfig } from './use-secure-api-keys';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('useSecureApiKeys', () => {
  beforeEach(() => {
    vi.mocked(getAllApiKeys).mockResolvedValue({});
    vi.mocked(setApiKey).mockResolvedValue();
    vi.mocked(deleteApiKey).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns initialValue when no keys exist', () => {
    const initial = { openai: { key: 'sk-1' } };
    const { result } = renderHook(() => useSecureApiKeys(initial));
    expect(result.current[0]).toEqual(initial);
  });

  it('loads keys from Tauri Store on mount', async () => {
    vi.mocked(getAllApiKeys).mockResolvedValue({
      openai: 'sk-openai',
      anthropic: 'sk-anthropic',
    });

    const { result } = renderHook(() => useSecureApiKeys());

    await waitFor(() => {
      expect(result.current[0].openai?.key).toBe('sk-openai');
    });
    expect(result.current[0].anthropic?.key).toBe('sk-anthropic');
  });

  it('falls back to initialValue on load error', async () => {
    vi.mocked(getAllApiKeys).mockRejectedValue(new Error('store error'));
    const initial = { openai: { key: 'fallback' } };
    const { result } = renderHook(() => useSecureApiKeys(initial));

    await waitFor(() => {
      expect(result.current[0].openai?.key).toBe('fallback');
    });
  });

  it('does not update state after unmount during load', async () => {
    let resolveLoad: (keys: Record<string, string>) => void = () => {};
    vi.mocked(getAllApiKeys).mockReturnValue(
      new Promise<Record<string, string>>((resolve) => {
        resolveLoad = resolve;
      }),
    );

    const { result, unmount } = renderHook(() => useSecureApiKeys({ initial: { key: 'init' } }));

    unmount();
    resolveLoad({ openai: 'should-not-apply' });
    await sleep(20);

    expect(result.current[0]).toEqual({ initial: { key: 'init' } });
  });

  it('debounces save (waits ~100ms before persisting)', async () => {
    const { result } = renderHook(() => useSecureApiKeys());

    act(() => {
      result.current[1]({ openai: { key: 'sk-1' } });
    });

    // Right after set, no save yet (debounce window)
    await sleep(20);
    expect(setApiKey).not.toHaveBeenCalled();

    // After debounce window
    await waitFor(
      () => {
        expect(setApiKey).toHaveBeenCalledWith('openai', 'sk-1');
      },
      { timeout: 500 },
    );
  });

  it('calls setApiKey for new key', async () => {
    const { result } = renderHook(() => useSecureApiKeys());
    const next: Record<string, ApiKeyConfig> = { openai: { key: 'sk-new' } };

    act(() => {
      result.current[1](next);
    });

    await waitFor(() => {
      expect(setApiKey).toHaveBeenCalledWith('openai', 'sk-new');
    });
  });

  it('calls deleteApiKey for empty key', async () => {
    const { result } = renderHook(() => useSecureApiKeys());
    const next: Record<string, ApiKeyConfig> = { openai: { key: '' } };

    act(() => {
      result.current[1](next);
    });

    await waitFor(() => {
      expect(deleteApiKey).toHaveBeenCalledWith('openai');
    });
    expect(setApiKey).not.toHaveBeenCalled();
  });

  it('deletes keys that were removed from state', async () => {
    vi.mocked(getAllApiKeys).mockResolvedValue({
      openai: 'sk-openai',
      anthropic: 'sk-anthropic',
    });

    const { result } = renderHook(() => useSecureApiKeys());

    await waitFor(() => {
      expect(result.current[0].openai).toBeDefined();
    });

    act(() => {
      result.current[1]({ openai: { key: 'sk-openai' } });
    });

    await waitFor(
      () => {
        expect(deleteApiKey).toHaveBeenCalledWith('anthropic');
      },
      { timeout: 500 },
    );
  });

  it('cancels pending save when called again before debounce window', async () => {
    const { result } = renderHook(() => useSecureApiKeys());

    act(() => {
      result.current[1]({ openai: { key: 'sk-1' } });
    });

    // Update again before debounce window
    await sleep(20);
    act(() => {
      result.current[1]({ openai: { key: 'sk-2' } });
    });

    await waitFor(
      () => {
        expect(setApiKey).toHaveBeenCalledWith('openai', 'sk-2');
      },
      { timeout: 500 },
    );
    expect(setApiKey).toHaveBeenCalledTimes(1);
  });
});
