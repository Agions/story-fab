/**
 * Settings Store — Zustand v5
 *
 * Replaces src/context/settings-context.tsx
 * Provides the same API: useSettingsStore() with settings, updateSettings, compactMode, language, addRecentProject
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useAppStore } from './app-store';

interface SettingsState {
  settings: {
    compactMode: boolean;
    language: string;
    recentProjects: string[];
  };
  updateSettings: (settings: Partial<{ compactMode: boolean; language: string; recentProjects: string[] }>) => void;
  compactMode: boolean;
  language: string;
  addRecentProject: (projectId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    settings: {
      compactMode: false,
      language: 'zh-CN',
      recentProjects: [],
    },
    compactMode: false,
    language: 'zh-CN',

    updateSettings: (partial) => {
      const current = get().settings;
      const next = { ...current, ...partial };
      set({ settings: next, compactMode: next.compactMode, language: next.language });
      useAppStore.getState().updateUserSettings(next);
    },

    addRecentProject: (projectId: string) => {
      const recent = get().settings.recentProjects;
      const filtered = recent.filter(id => id !== projectId);
      const next = [projectId, ...filtered].slice(0, 50);
      set({ settings: { ...get().settings, recentProjects: next } });
      useAppStore.getState().addRecentProject(projectId);
    },
  }))
);
