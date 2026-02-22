import React, { ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTheme } from '../context/ThemeContext';
import useTranslation from '../utils/i18n';

// App Provider Props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * 全局主题配置获取器
 * 用于在ThemeProvider内获取主题配置
 */
const ThemeConfigurator: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDarkMode } = useTheme();
  const { language } = useTranslation();

  // 根据语言选择Ant Design的语言包
  const antdLocale = language === 'zh' ? zhCN : enUS;
  
  // 亮色/暗色主题的共享组件样式
  const sharedComponentStyles = {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 500,
      primaryShadow: isDarkMode ? 'none' : '0 2px 6px rgba(30, 136, 229, 0.2)',
    },
    Card: {
      borderRadius: 12,
      boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    Menu: {
      itemBorderRadius: 8,
      subMenuItemBorderRadius: 6,
    },
    Modal: {
      borderRadius: 12,
    },
    Select: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
    Radio: {
      borderRadius: 8,
    },
    Checkbox: {
      borderRadius: 4,
    },
    Avatar: {
      borderRadius: 8,
    },
    Dropdown: {
      borderRadius: 8,
      paddingBlock: 4,
      paddingInline: 0,
    },
    Tabs: {
      cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
      cardGutter: 4,
    },
    Table: {
      borderRadius: 12,
      headerBg: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#f5f7fa',
    },
  };

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: '#1E88E5',
          colorSuccess: '#26A69A',
          colorWarning: '#FF9800',
          colorError: '#FF5252',
          colorInfo: '#42A5F5',
          borderRadius: 8,
          wireframe: false,
          fontSize: 14,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
          colorTextBase: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
          colorBgBase: isDarkMode ? '#121212' : '#ffffff',
          colorBgElevated: isDarkMode ? '#1f1f1f' : '#ffffff',
          colorBorder: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
          motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        },
        components: sharedComponentStyles,
        algorithm: isDarkMode ? 
          theme.darkAlgorithm : 
          theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        {children}
      </AntdApp>
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
        <ThemeConfigurator>
          {children}
        </ThemeConfigurator>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default AppProvider; 