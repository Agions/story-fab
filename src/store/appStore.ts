import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

// ============================================
// App Store - 全局应用状态
// ============================================
export interface AppState {
  // 用户状态
  user: User | null;
  isAuthenticated: boolean;

  // UI 状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';

  // Actions
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      theme: 'light',

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'clipflow-app' }
  )
);

export default useAppStore;
