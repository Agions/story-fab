import { create } from 'zustand';

interface AppState {
  notifications: number;
  setNotifications: (count: number) => void;
  clearNotifications: () => void;
  userSettings: {
    autoSave: boolean;
    compactMode: boolean;
    language: string;
  };
  updateUserSettings: (settings: Partial<AppState['userSettings']>) => void;
}

// 创建 store 实例
export const useAppStore = create<AppState>()((set) => ({
  notifications: 0,
  setNotifications: (count: number) => set((state) => ({ ...state, notifications: count })),
  clearNotifications: () => set((state) => ({ ...state, notifications: 0 })),
  userSettings: {
    autoSave: true,
    compactMode: false,
    language: 'zh-CN',
  },
  updateUserSettings: (settings: Partial<AppState['userSettings']>) =>
    set((state) => ({
      ...state,
      userSettings: { ...state.userSettings, ...settings },
    })),
})); 