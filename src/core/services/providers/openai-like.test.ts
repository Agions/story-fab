/**
 * openai-like.ts 测试
 *
 * Stage 9 PR-1：OpenAI 兼容 API 适配器（阿里/智谱/Moonshot）覆盖
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callAlibaba, callZhipu, callMoonshot } from './openai-like';
import type { RequestConfig } from './types';

const baseConfig: RequestConfig = {
  model: 'qwen-max',
  messages: [{ role: 'user', content: 'hi' }],
};

describe('OpenAI-like providers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('callAlibaba (DashScope)', () => {
    it('POSTs to dashscope.aliyuncs.com endpoint', async () => {
      let capturedUrl = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ choices: [{ message: { content: 'qwen reply' } }] }),
          });
        }),
      );

      const result = await callAlibaba('ak-test', baseConfig);

      expect(capturedUrl).toBe(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      );
      expect(result.content).toBe('qwen reply');
    });
  });

  describe('callZhipu (BigModel)', () => {
    it('POSTs to open.bigmodel.cn endpoint', async () => {
      let capturedUrl = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ choices: [{ message: { content: 'glm reply' } }] }),
          });
        }),
      );

      const result = await callZhipu('zk-test', baseConfig);

      expect(capturedUrl).toBe('https://open.bigmodel.cn/api/paas/v4/chat/completions');
      expect(result.content).toBe('glm reply');
    });
  });

  describe('callMoonshot (Kimi)', () => {
    it('POSTs to api.moonshot.cn endpoint', async () => {
      let capturedUrl = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ choices: [{ message: { content: 'kimi reply' } }] }),
          });
        }),
      );

      const result = await callMoonshot('mk-test', baseConfig);

      expect(capturedUrl).toBe('https://api.moonshot.cn/v1/chat/completions');
      expect(result.content).toBe('kimi reply');
    });
  });

  it('all 3 providers use Bearer Authorization', async () => {
    const capturedHeaders: Array<Record<string, string>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: { headers: Record<string, string> }) => {
        capturedHeaders.push(init.headers);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
        });
      }),
    );

    await callAlibaba('ak', baseConfig);
    await callZhipu('zk', baseConfig);
    await callMoonshot('mk', baseConfig);

    expect(capturedHeaders.map((h) => h.Authorization)).toEqual([
      'Bearer ak',
      'Bearer zk',
      'Bearer mk',
    ]);
  });
});
