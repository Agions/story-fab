/**
 * 用户状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIModelSettings, UserPreferences } from '@/core/types';
import { storageService } from '@/core/services';

export interface UserState {
  // 用户信息
  userId: string | null;
  username: string | null;
  email: string | null;
  avatar: string | null;
  
  // 偏好设置
  preferences: UserPreferences;
  
  // API 设置
  apiSettings: Record<string, AIModelSettings>;
  
  // 最近文件
  recentFiles: string[];
  
  // Actions
  setUser: (user: Partial<Omit<UserState, 'setUser' | 'updatePreferences' | 'setApiSettings' | 'addRecentFile' | 'removeRecentFile'>>) => void;
  clearUser: () => void;
  
  // 偏好设置
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  
  // API 设置
  setApiSettings: (provider: string, settings: AIModelSettings) => void;
  removeApiSettings: (provider: string) => void;
  getApiSettings: (provider: string) => AIModelSettings | null;
  
  // 最近文件
  addRecentFile: (path: string) => void;
  removeRecentFile: (path: string) => void;
  clearRecentFiles: () => void;
}

const defaultPreferences: UserPreferences = {
  autoSave: true,
  autoSaveInterval: 30,
  defaultVideoQuality: 'high',
  defaultOutputFormat: 'mp4',
  enablePreview: true,
  previewQuality: 'medium',
  notifications: true,
  soundEffects: true
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      userId: null,
      username: null,
      email: null,
      avatar: null,
      preferences: { ...defaultPreferences },
      apiSettings: {},
      recentFiles: [],

      // Actions
      setUser: (user) => set(state => ({ ...state, ...user })),

      clearUser: () => set({
        userId: null,
        username: null,
        email: null,
        avatar: null
      }),

      // 偏好设置
      updatePreferences: (prefs) => {
        set(state => {
          const newPrefs = { ...state.preferences, ...prefs };
          storageService.preferences.set(newPrefs);
          return { preferences: newPrefs };
        });
      },

      resetPreferences: () => {
        set({ preferences: { ...defaultPreferences } });
        storageService.preferences.reset();
      },

      // API 设置
      setApiSettings: (provider, settings) => {
        set(state => {
          const newSettings = {
            ...state.apiSettings,
            [provider]: settings
          };
          storageService.modelSettings.set(provider, settings);
          return { apiSettings: newSettings };
        });
      },

      removeApiSettings: (provider) => {
        set(state => {
          const { [provider]: _, ...rest } = state.apiSettings;
          storageService.modelSettings.delete(provider);
          return { apiSettings: rest };
        });
      },

      getApiSettings: (provider) => {
        return get().apiSettings[provider] || null;
      },

      // 最近文件
      addRecentFile: (path) => {
        set(state => {
          const files = [path, ...state.recentFiles.filter(f => f !== path)].slice(0, 20);
          storageService.recentFiles.add(path);
          return { recentFiles: files };
        });
      },

      removeRecentFile: (path) => {
        set(state => {
          const files = state.recentFiles.filter(f => f !== path);
          storageService.recentFiles.remove(path);
          return { recentFiles: files };
        });
      },

      clearRecentFiles: () => {
        set({ recentFiles: [] });
        storageService.recentFiles.clear();
      }
    }),
    {
      name: 'reelforge-user-storage',
      partialize: (state) => ({
        userId: state.userId,
        username: state.username,
        email: state.email,
        avatar: state.avatar,
        preferences: state.preferences,
        apiSettings: state.apiSettings,
        recentFiles: state.recentFiles
      })
    }
  )
);
