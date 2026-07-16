/**
 * mock.ts 测试
 *
 * Stage 9 PR-1：Mock provider 覆盖（用于测试 + 离线）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockCall } from './mock';
import type { RequestConfig } from './types';

const baseConfig: RequestConfig = {
  model: 'mock-model',
  messages: [{ role: 'user', content: 'test' }],
};

describe('mockCall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with content after simulated delay', async () => {
    const promise = mockCall(baseConfig);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.content).toContain('模拟生成的脚本');
    expect(result.content).toContain('【开场】');
  });

  it('returns usage tokens', async () => {
    const promise = mockCall(baseConfig);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.usage).toEqual({
      prompt_tokens: 500,
      completion_tokens: 300,
      total_tokens: 800,
    });
  });

  it('echoes back the requested model name', async () => {
    const promise = mockCall({ ...baseConfig, model: 'custom-mock' });
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.model).toBe('custom-mock');
  });
});
