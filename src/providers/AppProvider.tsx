import React, { ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useTheme } from '../context/ThemeContext';

// App Provider Props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * 科技暗黑主题配色
 */
const getDarkThemeTokens = () => ({
  // 主色 - 靛蓝紫
  colorPrimary: '#6366f1',
  colorPrimaryHover: '#7c7ff7',
  colorPrimaryActive: '#5558e3',
  colorPrimaryBg: 'rgba(99, 102, 241, 0.15)',
  colorPrimaryBgHover: 'rgba(99, 102, 241, 0.25)',

  // 功能色
  colorSuccess: '#10b981',
  colorSuccessBg: 'rgba(16, 185, 129, 0.15)',
  colorWarning: '#f59e0b',
  colorWarningBg: 'rgba(245, 158, 11, 0.15)',
  colorError: '#ef4444',
  colorErrorBg: 'rgba(239, 68, 68, 0.15)',
  colorInfo: '#3b82f6',
  colorInfoBg: 'rgba(59, 130, 246, 0.15)',

  // 辅助色
  colorTextBase: '#f1f5f9',
  colorBgBase: '#0a0a0f',
  colorBgContainer: '#12121a',
  colorBgElevated: '#1a1a24',
  colorBgLayout: '#0a0a0f',

  // 边框和分割线
  colorBorder: '#2a2a3a',
  colorBorderSecondary: '#3a3a4a',

  // 文字颜色
  colorText: '#f1f5f9',
  colorTextSecondary: '#94a3b8',
  colorTextTertiary: '#64748b',
  colorTextQuaternary: '#475569',

  // 圆角
  borderRadius: 8,

  // 其他
  wireframe: false,
  fontSize: 14,
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Noto Sans SC', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
});

/**
 * 亮色主题配色
 */
const getLightThemeTokens = () => ({
  colorPrimary: '#6366f1',
  colorPrimaryHover: '#7c7ff7',
  colorPrimaryActive: '#5558e3',
  colorPrimaryBg: 'rgba(99, 102, 241, 0.1)',
  colorPrimaryBgHover: 'rgba(99, 102, 241, 0.2)',

  colorSuccess: '#10b981',
  colorSuccessBg: 'rgba(16, 185, 129, 0.1)',
  colorWarning: '#f59e0b',
  colorWarningBg: 'rgba(245, 158, 11, 0.1)',
  colorError: '#ef4444',
  colorErrorBg: 'rgba(239, 68, 68, 0.1)',
  colorInfo: '#3b82f6',
  colorInfoBg: 'rgba(59, 130, 246, 0.1)',

  colorTextBase: 'rgba(0, 0, 0, 0.87)',
  colorBgBase: '#ffffff',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#f5f7fa',

  colorBorder: 'rgba(0, 0, 0, 0.08)',
  colorBorderSecondary: 'rgba(0, 0, 0, 0.04)',

  colorText: 'rgba(0, 0, 0, 0.87)',
  colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
  colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
  colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',

  borderRadius: 8,

  wireframe: false,
  fontSize: 14,
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Noto Sans SC', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
});

/**
 * 全局主题配置获取器
 * 用于在ThemeProvider内获取主题配置
 */
const ThemeConfigurator: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDarkMode } = useTheme();

  // 获取主题 tokens
  const themeTokens = isDarkMode ? getDarkThemeTokens() : getLightThemeTokens();

  // 共享组件样式
  const sharedComponentStyles = {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 500,
      primaryShadow: isDarkMode
        ? '0 4px 12px rgba(99, 102, 241, 0.3)'
        : '0 2px 6px rgba(99, 102, 241, 0.2)',
    },
    Card: {
      borderRadiusLG: 12,
      borderRadiusSM: 8,
      boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    Menu: {
      itemBorderRadius: 8,
      subMenuItemBorderRadius: 6,
      itemBg: isDarkMode ? 'transparent' : 'transparent',
      itemSelectedBg: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      itemSelectedColor: '#6366f1',
    },
    Modal: {
      borderRadiusLG: 12,
      contentBg: isDarkMode ? '#12121a' : '#ffffff',
      headerBg: isDarkMode ? '#12121a' : '#ffffff',
    },
    Select: {
      borderRadius: 8,
      optionSelectedBg: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
    },
    Input: {
      borderRadius: 8,
      activeBorderColor: '#6366f1',
      hoverBorderColor: isDarkMode ? '#4a4a5a' : '#6366f1',
    },
    Radio: {
      borderRadius: 4,
    },
    Checkbox: {
      borderRadiusSM: 4,
    },
    Avatar: {
      borderRadius: 8,
    },
    Dropdown: {
      borderRadiusLG: 8,
      paddingBlock: 4,
      paddingInline: 8,
    },
    Tabs: {
      cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
      cardGutter: 4,
      inkBarColor: '#6366f1',
      itemActiveColor: '#6366f1',
      itemSelectedColor: '#6366f1',
    },
    Table: {
      borderRadiusLG: 12,
      headerBg: isDarkMode ? '#1a1a24' : '#f5f7fa',
      headerColor: isDarkMode ? '#94a3b8' : 'rgba(0, 0, 0, 0.65)',
      rowHoverBg: isDarkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Tooltip: {
      borderRadius: 8,
    },
    Popover: {
      borderRadiusLG: 12,
    },
    Progress: {
      defaultColor: '#6366f1',
    },
    Slider: {
      trackBg: 'rgba(99, 102, 241, 0.3)',
      railBg: isDarkMode ? '#2a2a3a' : '#e0e0e0',
    },
    Switch: {
      primaryColor: '#6366f1',
    },
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: themeTokens,
        components: sharedComponentStyles as any,
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  );
};

/**
 * 应用根Provider组件
 * 包含所有需要的Context Provider
 */
const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ThemeConfigurator>{children}</ThemeConfigurator>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
