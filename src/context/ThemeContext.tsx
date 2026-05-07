/**
 * Theme Context
 *
 * 管理深色/浅色模式，通过 <html> class 切换
 * 底层使用 appStore 的 theme 状态
 */
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDarkMode: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
