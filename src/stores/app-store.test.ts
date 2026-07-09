/**
 * AppStore — 单元测试
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
});
