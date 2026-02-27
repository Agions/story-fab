/**
 * App Store - 全局应用状态
 * 包含: 用户认证、UI状态、通知、设置
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from './types';

// ============================================
// 类型定义
// ============================================
export interface UserSettings {
  autoSave: boolean;
  compactMode: boolean;
  language: string;
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
}

// ============================================
// 默认值
// ============================================
const defaultSettings: UserSettings = {
  autoSave: true,
  compactMode: false,
  language: 'zh-CN',
};

// ============================================
// Store 创建
// ============================================
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      theme: 'light',
      notifications: 0,
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
    }),
    {
      name: 'clipflow-app',
      storage: createJSONStorage(() => localStorage),
      // 只持久化这些字段
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        userSettings: state.userSettings,
        // 可选：持久化用户登录状态（根据需求）
        // user: state.user,
        // isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAppStore;
