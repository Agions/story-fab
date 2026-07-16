/**
 * google.ts 测试
 *
 * Stage 9 PR-1：Google Gemini 适配器覆盖
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callGoogle } from './google';
import type { RequestConfig } from './types';

const baseConfig: RequestConfig = {
  model: 'gemini-2.5-pro',
  messages: [{ role: 'user', content: 'hi' }],
};

describe('callGoogle', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to Gemini generateContent endpoint with API key in query', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'hello from gemini' }] } }],
          modelVersion: 'gemini-2.5-pro',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await callGoogle('gkey-test', baseConfig);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models/'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch.mock.calls[0]![0]).toContain('key=gkey-test');
    expect(result.content).toBe('hello from gemini');
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('builds body with contents array from messages', async () => {
    let captured: { body: string } | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: { body: string }) => {
        captured = init;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [{ content: { parts: [{ text: 'ok' }] } }],
            }),
        });
      }),
    );

    await callGoogle('k', baseConfig);

    const body = JSON.parse(captured?.body ?? '{}');
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'hi' }] }]);
  });

  it('returns empty content when candidates missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const result = await callGoogle('k', baseConfig);
    expect(result.content).toBe('');
  });

  it('falls back to config.model when modelVersion missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          }),
      }),
    );

    const result = await callGoogle('k', baseConfig);
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('throws ServiceError with status on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(callGoogle('k', baseConfig)).rejects.toMatchObject({
      name: 'ServiceError',
      statusCode: 403,
    });
  });
});
