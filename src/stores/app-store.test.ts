/**
 * AppStore — 单元测试
 * 包含：原 app-store 测试 + 合并自 settings-store 的 AI 设置测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './app-store';

beforeEach(() => {
  // Reset store state between tests
  useAppStore.setState({
    sidebarCollapsed: false,
    theme: 'light',
    isDarkMode: false,
    autoSave: true,
    userSettings: { recentProjects: [] },
    aiSettings: {
      selectedAIModel: 'openai',
      aiModelsSettings: {
        openai:     { enabled: false },
        anthropic:  { enabled: false },
        google:     { enabled: false },
        alibaba:    { enabled: false },
        zhipu:      { enabled: false },
        moonshot:   { enabled: false },
        deepseek:   { enabled: false },
        iflytek:    { enabled: false },
        local:      { enabled: false },
        custom:     { enabled: false },
      },
    },
  });
});

describe('useAppStore', () => {
  describe('setTheme', () => {
    it('sets theme and isDarkMode', () => {
      useAppStore.getState().setTheme('dark');
      expect(useAppStore.getState().theme).toBe('dark');
      expect(useAppStore.getState().isDarkMode).toBe(true);
    });

    it('sets theme to light', () => {
      useAppStore.getState().setTheme('light');
      expect(useAppStore.getState().theme).toBe('light');
      expect(useAppStore.getState().isDarkMode).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      useAppStore.getState().setTheme('light');
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('dark');
    });

    it('toggles from dark to light', () => {
      useAppStore.getState().setTheme('dark');
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('light');
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebarCollapsed', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('setAutoSave', () => {
    it('sets autoSave', () => {
      useAppStore.getState().setAutoSave(false);
      expect(useAppStore.getState().autoSave).toBe(false);
    });
  });

  describe('addRecentProject', () => {
    it('adds project to front of list', () => {
      useAppStore.getState().addRecentProject('proj-1');
      expect(useAppStore.getState().userSettings.recentProjects[0]).toBe('proj-1');
    });

    it('deduplicates and caps at 50', () => {
      const ids = Array.from({ length: 55 }, (_, i) => `proj-${i}`);
      for (const id of ids) {
        useAppStore.getState().addRecentProject(id);
      }
      expect(useAppStore.getState().userSettings.recentProjects).toHaveLength(50);
      // Last added should be first
      expect(useAppStore.getState().userSettings.recentProjects[0]).toBe('proj-54');
    });
  });

  // ─── AI Settings（迁移自 settings-store） ───────────────────

  describe('aiSettings.selectedAIModel', () => {
    it('defaults to openai', () => {
      expect(useAppStore.getState().aiSettings.selectedAIModel).toBe('openai');
    });
  });

  describe('updateAIModelSettings', () => {
    it('updates settings for a model', () => {
      useAppStore.getState().updateAIModelSettings('openai', { enabled: true, apiKey: 'k' });
      expect(useAppStore.getState().aiSettings.aiModelsSettings.openai.enabled).toBe(true);
      expect(useAppStore.getState().aiSettings.aiModelsSettings.openai.apiKey).toBe('k');
    });

    it('does not affect other models', () => {
      useAppStore.getState().updateAIModelSettings('openai', { enabled: true });
      expect(useAppStore.getState().aiSettings.aiModelsSettings.anthropic.enabled).toBe(false);
    });

    it('merges partial settings', () => {
      useAppStore.getState().updateAIModelSettings('openai', { temperature: 0.5 });
      expect(useAppStore.getState().aiSettings.aiModelsSettings.openai.temperature).toBe(0.5);
    });
  });

  describe('setSelectedAIModel', () => {
    it('changes selected model', () => {
      useAppStore.getState().setSelectedAIModel('anthropic');
      expect(useAppStore.getState().aiSettings.selectedAIModel).toBe('anthropic');
    });
  });
});
