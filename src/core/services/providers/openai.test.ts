/**
 * openai.ts 测试
 *
 * Stage 9 PR-1：OpenAI 适配器覆盖
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callOpenAI } from './openai';
import type { RequestConfig } from './types';

const baseConfig: RequestConfig = {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'hi' }],
};

describe('callOpenAI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to api.openai.com/v1/chat/completions', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'hello from gpt' } }],
          model: 'gpt-4o',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await callOpenAI('sk-test', baseConfig);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.content).toBe('hello from gpt');
    expect(result.model).toBe('gpt-4o');
  });

  it('sets Bearer Authorization header', async () => {
    let captured: { headers: Record<string, string> } | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: { headers: Record<string, string> }) => {
        captured = init;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
        });
      }),
    );

    await callOpenAI('sk-abc', baseConfig);

    expect(captured?.headers).toMatchObject({
      Authorization: 'Bearer sk-abc',
      'Content-Type': 'application/json',
    });
  });

  it('passes config directly as body (no transformation)', async () => {
    let captured: { body: string } | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: { body: string }) => {
        captured = init;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
        });
      }),
    );

    await callOpenAI('k', baseConfig);

    expect(JSON.parse(captured?.body ?? '{}')).toEqual(baseConfig);
  });

  it('returns empty content when choices missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const result = await callOpenAI('k', baseConfig);
    expect(result.content).toBe('');
  });

  it('throws ServiceError with "OpenAI API 错误" prefix on non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(callOpenAI('k', baseConfig)).rejects.toThrow(/OpenAI API 错误: 500/);
  });
});
