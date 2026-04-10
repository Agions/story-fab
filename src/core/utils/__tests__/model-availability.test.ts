import { describe, it, expect } from 'vitest';
import {
  getConfiguredProviders,
  getAvailableModelsFromApiKeys,
  resolveDefaultModelId,
} from '../model-availability';

describe('model-availability', () => {
  describe('getConfiguredProviders', () => {
    it('should return empty set for empty apiKeys', () => {
      const result = getConfiguredProviders({});
      expect(result.size).toBe(0);
    });

    it('should return providers with valid api keys', () => {
      const apiKeys = {
        openai: { key: 'sk-test-123', isValid: true },
        anthropic: { key: '', isValid: false },
      };
      const result = getConfiguredProviders(apiKeys);
      expect(result.size).toBe(1);
      expect(result.has('openai')).toBe(true);
    });

    it('should exclude providers with empty keys', () => {
      const apiKeys = {
        openai: { key: '  ', isValid: true },
      };
      const result = getConfiguredProviders(apiKeys);
      expect(result.size).toBe(0);
    });
  });

  describe('getAvailableModelsFromApiKeys', () => {
    const mockModels = [
      { provider: 'openai', id: 'gpt-4', isAvailable: true },
      { provider: 'anthropic', id: 'claude-3', isAvailable: true },
      { provider: 'google', id: 'gemini-pro', isAvailable: false },
    ];

    it('should filter models by configured providers', () => {
      const apiKeys = {
        openai: { key: 'sk-test' },
      };
      const result = getAvailableModelsFromApiKeys(apiKeys, mockModels as any);
      expect(result.length).toBe(1);
// @ts-ignore
      expect(result[0].id).toBe('gpt-4');
    });

    it('should exclude unavailable models', () => {
      const apiKeys = {
        openai: { key: 'sk-test' },
        anthropic: { key: 'sk-ant' },
        google: { key: 'sk-google' },
      };
      const result = getAvailableModelsFromApiKeys(apiKeys, mockModels as any);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no providers configured', () => {
      const result = getAvailableModelsFromApiKeys({}, mockModels as any);
      expect(result.length).toBe(0);
    });
  });

  describe('resolveDefaultModelId', () => {
    const availableModels = [
      { id: 'gpt-4' },
      { id: 'gpt-3.5' },
    ];

    it('should return modelId if it exists', () => {
      expect(resolveDefaultModelId('gpt-4', availableModels)).toBe('gpt-4');
    });

    it('should return first available model if modelId not found', () => {
      expect(resolveDefaultModelId('unknown', availableModels)).toBe('gpt-4');
    });

    it('should return DEFAULT_MODEL_ID if no models available', () => {
      const result = resolveDefaultModelId('unknown', []);
      expect(result).toBe('gpt-5.3-codex'); // DEFAULT_MODEL_ID
    });
  });
});
