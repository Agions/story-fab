import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettingsStore, AppSettings } from '../hooks/useSettings';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  addRecentProject: (projectId: string) => void;
}

// 创建Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider组件
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, updateSettings, resetSettings, addRecentProject } = useSettingsStore();

  // 初始化时应用主题设置
  useEffect(() => {
    const applyTheme = () => {
      // 获取主题设置
      const { theme } = settings;
      
      // 根据主题设置和系统偏好确定是否使用暗色主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDarkTheme = theme === 'dark' || (theme === 'auto' && prefersDark);
      
      // 应用主题
      document.documentElement.classList.toggle('dark', shouldUseDarkTheme);
      document.documentElement.classList.toggle('dark-theme', shouldUseDarkTheme);
      
      // 更新<html>标签的data-theme属性，供CSS变量使用
      document.documentElement.setAttribute('data-theme', shouldUseDarkTheme ? 'dark' : 'light');
      
      // 更新背景色和文字颜色
      if (shouldUseDarkTheme) {
        document.body.style.backgroundColor = '#141414';
        document.body.style.color = 'rgba(255, 255, 255, 0.85)';
      } else {
        document.body.style.backgroundColor = '#fff';
        document.body.style.color = 'rgba(0, 0, 0, 0.85)';
      }
    };
    
    // 应用主题
    applyTheme();
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'auto') {
        applyTheme();
      }
    };
    
    // 添加监听器
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
  }, [settings.theme]);
  
  // 应用语言设置
  useEffect(() => {
    document.documentElement.setAttribute('lang', settings.language);
  }, [settings.language]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, addRecentProject }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 使用Context的Hook
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings必须在SettingsProvider内部使用');
  }
  return context;
};

export default SettingsContext; 