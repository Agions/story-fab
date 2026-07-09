/**
 * SettingsStore — 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settings-store';

beforeEach(() => {
  useSettingsStore.setState({
    selectedAIModel: 'openai',
    aiModelsSettings: {
      openai: { enabled: false },
      anthropic: { enabled: false },
      google: { enabled: false },
      alibaba: { enabled: false },
      zhipu: { enabled: false },
      moonshot: { enabled: false },
      deepseek: { enabled: false },
      iflytek: { enabled: false },
      local: { enabled: false },
      custom: { enabled: false },
    },
  });
});

describe('useSettingsStore', () => {
  describe('selectedAIModel', () => {
    it('defaults to openai', () => {
      expect(useSettingsStore.getState().selectedAIModel).toBe('openai');
    });
  });

  describe('updateAIModelSettings', () => {
    it('updates settings for a model', () => {
      useSettingsStore.getState().updateAIModelSettings('openai', { enabled: true, apiKey: 'k' });
      expect(useSettingsStore.getState().aiModelsSettings.openai.enabled).toBe(true);
      expect(useSettingsStore.getState().aiModelsSettings.openai.apiKey).toBe('k');
    });

    it('does not affect other models', () => {
      useSettingsStore.getState().updateAIModelSettings('openai', { enabled: true });
      expect(useSettingsStore.getState().aiModelsSettings.anthropic.enabled).toBe(false);
    });

    it('merges partial settings', () => {
      useSettingsStore.getState().updateAIModelSettings('openai', { temperature: 0.5 });
      expect(useSettingsStore.getState().aiModelsSettings.openai.temperature).toBe(0.5);
    });
  });
});
