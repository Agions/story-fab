import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ToastProvider } from '@/components/ui/toast';

// App Provider Props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * CutDeck Design System — antd removed
 * Theme tokens are now in globals.css CSS variables
 * Component-level antd theming has been removed
 * Dark mode is handled via Tailwind .dark class on <html>
 */

/**
 * 全局主题配置获取器
 * NOTE: ConfigProvider 已移除 — CSS 变量在 globals.css 中定义
 * 如需额外主题配置，可通过 CSS 变量或 Tailwind 配置实现
 */
const ThemeConfigurator: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ThemeProvider handles dark/light mode via class on <html>
  return <>{children}</>;
};

/**
 * 应用根Provider组件
 * 包含所有需要的Context Provider
 * antd ConfigProvider 已移除（theme tokens 在 globals.css）
 */
const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <ThemeConfigurator>{children}</ThemeConfigurator>
        </ToastProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
