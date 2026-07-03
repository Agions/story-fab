import { createPersistedStore } from './create-persisted-store';
import { createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

export interface UserSettings {
  compactMode: boolean;
  language: string;
  recentProjects: string[];
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  notifications: number;
  autoSave: boolean;
  userSettings: UserSettings;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  logout: () => void;
  setNotifications: (count: number) => void;
  clearNotifications: () => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  setAutoSave: (autoSave: boolean) => void;
  addRecentProject: (projectId: string) => void;
}

const defaultSettings: UserSettings = {
  compactMode: false,
  language: 'zh-CN',
  recentProjects: [],
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
  state: (set) => ({
    user: null,
    isAuthenticated: false,
    sidebarCollapsed: false,
    theme: 'light',
    notifications: 0,
    autoSave: true,
    userSettings: defaultSettings,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setTheme: (theme) => set({ theme }),
    toggleSidebar: () =>
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    logout: () => set({
      user: null,
      isAuthenticated: false,
      notifications: 0,
    }),
    setNotifications: (count) => set({ notifications: count }),
    clearNotifications: () => set({ notifications: 0 }),
    updateUserSettings: (settings) =>
      set((state) => ({
        userSettings: { ...state.userSettings, ...settings },
      })),
    setAutoSave: (autoSave) => set({ autoSave }),
    addRecentProject: (projectId) =>
      set((state) => ({
        userSettings: {
          ...state.userSettings,
          recentProjects: [
            projectId,
            ...state.userSettings.recentProjects.filter((id) => id !== projectId),
          ].slice(0, 10),
        },
      })),
  }),
});
