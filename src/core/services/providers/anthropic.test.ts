/**
 * anthropic.ts 测试
 *
 * Stage 9 PR-1：Anthropic 适配器覆盖
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callAnthropic } from './anthropic';
import type { RequestConfig } from './types';

const baseConfig: RequestConfig = {
  model: 'claude-3.5-sonnet',
  messages: [{ role: 'user', content: 'hi' }],
  max_tokens: 1024,
  temperature: 0.7,
};

describe('callAnthropic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to https://api.anthropic.com/v1/messages', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: 'hello from claude' }],
          model: 'claude-3.5-sonnet',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await callAnthropic('sk-ant-test', baseConfig);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.content).toBe('hello from claude');
    expect(result.model).toBe('claude-3.5-sonnet');
    expect(result.usage?.total_tokens).toBe(15);
  });

  it('sets x-api-key and anthropic-version headers', async () => {
    let captured: { headers: Record<string, string> } | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: { headers: Record<string, string> }) => {
        captured = init;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: [{ text: 'ok' }], model: 'claude-3.5-sonnet' }),
        });
      }),
    );

    await callAnthropic('sk-ant-key', baseConfig);

    expect(captured?.headers).toMatchObject({
      'x-api-key': 'sk-ant-key',
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    });
  });

  it('builds body with model, messages, max_tokens, temperature', async () => {
    let captured: { body: string } | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: { body: string }) => {
        captured = init;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: [{ text: 'ok' }] }),
        });
      }),
    );

    await callAnthropic('k', baseConfig);

    const body = JSON.parse(captured?.body ?? '{}');
    expect(body).toEqual({
      model: 'claude-3.5-sonnet',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1024,
      temperature: 0.7,
    });
  });

  it('returns empty string when content array is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [] }),
      }),
    );

    const result = await callAnthropic('k', baseConfig);
    expect(result.content).toBe('');
  });

  it('falls back to config.model when response model is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: 'ok' }] }),
      }),
    );

    const result = await callAnthropic('k', baseConfig);
    expect(result.model).toBe('claude-3.5-sonnet');
  });
});
