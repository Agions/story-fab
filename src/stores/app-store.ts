import { createPersistedStore } from './create-persisted-store';
import { createJSONStorage } from 'zustand/middleware';

export interface UserSettings {
  /** 最近打开的项目 ID 列表（新 → 旧，限 50） */
  recentProjects: string[];
}

export interface AppState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  /** 派生自 theme === 'dark'（保持向后兼容，不直接 set） */
  isDarkMode: boolean;
  autoSave: boolean;
  userSettings: UserSettings;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setAutoSave: (autoSave: boolean) => void;
  addRecentProject: (projectId: string) => void;
}

const defaultSettings: UserSettings = {
  recentProjects: [],
};

const applyThemeClass = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }
};

export const useAppStore = createPersistedStore<AppState>({
  name: 'StoryFab-app',
  devtoolsName: 'AppStore',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    theme: state.theme,
    sidebarCollapsed: state.sidebarCollapsed,
    userSettings: state.userSettings,
    autoSave: state.autoSave,
  }),
  state: (set, get) => ({
    sidebarCollapsed: false,
    theme: 'light',
    isDarkMode: false,
    autoSave: true,
    userSettings: defaultSettings,
    setTheme: (theme) => {
      applyThemeClass(theme);
      set({ theme, isDarkMode: theme === 'dark' });
    },
    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
    toggleSidebar: () =>
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setAutoSave: (autoSave) => set({ autoSave }),
    addRecentProject: (projectId) =>
      set((state) => ({
        userSettings: {
          ...state.userSettings,
          recentProjects: [
            projectId,
            ...state.userSettings.recentProjects.filter((id) => id !== projectId),
          ].slice(0, 50),
        },
      })),
  }),
});
