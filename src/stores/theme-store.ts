/**
 * Theme Store — Zustand v5
 *
 * Replaces src/context/theme-context.tsx
 * Provides the same API: useThemeStore() with theme, setTheme, toggleTheme, isDarkMode
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useAppStore } from './app-store';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const applyThemeClass = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export const useThemeStore = create<ThemeState>()(
  subscribeWithSelector((set, get) => ({
    theme: 'light',
    isDarkMode: false,

    setTheme: (theme: Theme) => {
      set({ theme, isDarkMode: theme === 'dark' });
      applyThemeClass(theme);
      useAppStore.getState().setTheme(theme);
    },

    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  }))
);
