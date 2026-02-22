/**
 * 应用状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIModel } from '@/core/types';

export interface AppState {
  // UI 状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
  
  // 当前选中
  currentProjectId: string | null;
  currentModel: AIModel | null;
  
  // 全局加载状态
  isLoading: boolean;
  loadingMessage: string;
  
  // 通知
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  
  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'zh' | 'en') => void;
  setCurrentProject: (projectId: string | null) => void;
  setCurrentModel: (model: AIModel | null) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sidebarCollapsed: false,
      theme: 'auto',
      language: 'zh',
      currentProjectId: null,
      currentModel: null,
      isLoading: false,
      loadingMessage: '',
      notifications: [],

      // Actions
      toggleSidebar: () => set(state => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setCurrentProject: (projectId) => set({ 
        currentProjectId: projectId 
      }),

      setCurrentModel: (model) => set({ 
        currentModel: model 
      }),

      setLoading: (isLoading, message = '') => set({ 
        isLoading, 
        loadingMessage: message 
      }),

      addNotification: (notification) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set(state => ({
          notifications: [
            ...state.notifications,
            { ...notification, id }
          ]
        }));

        // 自动移除
        const duration = notification.duration ?? 3000;
        setTimeout(() => {
          get().removeNotification(id);
        }, duration);
      },

      removeNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      clearAllNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'reelforge-app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language,
        currentProjectId: state.currentProjectId,
        currentModel: state.currentModel
      })
    }
  )
);
