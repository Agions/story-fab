/**
 * shared.ts (callAIProvider) 测试
 *
 * Stage 9 PR-1：核心 LLM 通用调用逻辑覆盖
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callAIProvider, type ProviderConfig } from './shared';
import type { RequestConfig, AIResponse } from './types';

const baseConfig: RequestConfig = {
  model: 'test-model',
  messages: [{ role: 'user', content: 'hello' }],
};

const successProvider: ProviderConfig = {
  buildUrl: () => 'https://api.test.com/v1/chat',
  buildHeaders: () => ({ 'Content-Type': 'application/json' }),
  buildBody: () => ({ model: 'test-model' }),
  parseResponse: (data): AIResponse => ({
    content: (data as { text: string }).text,
    model: 'test-model',
  }),
};

describe('callAIProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST request with built url, headers, body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: 'hi there' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await callAIProvider('sk-test', baseConfig, successProvider);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ model: 'test-model' }),
      }),
    );
    expect(result.content).toBe('hi there');
    expect(result.model).toBe('test-model');
  });

  it('throws ServiceError on non-ok response with status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    await expect(callAIProvider('k', baseConfig, successProvider)).rejects.toMatchObject({
      name: 'ServiceError',
      statusCode: 429,
    });
  });

  it('uses provider errorMessage when present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const customProvider: ProviderConfig = { ...successProvider, errorMessage: 'OpenAI 错误' };
    await expect(callAIProvider('k', baseConfig, customProvider)).rejects.toThrow(
      /OpenAI 错误.*500/,
    );
  });

  it('falls back to default error prefix when errorMessage is not set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const noMessage: ProviderConfig = {
      buildUrl: successProvider.buildUrl,
      buildHeaders: successProvider.buildHeaders,
      buildBody: successProvider.buildBody,
      parseResponse: successProvider.parseResponse,
    };
    await expect(callAIProvider('k', baseConfig, noMessage)).rejects.toThrow(/^API 错误: 503$/);
  });

  it('passes parseResponse the parsed JSON data', async () => {
    const parseSpy = vi.fn((data: unknown): AIResponse => ({
      content: (data as { result: string }).result,
      model: 'parsed',
    }));
    const provider: ProviderConfig = { ...successProvider, parseResponse: parseSpy };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: 'parsed content' }),
      }),
    );

    const result = await callAIProvider('k', baseConfig, provider);

    expect(parseSpy).toHaveBeenCalledWith({ result: 'parsed content' }, baseConfig);
    expect(result.content).toBe('parsed content');
    expect(result.model).toBe('parsed');
  });

  it('passes apiKey and config to buildUrl/buildHeaders/buildBody', async () => {
    const buildUrl = vi.fn().mockReturnValue('https://api.test.com');
    const buildHeaders = vi.fn().mockReturnValue({});
    const buildBody = vi.fn().mockReturnValue({});
    const provider: ProviderConfig = {
      buildUrl,
      buildHeaders,
      buildBody,
      parseResponse: successProvider.parseResponse,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }),
    );

    await callAIProvider('sk-abc', baseConfig, provider);

    expect(buildUrl).toHaveBeenCalledWith('sk-abc', baseConfig);
    expect(buildHeaders).toHaveBeenCalledWith('sk-abc', baseConfig);
    expect(buildBody).toHaveBeenCalledWith('sk-abc', baseConfig);
  });
});
