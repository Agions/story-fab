import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  themeMode: 'auto',
  setThemeMode: () => {},
  toggleTheme: () => {}
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // 默认使用暗色主题
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark'); // 默认暗色主题

  useEffect(() => {
    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 设置主题模式
    const initialMode: ThemeMode = savedTheme || 'auto';
    setThemeModeState(initialMode);
    
    // 如果有保存的主题设置，使用该设置；否则，使用系统偏好
    const initialDarkMode = savedTheme 
      ? savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark)
      : prefersDark;
    
    setIsDarkMode(initialDarkMode);
    
    // 应用主题
    applyTheme(initialDarkMode);
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (savedTheme === null || savedTheme === 'auto') {
        // 如果用户未手动设置主题或为auto，则跟随系统
        setIsDarkMode(e.matches);
        applyTheme(e.matches);
      }
    };
    
    // 添加事件监听
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
    }
    
    // 清理函数
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // 兼容旧版浏览器
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('theme', mode);
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const newDarkMode = mode === 'dark' || (mode === 'auto' && prefersDark);
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
  };

  const applyTheme = (dark: boolean) => {
    const rootElement = document.documentElement;

    // 使用科技暗黑设计系统配色
    if (dark) {
      rootElement.classList.add('dark-theme');
      document.body.style.backgroundColor = '#0C0D14'; // 主背景 - 深炭底
      document.body.style.color = '#f1f5f9';

      // 科技暗黑配色系统
      rootElement.style.setProperty('--text-color-primary', '#f1f5f9');
      rootElement.style.setProperty('--text-color-secondary', '#94a3b8');
      rootElement.style.setProperty('--text-color-disabled', '#475569');
      rootElement.style.setProperty('--bg-color-primary', '#0C0D14');
      rootElement.style.setProperty('--bg-color-secondary', '#12121a');
      rootElement.style.setProperty('--bg-color-component', '#12121a');
      rootElement.style.setProperty('--border-color', '#2a2a3a');
      rootElement.style.setProperty('--primary-color', '#FF9F43');
      rootElement.style.setProperty('--form-label-color', '#f1f5f9');

      // 背景渐变装饰
      document.body.style.backgroundImage =
        'radial-gradient(ellipse at 20% 0%, rgba(255, 159, 67, 0.08) 0%, transparent 50%), ' +
        'radial-gradient(ellipse at 80% 100%, rgba(0, 212, 255, 0.06) 0%, transparent 50%)';
      document.body.style.backgroundAttachment = 'fixed';

      // 避免深色下的半透明叠加
      document.body.querySelectorAll('.ant-form-item-label > label').forEach(
        (el) => (el as HTMLElement).style.color = '#f1f5f9'
      );
    } else {
      rootElement.classList.remove('dark-theme');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = 'rgba(0, 0, 0, 0.85)';
      document.body.style.backgroundImage = 'none';

      // 重置CSS变量
      rootElement.style.setProperty('--text-color-primary', 'rgba(0, 0, 0, 0.85)');
      rootElement.style.setProperty('--text-color-secondary', 'rgba(0, 0, 0, 0.65)');
      rootElement.style.setProperty('--text-color-disabled', 'rgba(0, 0, 0, 0.25)');
      rootElement.style.setProperty('--bg-color-primary', '#ffffff');
      rootElement.style.setProperty('--bg-color-secondary', '#f0f2f5');
      rootElement.style.setProperty('--bg-color-component', '#ffffff');
      rootElement.style.setProperty('--border-color', '#d9d9d9');
      rootElement.style.setProperty('--primary-color', '#E8891C');
      rootElement.style.setProperty('--form-label-color', 'rgba(0, 0, 0, 0.85)');

      // 重置表单标签颜色
      document.body.querySelectorAll('.ant-form-item-label > label').forEach(
        (el) => (el as HTMLElement).style.color = ''
      );
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    const newMode: ThemeMode = newDarkMode ? 'dark' : 'light';
    setIsDarkMode(newDarkMode);
    setThemeModeState(newMode);
    localStorage.setItem('theme', newMode);
    applyTheme(newDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext; 