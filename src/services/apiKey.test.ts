import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { validateApiKey } from './apiKey';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Properly mock isAxiosError as a function
mockedAxios.isAxiosError = vi.fn((val: unknown) =>
  Boolean(val && typeof val === 'object' && 'isAxiosError' in val && (val as Record<string, unknown>).isAxiosError === true)
);

describe('validateApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should reject empty api key', async () => {
      const result = await validateApiKey('openai', '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API 密钥格式无效');
    });

    it('should reject whitespace-only api key', async () => {
      const result = await validateApiKey('openai', '   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API 密钥格式无效');
    });

    it('should reject api key shorter than 10 chars', async () => {
      const result = await validateApiKey('openai', 'sk-short');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API 密钥格式无效');
    });
  });

  describe('OpenAI', () => {
    it('should validate correct OpenAI key', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      const result = await validateApiKey('openai', 'sk-validopenai1234567890');
      expect(result.isValid).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer sk-validopenai1234567890' }) })
      );
    });

    it('should handle 401 unauthorized', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: null },
      });
      const result = await validateApiKey('openai', 'sk-invalid1234567890');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API 密钥无效或已过期');
    });

    it('should handle 403 forbidden', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 403, data: null },
      });
      const result = await validateApiKey('openai', 'sk-forbidden1234567890');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API 密钥没有访问权限');
    });

    it('should handle timeout', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        code: 'ECONNABORTED',
        response: null,
      });
      const result = await validateApiKey('openai', 'sk-timeout1234567890');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API 密钥验证超时，请检查网络连接');
    });
  });

  describe('DeepSeek', () => {
    it('should validate correct DeepSeek key', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      const result = await validateApiKey('deepseek', 'sk-deepseekvalid1234567890');
      expect(result.isValid).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/models',
        expect.any(Object)
      );
    });
  });

  describe('Anthropic', () => {
    it('should validate correct Anthropic key', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });
      const result = await validateApiKey('anthropic', 'sk-antropicvalid1234567890');
      expect(result.isValid).toBe(true);
    });
  });

  describe('iFlytek', () => {
    it('should reject iflytek key without commas', async () => {
      const result = await validateApiKey('iflytek', 'no-comma-key');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('讯飞星火 API 密钥格式无效（应为 app_id,api_key,api_secret）');
    });

    it('should reject iflytek key with less than 3 parts', async () => {
      const result = await validateApiKey('iflytek', 'part1,part2');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('讯飞星火 API 密钥格式无效（应为 app_id,api_key,api_secret）');
    });

    it('should accept valid iflytek format', async () => {
      const result = await validateApiKey('iflytek', 'app_id,api_key,api_secret');
      expect(result.isValid).toBe(true);
    });
  });

  describe('unknown provider', () => {
    it('should skip validation for unknown provider', async () => {
      const result = await validateApiKey('unknown-provider', 'any-key-value-12345');
      expect(result.isValid).toBe(true);
    });
  });

  describe('network errors', () => {
    it('should handle non-axios errors', async () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.get.mockRejectedValue(new Error('Unexpected error'));
      const result = await validateApiKey('openai', 'sk-network1234567890');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('should handle axios errors without response', async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        message: 'Network failed',
        response: null,
      });
      const result = await validateApiKey('openai', 'sk-noresp1234567890');
      expect(result.isValid).toBe(false);
    });
  });
});
