/**
 * App Store - 全局应用状态
 * 包含: 用户认证、UI状态、通知、设置、自动保存
 */
import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import type { User } from '@/core/types';

// ==========================================
// 类型定义
// ==========================================
export interface UserSettings {
  compactMode: boolean;
  language: string;
  recentProjects: string[];
}

export interface AppState {
  // 用户状态
  user: User | null;
  isAuthenticated: boolean;

  // UI 状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';

  // 通知
  notifications: number;

  // 自动保存（提升到顶层，方便调用）
  autoSave: boolean;

  // 用户设置
  userSettings: UserSettings;

  // Actions
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  logout: () => void;
  setNotifications: (count: number) => void;
  clearNotifications: () => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  setAutoSave: (autoSave: boolean) => void;
}

// ==========================================
// 默认值
// ==========================================
const defaultSettings: UserSettings = {
  compactMode: false,
  language: 'zh-CN',
  recentProjects: [],
};

// ==========================================
// Store 创建
// ==========================================
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set): AppState => ({
      // 初始状态
      user: null as User | null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      theme: 'light' as const,
      notifications: 0,
      autoSave: true,
      userSettings: defaultSettings,

      // Actions
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
    }),
    {
      name: 'StoryFab-app',
      storage: createJSONStorage(() => localStorage),
      // 只持久化这些字段
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        userSettings: state.userSettings,
        autoSave: state.autoSave,
      }),
    }
    ),
    { name: 'AppStore' }
  )
);
